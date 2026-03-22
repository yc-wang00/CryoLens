/**
 * CLAUDE SANDBOX ORCHESTRATOR
 * ===========================
 * Create a Vercel sandbox, prepare the Claude Agent SDK runtime, and stream
 * structured events back to the API route.
 *
 * KEY CONCEPTS:
 * - bootstrap the sandbox on demand or reuse a prepared snapshot
 * - expose only a read-only Supabase SQL MCP surface to the agent
 * - stream JSONL from the sandbox process and translate it into SSE events
 *
 * USAGE:
 * - call `runSandboxedAgentSearch()` from `api/agent-search.ts`
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 */

import { PassThrough } from "node:stream";
import { createInterface } from "node:readline";
import { existsSync } from "node:fs";
import path from "node:path";

import ms from "ms";
import { Sandbox } from "@vercel/sandbox";

export type AgentSearchEvent =
  | { type: "status"; phase: string; message: string; sandboxId?: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_input_delta"; text: string }
  | { type: "tool_end"; name: string; input: string }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

interface RunSandboxedAgentSearchParams {
  prompt: string;
  onEvent: (event: AgentSearchEvent) => void;
}

const SANDBOX_PROJECT_DIR = "/vercel/sandbox/project";
const SANDBOX_DATASET_PATH = `${SANDBOX_PROJECT_DIR}/dataset.json`;
const SANDBOX_QUERY_PATH = `${SANDBOX_PROJECT_DIR}/run-agent-search.mjs`;
const SANDBOX_PACKAGE_JSON_PATH = `${SANDBOX_PROJECT_DIR}/package.json`;
const SANDBOX_SKILL_PATH = `${SANDBOX_PROJECT_DIR}/.claude/skills/cryo-sql-research/SKILL.md`;

let envLoaded = false;

function loadLocalEnvFiles(): void {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "frontend/.env.local"),
    path.resolve(process.cwd(), "frontend/.env"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
    }
  }

  envLoaded = true;
}

