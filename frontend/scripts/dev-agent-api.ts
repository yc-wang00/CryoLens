/**
 * LOCAL AGENT API SERVER
 * ======================
 * Run the Ask agent route locally without relying on `vercel dev`.
 *
 * This server reuses the same route handler as the deployed Vercel function,
 * including the Vercel Sandbox orchestration path.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import handleAgentSearch from "../lib/agent-search-route-local.ts";

const PORT = Number.parseInt(process.env.AGENT_API_PORT ?? "3210", 10);
async function readRequestBody(request: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function applyCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
  void request;
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type, authorization");
  response.setHeader("access-control-max-age", "86400");
}

async function writeWebResponse(nodeResponse: ServerResponse, webResponse: Response): Promise<void> {
  nodeResponse.statusCode = webResponse.status;

  webResponse.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  if (!webResponse.body) {
    nodeResponse.end();
    return;
  }

  const reader = webResponse.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    nodeResponse.write(Buffer.from(value));
  }

  nodeResponse.end();
}

const server = createServer(async (request, response) => {
  applyCorsHeaders(request, response);
  const startedAt = Date.now();

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    const body = await readRequestBody(request);
    const origin = `http://${request.headers.host ?? `127.0.0.1:${PORT}`}`;
    const webRequest = new Request(new URL(request.url ?? "/", origin), {
      body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
      headers: request.headers as HeadersInit,
      method: request.method,
    });

    console.log(
      `[agent-api] ${request.method ?? "GET"} ${request.url ?? "/"} origin=${request.headers.origin ?? "-"} host=${request.headers.host ?? "-"}`,
    );

    const webResponse = await handleAgentSearch(webRequest);
    await writeWebResponse(response, webResponse);
    console.log(
      `[agent-api] completed ${request.method ?? "GET"} ${request.url ?? "/"} with ${webResponse.status} in ${Date.now() - startedAt}ms`,
    );
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown local agent API failure.",
      }),
    );
    console.error(
      `[agent-api] failed ${request.method ?? "GET"} ${request.url ?? "/"} in ${Date.now() - startedAt}ms`,
      error,
    );
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Local agent API ready at http://127.0.0.1:${PORT}/api/agent-search`);
  console.log("Allowing any browser origin for local Ask development.");
});
