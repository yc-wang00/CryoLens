import type { AgentToolCall } from "../types";
import type { HypothesisCard } from "./cryo-lens";

const AGENT_API_BASE_URL = import.meta.env.VITE_AGENT_API_BASE_URL ?? "";

export type AgentProfile = "research" | "hypothesis";

export type AgentSearchStreamEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "tool_output"; output: string }
  | { type: "result"; text: string }
  | { type: "hypothesis_saved"; hypothesis: HypothesisCard }
  | { type: "error"; message: string };

export interface LiveAgentSearchState {
  prompt: string;
  profile: AgentProfile;
  assistantText: string;
  errorMessage: string | null;
  finished: boolean;
  phase: string;
  savedHypothesisCard: HypothesisCard | null;
  statusHistory: string[];
  statusMessage: string;
  toolCalls: AgentToolCall[];
}

function buildUrl(path: string): string {
  if (!AGENT_API_BASE_URL) {
    return path;
  }

  return `${AGENT_API_BASE_URL}${path}`;
}

function parseEventBlock(block: string): AgentSearchStreamEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");

  if (!data) {
    return null;
  }

  return JSON.parse(data) as AgentSearchStreamEvent;
}

export async function streamAgentSearch(
  prompt: string,
  profile: AgentProfile,
  onEvent: (event: AgentSearchStreamEvent) => void,
): Promise<void> {
  const response = await fetch(buildUrl("/api/agent-search"), {
    body: JSON.stringify({ prompt, profile }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const fallbackMessage = `Agent search failed with status ${response.status}.`;
    let errorMessage = fallbackMessage;

    try {
      const payload = (await response.json()) as { error?: string };
      errorMessage = payload.error ?? fallbackMessage;
    } catch {
      errorMessage = fallbackMessage;
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Agent search response did not include a stream.");
  }

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
      if (event) {
        onEvent(event);
      }
    }
  }

  const trailingEvent = parseEventBlock(buffer);
  if (trailingEvent) {
    onEvent(trailingEvent);
  }
}
