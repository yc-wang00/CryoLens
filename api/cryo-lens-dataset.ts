function jsonResponse(status: number, payload: object): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    status,
  });
}

function buildCandidateBaseUrls(): string[] {
  const configuredBaseUrl = process.env.VITE_API_BASE_URL?.trim();
  const ordered = [
    configuredBaseUrl,
    "http://127.0.0.1:8000",
    "http://localhost:8000",
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(ordered.map((value) => value.replace(/\/+$/, ""))));
}

export default async function handler(): Promise<Response> {
  let lastError: unknown = null;

  for (const baseUrl of buildCandidateBaseUrls()) {
    try {
      console.info(`[cryo-lens-dataset] proxy fetch -> ${baseUrl}/api/v1/cryo-lens/dataset`);
      const response = await fetch(`${baseUrl}/api/v1/cryo-lens/dataset`, {
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend dataset fetch failed with ${response.status}`);
      }

      const payload = await response.text();
      console.info(`[cryo-lens-dataset] proxy success <- ${baseUrl}`);
      return new Response(payload, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "x-cryo-backend-base-url": baseUrl,
        },
        status: 200,
      });
    } catch (error) {
      console.warn(
        `[cryo-lens-dataset] proxy failure <- ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
      lastError = error;
    }
  }

  return jsonResponse(502, {
    error: "Failed to fetch cryoLens dataset from the backend.",
    detail: lastError instanceof Error ? lastError.message : "Unknown proxy failure.",
  });
}
