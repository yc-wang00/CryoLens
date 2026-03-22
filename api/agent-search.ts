import { runSandboxedAgentSearch } from "../frontend/lib/claude-sandbox.ts";

type AgentSearchEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

function jsonResponse(status: number, payload: object): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    status,
  });
}

function encodeEvent(event: AgentSearchEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export default async function handler(request: Request): Promise<Response> {
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

  if (!prompt) {
    return jsonResponse(400, { error: "Prompt is required." });
  }

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      const send = (event: AgentSearchEvent): void => {
        controller.enqueue(encodeEvent(event));
      };

      try {
        send({
          type: "status",
          phase: "queued",
          message: "Queued sandboxed CryoSight research run.",
        });

        await runSandboxedAgentSearch({
          onEvent: send,
          prompt,
        });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown agent-search failure.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}
