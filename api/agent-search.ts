import { runSandboxedAgentSearch, type AgentProfile } from "../frontend/lib/claude-sandbox.ts";

interface SavedHypothesis {
  id: string;
  title: string;
  status: string;
  benchmark: string;
  target: string;
  summary: string;
  evidenceIds: string[];
  nextStep: string;
}

type AgentSearchEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "result"; text: string }
  | { type: "hypothesis_saved"; hypothesis: SavedHypothesis }
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

function normalizeProfile(value: unknown): AgentProfile {
  return value === "hypothesis" ? "hypothesis" : "research";
}

function extractJsonObject(text: string): string | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/u);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function parseHypothesisDraft(text: string): Omit<SavedHypothesis, "id"> {
  const candidate = extractJsonObject(text);
  if (!candidate) {
    throw new Error("Hypothesis run did not return a JSON object.");
  }

  const payload = JSON.parse(candidate) as Record<string, unknown>;
  const evidenceIds = Array.isArray(payload.evidenceIds)
    ? payload.evidenceIds.filter((value): value is string => typeof value === "string")
    : [];

  return {
    title: typeof payload.title === "string" ? payload.title : "Untitled hypothesis",
    status: typeof payload.status === "string" ? payload.status : "draft",
    benchmark:
      typeof payload.benchmark === "string" ? payload.benchmark : "Unspecified benchmark",
    target: typeof payload.target === "string" ? payload.target : "Unspecified target",
    summary:
      typeof payload.summary === "string"
        ? payload.summary
        : "Generated hypothesis draft requires review.",
    evidenceIds,
    nextStep:
      typeof payload.nextStep === "string"
        ? payload.nextStep
        : "Review the generated draft and define the first validation assay.",
  };
}

function buildBackendCandidates(): string[] {
  const configuredBaseUrl = process.env.VITE_API_BASE_URL?.trim();
  const ordered = [
    configuredBaseUrl,
    "http://127.0.0.1:8000",
    "http://localhost:8000",
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(ordered.map((value) => value.replace(/\/+$/, ""))));
}

async function saveHypothesisDraft(
  draft: Omit<SavedHypothesis, "id">,
  sourcePrompt: string,
): Promise<SavedHypothesis> {
  let lastFailure = "Unknown failure";

  for (const baseUrl of buildBackendCandidates()) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/hypotheses`, {
        body: JSON.stringify({
          ...draft,
          agentProfile: "hypothesis",
          sourcePrompt,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        lastFailure = `status ${response.status}`;
        continue;
      }

      const payload = (await response.json()) as SavedHypothesis;
      return payload;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`Failed to save hypothesis draft. Last failure: ${lastFailure}`);
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
  const profile =
    typeof body === "object" && body !== null && "profile" in body
      ? normalizeProfile(body.profile)
      : "research";

  if (!prompt) {
    return jsonResponse(400, { error: "Prompt is required." });
  }

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      const send = (event: AgentSearchEvent): void => {
        controller.enqueue(encodeEvent(event));
      };
      let finalResultText = "";

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
          onEvent: (event) => {
            if (event.type === "result") {
              finalResultText = event.text;
            }
            send(event);
          },
          profile,
          prompt,
        });

        if (profile === "hypothesis") {
          send({
            type: "status",
            phase: "hypothesis",
            message: "Saving hypothesis draft to the backend.",
          });
          const hypothesis = await saveHypothesisDraft(
            parseHypothesisDraft(finalResultText),
            prompt,
          );
          send({ type: "hypothesis_saved", hypothesis });
        }
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
