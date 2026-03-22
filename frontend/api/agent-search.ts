import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from "node:http";

import {
  normalizeProfile,
  runAgentSearchStream,
  type AgentSearchEvent,
} from "../lib/agent-search-route.js";

export const config = {
  supportsResponseStreaming: true,
};

interface JsonRequest extends IncomingMessage {
  body?: unknown;
}

function buildNodeCorsHeaders(): OutgoingHttpHeaders {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
  };
}

function writeJson(
  response: ServerResponse<IncomingMessage>,
  status: number,
  payload: Record<string, string>,
): void {
  response.writeHead(status, {
    ...buildNodeCorsHeaders(),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function writeEvent(response: ServerResponse<IncomingMessage>, event: AgentSearchEvent): void {
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function readRequestBody(request: JsonRequest): Promise<unknown> {
  if (request.body !== undefined) {
    return request.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function handleAgentSearch(
  request: JsonRequest,
  response: ServerResponse<IncomingMessage>,
): Promise<void> {
  if (request.method === "OPTIONS") {
    response.writeHead(204, buildNodeCorsHeaders());
    response.end();
    return;
  }

  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Method not allowed" });
    return;
  }

  let body: unknown;
  try {
    body = await readRequestBody(request);
  } catch {
    writeJson(response, 400, { error: "Request body must be valid JSON." });
    return;
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
    writeJson(response, 400, { error: "Prompt is required." });
    return;
  }

  response.writeHead(200, {
    ...buildNodeCorsHeaders(),
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "content-type": "text/event-stream; charset=utf-8",
  });
  response.flushHeaders();

  try {
    await runAgentSearchStream(prompt, profile, (event) => {
      writeEvent(response, event);
    });
  } finally {
    response.end();
  }
}