function formatDuration(startedAt: number): string {
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 1000) {
    return `${elapsedMs}ms`;
  }

  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function attachCommandLogs(
  stream: PassThrough,
  phase: string,
  onEvent: RunSandboxedAgentSearchParams["onEvent"],
): void {
  const lines = createInterface({ input: stream });

  lines.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    onEvent({
      type: "status",
      phase,
      message: `[${phase}] ${trimmed}`,
    });
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildSandboxPackageJson(): string {
  return JSON.stringify(
    {
      name: "cryosight-agent-sandbox",
      private: true,
      type: "module",
      dependencies: {
        "@anthropic-ai/claude-agent-sdk": "^0.1.0",
        zod: "^3.25.76",
      },
    },
    null,
    2,
  );
}

function buildSandboxSkill(): string {
  return `---
name: cryo-sql-research
description: Use when answering CryoSight Ask-page research prompts against the live cryoLens dataset exported from the backend. Inspect the dataset summary first, use the bounded search tools, and cite exact result counts and entities.
---

# CryoSight Dataset Research

1. Call \`summarize_dataset\` first to understand the available evidence.
2. Use \`search_findings\` for experimental claims and conditions.
3. Use \`search_molecules\`, \`search_cocktails\`, and \`search_sources\` for supporting context.
4. Keep searches bounded and focused on the user question.
5. In the final answer, cite the tool names, query terms, and result counts that support your conclusion.
`;
}

function buildSandboxQueryScript(prompt: string): string {
  return `import { readFile } from "node:fs/promises";
import { createSdkMcpServer, query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const prompt = ${JSON.stringify(prompt)};
const model = process.env.CLAUDE_AGENT_MODEL;
const dataset = JSON.parse(await readFile(${JSON.stringify(SANDBOX_DATASET_PATH)}, "utf8"));

function emit(event) {
  process.stdout.write(JSON.stringify(event) + "\\n");
}

function buildTextResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function tokenize(raw) {
  return raw
    .toLowerCase()
    .split(/\\s+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreText(query, values) {
  const tokens = tokenize(query);
  const haystack = values.join(" ").toLowerCase();
  return tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
}

function topMatches(items, query, projector, limit) {
  return items
    .map((item) => ({ item, score: scoreText(query, projector(item)) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

const dbServer = createSdkMcpServer({
  name: "cryosight_dataset",
  tools: [
    tool(
      "summarize_dataset",
      "Summarize the available live CryoSight dataset.",
      {},
      async () => {
        return buildTextResult({
          appStats: dataset.appStats,
          savedPrompts: dataset.savedPrompts,
        });
      },
      { annotations: { readOnly: true } },
    ),
    tool(
      "search_findings",
      "Search experimental findings in the live CryoSight dataset.",
      {
        query: z.string().min(1),
        limit: z.number().int().positive().max(12).default(6),
      },
      async ({ query, limit }) => {
        const rows = topMatches(
          dataset.findings,
          query,
          (finding) => [
            finding.summary,
            finding.sourceTitle,
            finding.metricType,
            finding.conditions,
            ...finding.components,
            ...finding.tags,
          ],
          limit,
        );

        return buildTextResult({
          query,
          rowCount: rows.length,
          rows,
        });
      },
      { annotations: { readOnly: true } },
    ),
    tool(
      "search_molecules",
      "Search molecules in the live CryoSight dataset.",
      {
        query: z.string().min(1),
        limit: z.number().int().positive().max(12).default(6),
      },
      async ({ query, limit }) => {
        const rows = topMatches(
          dataset.molecules,
          query,
          (molecule) => [
            molecule.name,
            molecule.className,
            molecule.roleHint,
            molecule.notes,
            molecule.keySignal,
            ...molecule.aliases,
          ],
          limit,
        );

        return buildTextResult({
          query,
          rowCount: rows.length,
          rows,
        });
      },
      { annotations: { readOnly: true } },
    ),
    tool(
      "search_cocktails",
      "Search cocktails and formulations in the live CryoSight dataset.",
      {
        query: z.string().min(1),
        limit: z.number().int().positive().max(12).default(6),
      },
      async ({ query, limit }) => {
        const rows = topMatches(
          dataset.cocktails,
          query,
          (cocktail) => [
            cocktail.name,
            cocktail.type,
            cocktail.notes,
            ...cocktail.tissueTags,
            ...cocktail.components.map((component) => component.name),
          ],
          limit,
        );

        return buildTextResult({
          query,
          rowCount: rows.length,
          rows,
        });
      },
      { annotations: { readOnly: true } },
    ),
    tool(
      "search_sources",
      "Search source papers in the live CryoSight dataset.",
      {
        query: z.string().min(1),
        limit: z.number().int().positive().max(12).default(6),
      },
      async ({ query, limit }) => {
        const rows = topMatches(
          dataset.sources,
          query,
          (source) => [source.title, source.journal, source.note, source.abstract, source.doi],
          limit,
        );

        return buildTextResult({
          query,
          rowCount: rows.length,
          rows,
        });
      },
      { annotations: { readOnly: true } },
    ),
  ],
});

let currentTool = null;
let currentToolInput = "";

try {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: [
        "Skill",
        "mcp__cryosight_dataset__summarize_dataset",
        "mcp__cryosight_dataset__search_findings",
        "mcp__cryosight_dataset__search_molecules",
        "mcp__cryosight_dataset__search_cocktails",
        "mcp__cryosight_dataset__search_sources",
      ],
      allowDangerouslySkipPermissions: true,
      cwd: process.cwd(),
      includePartialMessages: true,
      maxTurns: 12,
      mcpServers: {
        cryosight_dataset: dbServer,
      },
      model,
      permissionMode: "bypassPermissions",
      persistSession: false,
      settingSources: ["project"],
      systemPrompt: "You are CryoSight's research agent. Answer the user's cryobiology question using the supplied read-only dataset tools over the live CryoSight knowledge payload. Start by summarizing the dataset when the available evidence surface is unclear. Use the bounded search tools to gather findings, molecules, cocktails, and sources, then explain what evidence actually supports the conclusion.",
      tools: ["Skill"],
    },
  })) {
    if (message.type === "stream_event") {
      const event = message.event;

      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        currentTool = event.content_block.name;
        currentToolInput = "";
        emit({ type: "tool_start", name: currentTool });
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          emit({ type: "text_delta", text: event.delta.text });
        }

        if (event.delta.type === "input_json_delta") {
          currentToolInput += event.delta.partial_json;
          emit({ type: "tool_input_delta", text: event.delta.partial_json });
        }
      } else if (event.type === "content_block_stop" && currentTool) {
        emit({ type: "tool_end", name: currentTool, input: currentToolInput });
        currentTool = null;
        currentToolInput = "";
      }
    }

    if (message.type === "result") {
      emit({
        type: "result",
        text: typeof message.result === "string" ? message.result : JSON.stringify(message.result),
      });
    }
  }
} catch (error) {
  emit({
    type: "error",
    message: error instanceof Error ? error.message : String(error),
  });
}
`;
}

async function fetchDatasetPayload(
  onEvent: RunSandboxedAgentSearchParams["onEvent"],
): Promise<string> {
  const configuredBaseUrl = process.env.VITE_API_BASE_URL?.trim();
  const candidates = configuredBaseUrl
    ? [configuredBaseUrl, "http://127.0.0.1:8001", "http://127.0.0.1:8000"]
    : ["http://127.0.0.1:8000", "http://127.0.0.1:8001"];
  const attempted = new Set<string>();
  let lastStatus = "unknown";

  for (const apiBaseUrl of candidates) {
    if (attempted.has(apiBaseUrl)) {
      continue;
    }
    attempted.add(apiBaseUrl);

    onEvent({
      type: "status",
      phase: "dataset",
      message: `Fetching live CryoSight dataset from ${apiBaseUrl}.`,
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/cryo-lens/dataset`);
      if (!response.ok) {
        lastStatus = String(response.status);
        continue;
      }

      return response.text();
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`Failed to fetch backend dataset from all candidates. Last failure: ${lastStatus}`);
}

async function prepareSandbox(sandbox: Sandbox, onEvent: RunSandboxedAgentSearchParams["onEvent"]): Promise<void> {
  const prepareStartedAt = Date.now();

  onEvent({
    type: "status",
    phase: "prepare",
    message: "Preparing Claude runtime inside the sandbox.",
  });

  await sandbox.writeFiles([
    {
      path: SANDBOX_PACKAGE_JSON_PATH,
      content: Buffer.from(buildSandboxPackageJson()),
    },
    {
      path: SANDBOX_SKILL_PATH,
      content: Buffer.from(buildSandboxSkill()),
    },
  ]);

  onEvent({
    type: "status",
    phase: "install-cli",
    message: "Installing Claude Code CLI in the sandbox.",
  });

  const installCliStdout = new PassThrough();
  const installCliStderr = new PassThrough();
  attachCommandLogs(installCliStdout, "install-cli", onEvent);
  attachCommandLogs(installCliStderr, "install-cli", onEvent);

  const installCli = await sandbox.runCommand({
    cmd: "npm",
    args: ["install", "-g", "@anthropic-ai/claude-code"],
    cwd: SANDBOX_PROJECT_DIR,
    stderr: installCliStderr,
    stdout: installCliStdout,
    sudo: true,
  });

  installCliStdout.end();
  installCliStderr.end();

  if (installCli.exitCode !== 0) {
    throw new Error(`Failed to install Claude Code CLI: ${await installCli.stderr()}`);
  }

  onEvent({
    type: "status",
    phase: "install-cli",
    message: `Claude Code CLI installed in ${formatDuration(prepareStartedAt)}.`,
  });

  onEvent({
    type: "status",
    phase: "install-deps",
    message: "Installing agent runtime dependencies in the sandbox.",
  });

  const installDepsStartedAt = Date.now();
  const installDepsStdout = new PassThrough();
  const installDepsStderr = new PassThrough();
  attachCommandLogs(installDepsStdout, "install-deps", onEvent);
  attachCommandLogs(installDepsStderr, "install-deps", onEvent);

  const installDeps = await sandbox.runCommand({
    cmd: "npm",
    args: ["install"],
    cwd: SANDBOX_PROJECT_DIR,
    stderr: installDepsStderr,
    stdout: installDepsStdout,
  });

  installDepsStdout.end();
  installDepsStderr.end();

  if (installDeps.exitCode !== 0) {
    throw new Error(`Failed to install sandbox dependencies: ${await installDeps.stderr()}`);
  }

  onEvent({
    type: "status",
    phase: "install-deps",
    message: `Sandbox dependencies installed in ${formatDuration(installDepsStartedAt)}.`,
  });

  onEvent({
    type: "status",
    phase: "prepare",
    message: `Claude runtime prepared in ${formatDuration(prepareStartedAt)}.`,
  });
}

async function createConfiguredSandbox(
  onEvent: RunSandboxedAgentSearchParams["onEvent"],
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  const snapshotId = process.env.CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID;
  const sandboxStartedAt = Date.now();

  onEvent({
    type: "status",
    phase: "sandbox",
    message: snapshotId
      ? "Starting Claude sandbox from the configured snapshot."
      : "Starting a fresh Claude sandbox.",
  });

  try {
    const sandboxCreateOptions: Record<string, unknown> = {
      networkPolicy: "allow-all",
      resources: { vcpus: 4 },
      runtime: "node24",
      timeout: ms("10m"),
    };
    if (snapshotId) {
      sandboxCreateOptions.source = { snapshotId, type: "snapshot" };
    }

    const sandbox = await Sandbox.create(
      sandboxCreateOptions as Parameters<typeof Sandbox.create>[0],
    );

    onEvent({
      type: "status",
      phase: "sandbox",
      message: `Claude sandbox is ready in ${formatDuration(sandboxStartedAt)}.`,
      sandboxId: sandbox.sandboxId,
    });

    return { sandbox, usedSnapshot: Boolean(snapshotId) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!snapshotId || !message.includes("404")) {
      throw error;
    }

    onEvent({
      type: "status",
      phase: "sandbox",
      message: `Configured sandbox snapshot ${snapshotId} was not found. Falling back to a fresh sandbox.`,
    });

    const sandbox = await Sandbox.create({
      networkPolicy: "allow-all",
      resources: { vcpus: 4 },
      runtime: "node24",
      timeout: ms("10m"),
    });

    onEvent({
      type: "status",
      phase: "sandbox",
      message: `Fresh fallback sandbox is ready in ${formatDuration(sandboxStartedAt)}.`,
      sandboxId: sandbox.sandboxId,
    });

    return { sandbox, usedSnapshot: false };
  }
}

async function ensureDir(sandbox: Sandbox, dirPath: string): Promise<void> {
  try {
    await sandbox.mkDir(dirPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("400")) {
      return;
    }

    throw error;
  }
}

export async function runSandboxedAgentSearch({
  prompt,
  onEvent,
}: RunSandboxedAgentSearchParams): Promise<void> {
  loadLocalEnvFiles();
  const runStartedAt = Date.now();
  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");
  const snapshotId = process.env.CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID;
  const datasetPayload = await fetchDatasetPayload(onEvent);

  if (!snapshotId) {
    onEvent({
      type: "status",
      phase: "cold-start",
      message: "Cold start: no sandbox snapshot configured, so the CLI and npm dependencies will be installed before the agent can run. Expect this to take 30-120 seconds.",
    });
  }

  const { sandbox, usedSnapshot } = await createConfiguredSandbox(onEvent);

  onEvent({
    type: "status",
    phase: "sandbox",
    message: usedSnapshot
      ? "Prepared snapshot mounted. Skipping CLI and dependency installation."
      : "Fresh sandbox ready. Continuing with runtime setup.",
    sandboxId: sandbox.sandboxId,
  });

  try {
    await ensureDir(sandbox, SANDBOX_PROJECT_DIR);
    await ensureDir(sandbox, `${SANDBOX_PROJECT_DIR}/.claude`);
    await ensureDir(sandbox, `${SANDBOX_PROJECT_DIR}/.claude/skills`);
    await ensureDir(sandbox, `${SANDBOX_PROJECT_DIR}/.claude/skills/cryo-sql-research`);

    if (!usedSnapshot) {
      await prepareSandbox(sandbox, onEvent);
    }

    await sandbox.writeFiles([
      {
        path: SANDBOX_SKILL_PATH,
        content: Buffer.from(buildSandboxSkill()),
      },
      {
        path: SANDBOX_DATASET_PATH,
        content: Buffer.from(datasetPayload),
      },
      {
        path: SANDBOX_QUERY_PATH,
        content: Buffer.from(buildSandboxQueryScript(prompt)),
      },
    ]);

    onEvent({
      type: "status",
      phase: "agent",
      message: "Running Claude research in the sandbox.",
    });

    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const stdoutLines = createInterface({ input: stdout });
    const stderrLines = createInterface({ input: stderr });

    stdoutLines.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      try {
        const event = JSON.parse(trimmed) as AgentSearchEvent;
        onEvent(event);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown stream parse error";
        onEvent({
          type: "status",
          phase: "sandbox-log",
          message: `Unparsed sandbox output: ${message}`,
        });
      }
    });

    stderrLines.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      onEvent({
        type: "status",
        phase: "sandbox-stderr",
        message: trimmed,
      });
    });

    const command = await sandbox.runCommand({
      cmd: "node",
      args: ["run-agent-search.mjs"],
      cwd: SANDBOX_PROJECT_DIR,
      env: {
        ANTHROPIC_API_KEY: anthropicApiKey,
        CLAUDE_AGENT_MODEL: process.env.CLAUDE_AGENT_MODEL ?? "",
      },
      stderr,
      stdout,
    });

    stdout.end();
    stderr.end();

    if (command.exitCode !== 0) {
      const stderrOutput = await command.stderr();
      throw new Error(stderrOutput || "Sandboxed agent process exited with a non-zero status.");
    }

    onEvent({
      type: "status",
      phase: "complete",
      message: `Sandboxed research finished in ${formatDuration(runStartedAt)}.`,
      sandboxId: sandbox.sandboxId,
    });
  } finally {
    onEvent({
      type: "status",
      phase: "cleanup",
      message: "Stopping Claude sandbox.",
      sandboxId: sandbox.sandboxId,
    });
    await sandbox.stop();
  }
}
