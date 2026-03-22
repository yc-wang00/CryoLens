/**
 * AGENT SEARCH SMOKE TEST
 * =======================
 * Programmatically exercise the `/api/agent-search` handler, persist the full
 * SSE stream to disk, and fail fast if the sandbox does not reach multiple
 * tool calls plus a final result.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import handler from "../../api/agent-search.ts";

type AgentSearchEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "result"; text?: string }
  | { type: "hypothesis_saved"; hypothesis: { id: string; title: string } }
  | { type: "error"; message: string };

function parseEventBlock(block: string): AgentSearchEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");

  if (!data) {
    return null;
  }

  return JSON.parse(data) as AgentSearchEvent;
}

async function readSse(response: Response): Promise<AgentSearchEvent[]> {
  if (!response.body) {
    throw new Error("Agent search response did not include a stream.");
  }

  const events: AgentSearchEvent[] = [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const event = parseEventBlock(chunk);
      if (!event) {
        continue;
      }

      events.push(event);
      console.log(JSON.stringify(event));
    }
  }

  const trailingEvent = parseEventBlock(buffer);
  if (trailingEvent) {
    events.push(trailingEvent);
    console.log(JSON.stringify(trailingEvent));
  }

  return events;
}

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(" ").trim()
    || "Use the MCP server to explain what hooks are in Claude Code. Call at least two relevant MCP tools before answering, and finish with a section titled 'What I'd Need For Real Research'.";
  const response = await handler(new Request("http://localhost/api/agent-search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      profile: "research",
      prompt,
    }),
  }));

  if (!response.ok) {
    throw new Error(`Agent search returned ${response.status}`);
  }

  const events = await readSse(response);
  const outputDir = "/tmp/cryosight-agent-smoke";
  const outputPath = path.join(outputDir, `agent-search-${Date.now()}.jsonl`);
  const toolStarts = events.filter((event) => event.type === "tool_start");
  const resultEvent = events.findLast((event) => event.type === "result");
  const errorEvent = events.find((event) => event.type === "error");

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    outputPath,
    `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
    "utf8",
  );

  console.log(`\nSaved stream log to ${outputPath}`);
  console.log(`Tool calls: ${toolStarts.length}`);
  console.log(`Final result present: ${Boolean(resultEvent)}`);
  if (resultEvent?.type === "result") {
    const preview = typeof resultEvent.text === "string" && resultEvent.text.trim()
      ? resultEvent.text
      : JSON.stringify(resultEvent);
    console.log(`Final result preview: ${preview.slice(0, 400)}`);
  }

  if (errorEvent) {
    throw new Error(`Smoke test saw agent error: ${errorEvent.message}`);
  }

  if (toolStarts.length < 2) {
    throw new Error(`Expected at least 2 tool calls, saw ${toolStarts.length}`);
  }

  if (!resultEvent || resultEvent.type !== "result" || !resultEvent.text?.trim()) {
    throw new Error("Smoke test did not receive a final result event.");
  }
}

void main();
