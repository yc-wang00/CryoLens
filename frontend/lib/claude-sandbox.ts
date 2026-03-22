/**
 * CLAUDE SANDBOX ORCHESTRATOR
 * ===========================
 * Create a Vercel sandbox, prepare the Claude Agent SDK runtime, and stream
 * structured events back to the API route.
 *
 * KEY CONCEPTS:
 * - bootstrap the sandbox on demand or reuse a prepared snapshot
 * - mount exactly one remote read-only MCP server for research
 * - stream JSONL from the sandbox process and translate it into SSE events
 *
 * USAGE:
 * - call `runSandboxedAgentSearch()` from `api/agent-search.ts`
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { PassThrough } from "node:stream";

import { Sandbox } from "@vercel/sandbox";
import ms from "ms";

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

export type AgentProfile = "research" | "hypothesis";

interface RunSandboxedAgentSearchParams {
  profile: AgentProfile;
  prompt: string;
  onEvent: (event: AgentSearchEvent) => void;
}

const SANDBOX_PROJECT_DIR = "/vercel/sandbox/project";
const SANDBOX_QUERY_PATH = `${SANDBOX_PROJECT_DIR}/run-agent-search.mjs`;
const SANDBOX_PACKAGE_JSON_PATH = `${SANDBOX_PROJECT_DIR}/package.json`;
const SANDBOX_SKILL_PATH = `${SANDBOX_PROJECT_DIR}/.claude/skills/cryo-remote-mcp/SKILL.md`;
const DEFAULT_AGENT_MODEL = "claude-sonnet-4-5";
const DEFAULT_MCP_NAME = "cryosight-knowledge";
const DEFAULT_DOCS_MCP_URL = "https://code.claude.com/docs/mcp";

let envLoaded = false;

function loadLocalEnvFiles(): void {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env.server.local"),
    path.resolve(process.cwd(), ".env.server"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "frontend/.env.server.local"),
    path.resolve(process.cwd(), "frontend/.env.server"),
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
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveAgentModel(): string {
  return process.env.CLAUDE_AGENT_MODEL?.trim() || DEFAULT_AGENT_MODEL;
}

function resolveResearchMcpUrl(): string {
  return (
    process.env.CRYOSIGHT_RESEARCH_MCP_URL?.trim() ||
    process.env.CLAUDE_AGENT_MCP_URL?.trim() ||
    DEFAULT_DOCS_MCP_URL
  );
}

function resolveResearchMcpName(): string {
  return process.env.CRYOSIGHT_RESEARCH_MCP_NAME?.trim() || DEFAULT_MCP_NAME;
}

function buildSandboxPackageJsonText(): string {
  return JSON.stringify(
    {
      name: "cryosight-agent-sandbox",
      private: true,
      type: "module",
      dependencies: {
        "@anthropic-ai/claude-agent-sdk": "^0.1.0",
      },
    },
    null,
    2,
  );
}

function buildSandboxSkill(profile: AgentProfile): string {
  return `---
name: cryo-remote-mcp
description: Use when answering CryoSight Ask-page ${profile} prompts through the configured remote MCP server. Prefer evidence from MCP tools, cite the tools you used, and do not rely on any local dataset preload.
---

# CryoSight Remote MCP Research

1. Use the remote MCP tools first.
2. Keep tool calls narrow and relevant to the prompt. Use at most 3 tool calls unless the user explicitly asks for exhaustive research.
3. Stop searching as soon as you have enough evidence to answer. Do not keep searching for a better answer once you can support a decision.
4. Cite exact tool names, source IDs, paper DOIs, or returned record identifiers whenever the tools provide them.
5. If the available MCP tools do not answer the question directly, say "I did not retrieve direct evidence" and then give the best-supported inference as inference.
6. Do not narrate your search process in prose. The UI already renders tool activity, so skip filler like "I'll search", "let me look", or "perfect". Do not emit preambles before the first tool call.
7. Separate retrieved facts from inference or uncertainty. Use explicit headings like "Retrieved Facts", "Inference", and "Open Questions" when appropriate.
8. Add the strongest counterpoint or failure mode whenever you recommend a next step.
9. Include direct source links in the evidence section whenever the MCP tool returns them.
10. End with a short section called "What I'd Need For Real Research" that names the missing data, experiments, documents, or tool access required for a stronger answer.
11. Avoid strong systems wording like "deterministic" or "blocks permissions" unless the source explicitly states it. Prefer softer phrasing like "predictable event-driven automation" or "can influence execution flow".
12. ${profile === "hypothesis"
    ? "For hypothesis mode, return one experimentally tractable hypothesis to test, not a validated recommendation, and make clear what evidence supports it versus what is inferred."
    : "For research mode, treat the answer as decision support rather than a literature review. Lead with the most decision-relevant or surprising finding."}
`;
}

function buildSandboxUserPrompt(profile: AgentProfile, prompt: string): string {
  if (profile === "hypothesis") {
    return `${prompt}

Return a concise hypothesis proposal grounded in the MCP evidence you found.
State the benchmark, proposed change, strongest counterpoint, and next step clearly.
Label anything not directly retrieved from MCP evidence as inference.`;
  }

  return `${prompt}

Treat this as decision support, not a literature review.
Use the minimum tool calls needed for a strong answer.
Do not output any preamble before the first tool call.
After retrieval, answer with:
1. Direct Answer
2. Retrieved Facts
3. Inference
4. Strongest Counterpoint
5. Next Experiment or Decision Move when relevant
6. Open Questions
7. What I'd Need For Real Research

If direct evidence is missing, say "I did not retrieve direct evidence" and then give the best-supported inference.`;
}

function buildSystemPrompt(profile: AgentProfile, mcpName: string): string {
  if (profile === "hypothesis") {
    return `You are CryoSight's hypothesis agent. Use the read-only MCP server "${mcpName}" to gather evidence first, then propose one tractable next experiment. Use at most 3 tool calls unless the user explicitly asks for exhaustive research, and stop searching once you have enough evidence to support the hypothesis. Your final answer should be researcher-grade: state the hypothesis clearly, separate retrieved facts from inference and uncertainty, cite the MCP evidence you used with direct links or record identifiers when available, include the strongest counterpoint or failure mode, and end with a section titled "What I'd Need For Real Research". Do not narrate your search process or tool use in prose, do not emit preambles before the first tool call, and avoid strong claims unless the retrieved evidence explicitly supports them.`;
  }

  return `You are CryoSight's research agent. Use the read-only MCP server "${mcpName}" to answer the user's question with evidence from MCP tool calls. Treat the answer as decision support rather than a literature review. Use at most 3 tool calls unless the user explicitly asks for exhaustive research, and stop searching as soon as you have enough evidence to answer. Do not narrate your search process or tool use in prose, and do not emit preambles before the first tool call. Your final answer should include: (1) a one-sentence direct answer, (2) a "Retrieved Facts" section containing only directly retrieved claims, (3) an "Inference" section for the best-supported inference, (4) a "Strongest Counterpoint" section, (5) a "Next Experiment or Decision Move" section when relevant, (6) an "Open Questions" section for anything still uncertain, (7) an evidence section with direct source links or record identifiers when available, and (8) a short section titled "What I'd Need For Real Research" that names the missing information required for a stronger conclusion. If direct evidence is missing, explicitly say "I did not retrieve direct evidence" before giving an inference. Avoid strong claims unless the retrieved evidence explicitly supports them.`;
}

function buildSandboxQueryScript(profile: AgentProfile, prompt: string, mcpName: string, mcpUrl: string): string {
  return `import { query } from "@anthropic-ai/claude-agent-sdk";

const prompt = ${JSON.stringify(buildSandboxUserPrompt(profile, prompt))};
const model = process.env.CLAUDE_AGENT_MODEL || ${JSON.stringify(DEFAULT_AGENT_MODEL)};
const mcpName = ${JSON.stringify(mcpName)};
const mcpUrl = ${JSON.stringify(mcpUrl)};

function emit(event) {
  process.stdout.write(JSON.stringify(event) + "\\n");
}

let currentTool = null;
let currentToolInput = "";
let sawToolCall = false;
let preToolText = "";
let answerText = "";

function appendText(text) {
  if (!text) {
    return;
  }

  if (sawToolCall) {
    answerText += text;
  } else {
    preToolText += text;
  }

  emit({ type: "text_delta", text });
}

function extractTextBlocks(content) {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }

      if (block.type === "text" && typeof block.text === "string") {
        return block.text;
      }

      if (typeof block.text === "string") {
        return block.text;
      }

      return "";
    })
    .filter(Boolean)
    .join("\\n\\n");
}

function extractResultText(message) {
  if (typeof message?.result === "string" && message.result.trim()) {
    return message.result;
  }

  if (typeof message?.finalResult === "string" && message.finalResult.trim()) {
    return message.finalResult;
  }

  const directContentText = extractTextBlocks(message?.content);
  if (directContentText.trim()) {
    return directContentText;
  }

  const nestedMessageText = extractTextBlocks(message?.message?.content);
  if (nestedMessageText.trim()) {
    return nestedMessageText;
  }

  const nestedResultText = extractTextBlocks(message?.result?.content);
  if (nestedResultText.trim()) {
    return nestedResultText;
  }

  return answerText.trim() || preToolText.trim();
}

function formatToolResultPayload(payload) {
  let value = payload;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

try {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: [
        "Skill",
        \`mcp__\${mcpName}__*\`,
      ],
      allowDangerouslySkipPermissions: true,
      cwd: process.cwd(),
      includePartialMessages: true,
      maxTurns: 12,
      mcpServers: {
        [mcpName]: {
          type: "http",
          url: mcpUrl,
        },
      },
      model,
      permissionMode: "bypassPermissions",
      persistSession: false,
      settingSources: ["project"],
      systemPrompt: ${JSON.stringify(buildSystemPrompt(profile, mcpName))},
      tools: ["Skill"],
    },
  })) {
    if (message.type === "stream_event") {
      const event = message.event;

      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        sawToolCall = true;
        currentTool = event.content_block.name;
        currentToolInput = "";
        emit({ type: "tool_start", name: currentTool });
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          appendText(event.delta.text);
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

    if (
      message &&
      typeof message === "object" &&
      "tool_use_result" in message &&
      message.tool_use_result
    ) {
      emit({
        type: "tool_output",
        output: formatToolResultPayload(message.tool_use_result),
      });
    }

    if ((message.type === "assistant" || message.type === "assistant_message") && !answerText.trim()) {
      const assistantText = extractResultText(message);
      if (assistantText.trim()) {
        answerText = assistantText;
      }
    }

    if (message.type === "result") {
      const resultText = extractResultText(message);
      if (!answerText.trim()) {
        emit({
          type: "status",
          phase: "result-debug",
          message: JSON.stringify({
            messageType: message.type,
            keys: Object.keys(message ?? {}),
            raw: message,
          }),
        });
      }

      emit({
        type: "result",
        text: resultText,
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

async function prepareSandbox(
  sandbox: Sandbox,
  profile: AgentProfile,
  onEvent: RunSandboxedAgentSearchParams["onEvent"],
): Promise<void> {
  const prepareStartedAt = Date.now();

  onEvent({
    type: "status",
    phase: "prepare",
    message: "Preparing Claude runtime inside the sandbox.",
  });

  await sandbox.writeFiles([
    {
      path: SANDBOX_PACKAGE_JSON_PATH,
      content: Buffer.from(buildSandboxPackageJsonText()),
    },
    {
      path: SANDBOX_SKILL_PATH,
      content: Buffer.from(buildSandboxSkill(profile)),
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
  profile,
  prompt,
  onEvent,
}: RunSandboxedAgentSearchParams): Promise<void> {
  loadLocalEnvFiles();

  const runStartedAt = Date.now();
  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");
  requireEnv("VERCEL_OIDC_TOKEN");
  const agentModel = resolveAgentModel();
  const researchMcpUrl = resolveResearchMcpUrl();
  const researchMcpName = resolveResearchMcpName();
  const snapshotId = process.env.CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID?.trim();

  onEvent({
    type: "status",
    phase: "mcp",
    message: `Using remote MCP server "${researchMcpName}" at ${researchMcpUrl}.`,
  });

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
    await ensureDir(sandbox, `${SANDBOX_PROJECT_DIR}/.claude/skills/cryo-remote-mcp`);

    if (!usedSnapshot) {
      await prepareSandbox(sandbox, profile, onEvent);
    }

    await sandbox.writeFiles([
      {
        path: SANDBOX_SKILL_PATH,
        content: Buffer.from(buildSandboxSkill(profile)),
      },
      {
        path: SANDBOX_QUERY_PATH,
        content: Buffer.from(buildSandboxQueryScript(profile, prompt, researchMcpName, researchMcpUrl)),
      },
    ]);

    onEvent({
      type: "status",
      phase: "agent",
      message:
        profile === "hypothesis"
          ? "Running Claude hypothesis generation in the sandbox."
          : "Running Claude research in the sandbox.",
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
        CLAUDE_AGENT_MODEL: agentModel,
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
