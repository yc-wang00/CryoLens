"""Agent chat endpoint — streams Claude Agent SDK responses as SSE."""

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
    UserMessage,
    query,
)
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["chat"])

MCP_URL = os.environ.get("CRYOLENS_MCP_URL", "https://mcp.cryolens.io/mcp")
DEFAULT_MODEL = os.environ.get("CLAUDE_AGENT_MODEL", "claude-sonnet-4-20250514")

SYSTEM_PROMPT = (
    "You are CryoLens, an AI research assistant for cryopreservation science. "
    "You have access to the CryoLens database containing structured data from "
    "1,200+ cryobiology papers: compounds, viability measurements, formulations, "
    "protocols, and findings. Use the cryolens MCP tools to answer questions "
    "with grounded, cited data. Always cite paper DOIs when presenting findings."
)


class ChatRequest(BaseModel):
    message: str
    model: str = DEFAULT_MODEL


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


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
        system_prompt=SYSTEM_PROMPT,
    )

    try:
        async for message in query(prompt=req.message, options=options):
            if isinstance(message, SystemMessage):
                yield _sse("status", {
                    "phase": message.subtype,
                    "message": f"Agent: {message.subtype}",
                })

            elif isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        yield _sse("text", {"text": block.text})
                    elif isinstance(block, ThinkingBlock):
                        yield _sse("thinking", {"thinking": block.thinking})
                    elif isinstance(block, ToolUseBlock):
                        yield _sse("tool_use", {
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                    elif isinstance(block, ToolResultBlock):
                        content = block.content
                        if isinstance(content, list):
                            content = json.dumps(content, default=str)
                        yield _sse("tool_result", {
                            "tool_use_id": block.tool_use_id,
                            "content": str(content)[:3000] if content else "",
                            "is_error": block.is_error,
                        })

            elif isinstance(message, UserMessage):
                # Tool results come as UserMessage in the Agent SDK
                if isinstance(message.content, list):
                    for block in message.content:
                        if isinstance(block, ToolResultBlock):
                            content = block.content
                            if isinstance(content, list):
                                content = json.dumps(content, default=str)
                            yield _sse("tool_result", {
                                "tool_use_id": message.parent_tool_use_id or "",
                                "content": str(content)[:3000] if content else "",
                                "is_error": block.is_error,
                            })

            elif isinstance(message, ResultMessage):
                yield _sse("result", {
                    "subtype": message.subtype,
                    "is_error": message.is_error,
                    "duration_ms": message.duration_ms,
                    "total_cost_usd": message.total_cost_usd,
                    "num_turns": message.num_turns,
                })

    except Exception as e:
        yield _sse("error", {"message": str(e)})

    yield _sse("done", {})


@router.post("/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        _stream_agent(req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
