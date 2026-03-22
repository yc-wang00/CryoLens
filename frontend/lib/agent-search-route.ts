/**
 * AGENT SEARCH ROUTE
 * ==================
 * Shared Request/Response handler for the deployed Vercel Ask endpoint.
 *
 * KEY CONCEPTS:
 * - preserve the Ask SSE event contract
 * - delegate sandbox orchestration to `claude-sandbox.ts`
 * - keep deployment and local-dev handlers behaviorally aligned
 *
 * USAGE:
 * - imported by `api/agent-search.ts`
 * - imported by `frontend/api/agent-search.ts`
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 * - MEM-0014
 */
import { runSandboxedAgentSearch, type AgentProfile } from "./claude-sandbox.js";

export type AgentSearchEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "tool_output"; output: string }
  | { type: "result"; text: string }
  | {
      type: "hypothesis_saved";
      hypothesis: {
        id: string;
        title: string;
        status: string;
        benchmark: string;
        target: string;
        summary: string;
        evidenceIds: string[];
        nextStep: string;
      };
    }
  | { type: "error"; message: string };

export function buildCorsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
  };
}

function jsonResponse(status: number, payload: object): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...buildCorsHeaders(),
      "content-type": "application/json; charset=utf-8",
    },
    status,
  });
}

function encodeEvent(event: AgentSearchEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export function normalizeProfile(value: unknown): AgentProfile {
  return value === "hypothesis" ? "hypothesis" : "research";
}

export async function runAgentSearchStream(
  prompt: string,
  profile: AgentProfile,
  send: (event: AgentSearchEvent) => void,
): Promise<void> {
  try {
    send({
      type: "status",
      phase: "queued",
      message:
        profile === "hypothesis"
          ? "Queued sandboxed CryoSight hypothesis run."
          : "Queued sandboxed CryoSight research run.",
    });

    await runSandboxedAgentSearch({
      onEvent: send,
      profile,
      prompt,
    });
  } catch (error) {
    send({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown agent-search failure.",
    });
  }
}

export default async function handleAgentSearch(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: buildCorsHeaders(),
      status: 204,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string"
      ? body.prompt.trim()
      : "";
  const profile =
    typeof body === "object" && body !== null && "profile" in body
      ? normalizeProfile(body.profile)
      : "research";

  if (!prompt) {
    return jsonResponse(400, { error: "Prompt is required." });
  }

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const send = (event: AgentSearchEvent): void => {
        controller.enqueue(encodeEvent(event));
      };

      void (async () => {
        try {
          await runAgentSearchStream(prompt, profile, send);
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      ...buildCorsHeaders(),
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}
