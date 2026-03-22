/**
 * Agent search — streams from the FastAPI /api/v1/chat endpoint
 * which runs Claude Agent SDK with the CryoLens MCP server.
 */

import type { AgentToolCall } from "../types";

export type AgentSearchStreamEvent =
  | { type: "status"; phase: string; message: string }
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error: boolean }
  | { type: "result"; duration_ms: number; total_cost_usd: number; num_turns: number }
  | { type: "error"; message: string }
  | { type: "done" };

export interface LiveAgentSearchState {
  prompt: string;
  assistantText: string;
  errorMessage: string | null;
  finished: boolean;
  phase: string;
  statusHistory: string[];
  statusMessage: string;
  toolCalls: AgentToolCall[];
}

export async function streamAgentSearch(
  prompt: string,
  onEvent: (event: AgentSearchStreamEvent) => void,
): Promise<void> {
  const response = await fetch("/api/v1/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: prompt }),
  });

  if (!response.ok) {
    throw new Error(`Agent search failed with status ${response.status}.`);
  }

  if (!response.body) {
    throw new Error("Agent search response did not include a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ") && eventType) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent({ type: eventType, ...data } as AgentSearchStreamEvent);
        } catch {
          // skip malformed JSON
        }
        eventType = "";
      }
    }
  }
}
