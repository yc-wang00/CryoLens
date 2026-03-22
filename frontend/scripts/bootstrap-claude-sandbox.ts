/**
 * BOOTSTRAP CLAUDE SANDBOX SNAPSHOT
 * =================================
 * Prepare a reusable Vercel Sandbox snapshot with the Claude CLI and runtime
 * dependencies preinstalled so Ask-page searches can start faster.
 *
 * USAGE:
 * - `pnpm sandbox:bootstrap`
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 */

import { existsSync } from "node:fs";
import path from "node:path";

import ms from "ms";
import { Sandbox } from "@vercel/sandbox";

const PROJECT_DIR = "/vercel/sandbox/project";

function loadLocalEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (name === "VERCEL_OIDC_TOKEN") {
      throw new Error(
        "Missing required environment variable: VERCEL_OIDC_TOKEN. Run `vercel env pull` in `frontend/` so `.env.local` contains the sandbox auth token, or export VERCEL_OIDC_TOKEN before running `pnpm sandbox:bootstrap`.",
      );
    }

    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  loadLocalEnvFiles();
  requireEnv("VERCEL_OIDC_TOKEN");

  const sandbox = await Sandbox.create({
    networkPolicy: "allow-all",
    resources: { vcpus: 4 },
    runtime: "node24",
    timeout: ms("10m"),
  });

  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  try {
    await sandbox.mkDir(PROJECT_DIR);

    await sandbox.writeFiles([
      {
        path: `${PROJECT_DIR}/package.json`,
        content: Buffer.from(
          JSON.stringify(
            {
              name: "cryosight-agent-sandbox",
              private: true,
              type: "module",
              dependencies: {
                "@anthropic-ai/claude-agent-sdk": "^0.1.0",
                postgres: "^3.4.7",
                zod: "^3.25.76",
              },
            },
            null,
            2,
          ),
        ),
      },
    ]);

    console.log("Installing Claude Code CLI...");
    const installCli = await sandbox.runCommand({
      cmd: "npm",
      args: ["install", "-g", "@anthropic-ai/claude-code"],
      cwd: PROJECT_DIR,
      stderr: process.stderr,
      stdout: process.stdout,
      sudo: true,
    });

    if (installCli.exitCode !== 0) {
      throw new Error(`Claude CLI install failed: ${await installCli.stderr()}`);
    }

    console.log("Installing runtime dependencies...");
    const installDeps = await sandbox.runCommand({
      cmd: "npm",
      args: ["install"],
      cwd: PROJECT_DIR,
      stderr: process.stderr,
      stdout: process.stdout,
    });

    if (installDeps.exitCode !== 0) {
      throw new Error(`Dependency install failed: ${await installDeps.stderr()}`);
    }

    console.log("Creating reusable snapshot...");
    const snapshot = await sandbox.snapshot({ expiration: ms("14d") });
    console.log(`Snapshot created: ${snapshot.snapshotId}`);
    console.log("Set CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID to reuse this prepared environment.");
  } finally {
    if (sandbox.status !== "stopped") {
      await sandbox.stop();
    }
  }
}

void main();
