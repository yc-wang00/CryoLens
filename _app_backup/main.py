"""CryoLens Agent API — minimal FastAPI backend.

Streams Claude Agent SDK responses as Server-Sent Events,
connected to the CryoLens MCP server.

Usage:
    uv run uvicorn app.main:app --port 3000
"""

import json
import os

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ThinkingBlock,
    ToolResultBlock,
    ToolUseBlock,
    query,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

MCP_URL = os.environ.get(
    "CRYOLENS_MCP_URL",
    "https://carefree-perfection-production-145c.up.railway.app/mcp",
)

app = FastAPI(title="CryoLens Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    model: str = "claude-sonnet-4-20250514"


def _serialize_event(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


async def _stream_agent(req: ChatRequest):
    options = ClaudeAgentOptions(
        model=req.model,
        mcp_servers={
            "cryolens": {
                "type": "http",
                "url": MCP_URL,
            }
        },
        allowed_tools=["mcp__cryolens__*"],
        permission_mode="bypassPermissions",
        max_turns=25,
        system_prompt=(
            "You are CryoLens, an AI research assistant for cryopreservation science. "
            "You have access to the CryoLens database containing structured data from "
            "100+ cryobiology papers: compounds, viability measurements, formulations, "
            "protocols, and findings. Use the cryolens MCP tools to answer questions "
            "with grounded, cited data. Always cite paper DOIs when presenting findings."
        ),
    )

    try:
        async for message in query(prompt=req.message, options=options):
            if isinstance(message, SystemMessage):
                yield _serialize_event("system", {
                    "subtype": message.subtype,
                    "mcp_servers": message.data.get("mcp_servers", []),
                })

            elif isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        yield _serialize_event("text", {"text": block.text})
                    elif isinstance(block, ThinkingBlock):
                        yield _serialize_event("thinking", {"thinking": block.thinking})
                    elif isinstance(block, ToolUseBlock):
                        yield _serialize_event("tool_use", {
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                    elif isinstance(block, ToolResultBlock):
                        content = block.content
                        if isinstance(content, list):
                            content = json.dumps(content, default=str)
                        yield _serialize_event("tool_result", {
                            "tool_use_id": block.tool_use_id,
                            "content": str(content)[:2000] if content else "",
                            "is_error": block.is_error,
                        })

            elif isinstance(message, ResultMessage):
                yield _serialize_event("result", {
                    "subtype": message.subtype,
                    "is_error": message.is_error,
                    "result": message.result,
                    "duration_ms": message.duration_ms,
                    "total_cost_usd": message.total_cost_usd,
                    "num_turns": message.num_turns,
                })

    except Exception as e:
        yield _serialize_event("error", {"message": str(e)})

    yield _serialize_event("done", {})


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        _stream_agent(req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/")
async def index():
    return FileResponse("app/index.html")
