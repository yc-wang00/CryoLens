import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import agentSearchHandler from "../api/agent-search.ts";
import cryoLensDatasetHandler from "../api/cryo-lens-dataset.ts";

async function readRequestBody(request: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return undefined;
  }

  return Buffer.concat(chunks);
}

function buildRequestUrl(request: IncomingMessage): string {
  const host = request.headers.host ?? "localhost";
  const path = request.url ?? "/";
  return `http://${host}${path}`;
}

async function writeResponse(
  nodeResponse: ServerResponse,
  response: Response,
): Promise<void> {
  nodeResponse.statusCode = response.status;

  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  if (!response.body) {
    nodeResponse.end();
    return;
  }

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      nodeResponse.write(Buffer.from(value));
    }
  }

  nodeResponse.end();
}

function buildFetchHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

function loadApiHandler(pathname: string): ((request: Request) => Promise<Response>) | null {
  const routeMap: Record<string, (request: Request) => Promise<Response>> = {
    "/api/agent-search": agentSearchHandler,
    "/api/cryo-lens-dataset": cryoLensDatasetHandler,
  };

  return routeMap[pathname] ?? null;
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const requestUrl = request.url ? new URL(buildRequestUrl(request)) : null;
          const pathname = requestUrl?.pathname ?? "";

          const handler = loadApiHandler(pathname);
          if (!handler) {
            next();
            return;
          }

          const body =
            request.method && ["GET", "HEAD"].includes(request.method)
              ? undefined
              : await readRequestBody(request);
          const fetchRequest = new Request(buildRequestUrl(request), {
            body,
            headers: buildFetchHeaders(request),
            method: request.method,
          });

          try {
            const fetchResponse = await handler(fetchRequest);
            await writeResponse(response, fetchResponse);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            response.statusCode = 500;
            response.setHeader("content-type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: message }));
          }
        });
      },
      name: "cryo-vite-api-bridge",
    },
  ],
});
