/**
 * ASK PAGE
 * ========
 * Chat-first research surface powered by Claude Agent SDK + CryoLens MCP.
 * Streams directly from the FastAPI backend — no Vercel sandbox.
 */

import { ArrowUp, Bot, LoaderCircle, Search } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { Streamdown } from "streamdown";

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../components/ai-elements/tool";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  type AgentSearchStreamEvent,
  streamAgentSearch,
  type LiveAgentSearchState,
} from "../data/agent-search";
import type { AgentToolCall } from "../types";

const SAVED_PROMPTS = [
  "What does CryoLens know about VS55?",
  "Show high-confidence toxicity findings.",
  "Which formulations contain DMSO and ethylene glycol?",
  "What experiments were run at 4 C?",
  "Which papers discuss vitrification outcomes?",
];

interface AskPageProps {
  initialPrompt?: string;
}

interface PromptComposerProps {
  disabled?: boolean;
  footerText: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onReset?: () => void;
  onSubmit: () => void;
  placeholder: string;
  prompt: string;
}

function createInitialSearchState(prompt: string): LiveAgentSearchState {
  return {
    assistantText: "",
    errorMessage: null,
    finished: false,
    phase: "connecting",
    prompt,
    statusHistory: ["Starting research..."],
    statusMessage: "Connecting to CryoLens MCP...",
    toolCalls: [],
  };
}

function applyStreamEvent(
  prev: LiveAgentSearchState,
  event: AgentSearchStreamEvent,
): LiveAgentSearchState {
  switch (event.type) {
    case "status":
      return {
        ...prev,
        phase: event.phase,
        statusHistory: [...prev.statusHistory, event.message],
        statusMessage: event.message,
      };
    case "text":
      return {
        ...prev,
        phase: "streaming",
        assistantText: prev.assistantText + event.text,
      };
    case "thinking":
      return prev; // thinking is internal, don't display
    case "tool_use":
      return {
        ...prev,
        phase: "tools",
        statusMessage: `Running ${event.name}...`,
        toolCalls: [
          ...prev.toolCalls,
          {
            id: event.id,
            toolName: event.name,
            inputSummary: JSON.stringify(event.input, null, 2),
            outputSummary: "Running...",
            state: "input-available",
          },
        ],
      };
    case "tool_result": {
      const toolCalls = prev.toolCalls.map((tc) =>
        tc.id === event.tool_use_id
          ? {
              ...tc,
              outputSummary: event.content || "(empty)",
              state: (event.is_error ? "output-error" : "output-available") as AgentToolCall["state"],
            }
          : tc,
      );
      return {
        ...prev,
        statusMessage: event.is_error ? "Tool error" : "Tool completed.",
        toolCalls,
      };
    }
    case "result":
      return {
        ...prev,
        finished: true,
        phase: "complete",
        statusMessage: `Complete · ${event.num_turns} turns · ${(event.duration_ms / 1000).toFixed(1)}s`,
      };
    case "done":
      return {
        ...prev,
        finished: true,
        phase: prev.phase === "error" ? "error" : "complete",
        statusMessage: prev.phase === "error" ? prev.statusMessage : (prev.statusMessage || "Complete"),
      };
    case "error":
      return {
        ...prev,
        errorMessage: event.message,
        finished: true,
        phase: "error",
        statusHistory: [...prev.statusHistory, event.message],
        statusMessage: "Research failed.",
        toolCalls: prev.toolCalls.map((tc) =>
          tc.state !== "output-available"
            ? { ...tc, outputSummary: event.message, state: "output-error" as const }
            : tc,
        ),
      };
    default:
      return prev;
  }
}

function PromptComposer({
  disabled = false,
  footerText,
  onChange,
  onKeyDown,
  onReset,
  onSubmit,
  placeholder,
  prompt,
}: PromptComposerProps): JSX.Element {
  const canSubmit = prompt.trim().length > 0 && !disabled;

  return (
    <div className="rounded-xl border border-border/80 bg-white/96 p-3 shadow-[0_18px_44px_rgba(43,52,55,0.06)]">
      <textarea
        className="min-h-[136px] w-full resize-none border-none bg-transparent px-1 py-1 text-[15px] leading-7 text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        value={prompt}
      />
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 px-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {footerText}
        </p>
        <div className="flex items-center gap-2">
          {onReset ? (
            <Button
              className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
              onClick={onReset}
              variant="ghost"
            >
              New chat
            </Button>
          ) : null}
          <button
            aria-label="Send"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-[#435467] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={onSubmit}
            type="button"
          >
            {disabled ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationMessage({
  content,
  isStreaming = false,
  role,
}: {
  content: string;
  isStreaming?: boolean;
  role: "assistant" | "user";
}): JSX.Element {
  const isUser = role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={isUser
          ? "max-w-[86%] rounded-xl border border-border/80 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(43,52,55,0.04)]"
          : "w-full rounded-xl border border-border/70 bg-[#f8fbfc] px-5 py-4"}
      >
        <div className="mb-2 flex items-center gap-2">
          {isUser ? (
            <Search className="h-4 w-4 text-primary" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hero">
            {isUser ? "You" : "CryoLens"}
          </span>
          {!isUser && isStreaming ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <LoaderCircle className="h-3 w-3 animate-spin" />
              Streaming
            </span>
          ) : null}
        </div>
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{content}</p>
        ) : (
          <Streamdown
            className="text-[15px] leading-7 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:rounded-sm [&_code]:bg-white [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mt-6 [&_h1]:font-headline [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:mt-6 [&_h2]:font-headline [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_p]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-white [&_pre]:p-4 [&_ul]:space-y-2"
          >
            {content}
          </Streamdown>
        )}
      </div>
    </div>
  );
}

function formatPhaseLabel(phase: string, finished: boolean): string {
  if (finished && phase !== "error") return "Complete";
  switch (phase) {
    case "connecting": return "Connecting";
    case "streaming": return "Streaming";
    case "tools": return "Running tools";
    case "complete": return "Complete";
    case "error": return "Failed";
    default: return "Running";
  }
}

function getPhaseBadgeVariant(phase: string, finished: boolean): "highlight" | "outline" | "muted" {
  if (phase === "error") return "outline";
  if (finished) return "muted";
  return "highlight";
}

function ResearchPhaseBadge({ search }: { search: LiveAgentSearchState }): JSX.Element {
  return (
    <Badge className="gap-1" variant={getPhaseBadgeVariant(search.phase, search.finished)}>
      {search.finished && search.phase !== "error" ? null : (
        <LoaderCircle className={`h-3 w-3 ${search.finished || search.phase === "error" ? "" : "animate-spin"}`} />
      )}
      {formatPhaseLabel(search.phase, search.finished)}
    </Badge>
  );
}

function ResearchToolStack({ search }: { search: LiveAgentSearchState }): JSX.Element | null {
  if (search.toolCalls.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-hero">
            MCP activity
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.toolCalls.length} tool call{search.toolCalls.length === 1 ? "" : "s"}
          </p>
        </div>
        <Badge variant="outline">
          {search.finished ? "Trace complete" : "Tracing live"}
        </Badge>
      </div>

      <div className="space-y-3">
        {search.toolCalls.map((toolCall) => (
          <Tool
            key={toolCall.id}
            className="shadow-[0_10px_26px_rgba(43,52,55,0.04)]"
            defaultOpen={false}
          >
            <ToolHeader
              state={toolCall.state}
              title={toolCall.toolName.replace(/^mcp__/, "").replaceAll("__", " / ").replaceAll("_", " ")}
              type={`tool-${toolCall.toolName}`}
            />
            <ToolContent>
              <ToolInput input={toolCall.inputSummary.trim() || "Waiting for tool input..."} />
              <ToolOutput
                errorText={toolCall.state === "output-error" ? toolCall.outputSummary : undefined}
                output={toolCall.state === "output-error" ? undefined : toolCall.outputSummary}
              />
            </ToolContent>
          </Tool>
        ))}
      </div>
    </section>
  );
}

export function AskPage({ initialPrompt }: AskPageProps): JSX.Element {
  const [prompt, setPrompt] = useState<string>(initialPrompt ?? "");
  const [activeSearch, setActiveSearch] = useState<LiveAgentSearchState | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stats, setStats] = useState<{ papers: number; findings: number; compounds: number; formulations: number } | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/v1/stats")
      .then((r) => r.json())
      .then((data: { counts: Record<string, number> }) => setStats({
        papers: data.counts.papers ?? 0,
        findings: data.counts.findings ?? 0,
        compounds: data.counts.compounds ?? 0,
        formulations: data.counts.formulations ?? 0,
      }))
      .catch(() => {});
  }, []);

  async function runPrompt(nextPrompt: string): Promise<void> {
    const trimmedPrompt = nextPrompt.trim();
    if (!trimmedPrompt || isRunning) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPrompt(trimmedPrompt);
    setIsRunning(true);
    setActiveSearch(createInitialSearchState(trimmedPrompt));

    try {
      await streamAgentSearch(trimmedPrompt, (event) => {
        if (requestIdRef.current !== requestId) return;
        setActiveSearch((prev) => (prev ? applyStreamEvent(prev, event) : prev));
      });
    } catch (error) {
      if (requestIdRef.current === requestId) {
        const message = error instanceof Error ? error.message : "Unknown error.";
        setActiveSearch((prev) => {
          const base = prev ?? createInitialSearchState(trimmedPrompt);
          return applyStreamEvent(base, { type: "error", message });
        });
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsRunning(false);
      }
    }
  }

  function resetConversation(): void {
    requestIdRef.current += 1;
    setActiveSearch(null);
    setIsRunning(false);
    setPrompt("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void runPrompt(prompt);
    }
  }

  const dataSummary = stats
    ? `${stats.papers} papers · ${stats.findings} findings · ${stats.compounds} compounds · ${stats.formulations} formulations`
    : "Loading...";

  if (!activeSearch) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center page-enter">
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Ask CryoLens
            </p>
            <h1 className="font-headline text-[2.15rem] font-extrabold leading-[1.02] tracking-tight text-hero sm:text-[2.8rem]">
              Ask CryoLens
            </h1>
            <p className="mx-auto max-w-2xl text-[15px] leading-7 text-muted-foreground">
              Query the live CryoLens evidence base with {dataSummary.toLowerCase().includes("loading") ? "" : dataSummary + ". "}
              Powered by Claude Agent SDK and the CryoLens MCP server.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {dataSummary}
            </p>
          </div>

          <PromptComposer
            footerText="Start with a question or saved prompt"
            onChange={setPrompt}
            onKeyDown={handleComposerKeyDown}
            onSubmit={() => void runPrompt(prompt)}
            placeholder="Ask about VS55, formamide toxicity, or the next safer cocktail to test..."
            prompt={prompt}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {SAVED_PROMPTS.map((savedPrompt) => (
              <button
                key={savedPrompt}
                className="rounded-xl border border-border/80 bg-white/88 px-4 py-4 text-left text-sm leading-6 text-foreground transition-colors hover:bg-white"
                onClick={() => void runPrompt(savedPrompt)}
                type="button"
              >
                {savedPrompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Ask CryoLens
          </p>
          <div className="mt-2 space-y-2">
            <ResearchPhaseBadge search={activeSearch} />
            <p className="text-sm text-muted-foreground">
              {activeSearch.statusMessage}
            </p>
          </div>
        </div>
        <Button
          className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
          onClick={resetConversation}
          variant="ghost"
        >
          New chat
        </Button>
      </div>

      <div className="flex-1 space-y-6 pb-12">
        <Fragment>
          <ConversationMessage content={activeSearch.prompt} role="user" />
          <ResearchToolStack search={activeSearch} />
          <ConversationMessage
            content={activeSearch.assistantText.trim()
              ? activeSearch.assistantText
              : activeSearch.errorMessage
                ? activeSearch.errorMessage
                : "Researching the live CryoLens dataset..."}
            isStreaming={!activeSearch.finished}
            role="assistant"
          />
        </Fragment>
      </div>

      <div className="mt-auto pt-6">
        <PromptComposer
          disabled={isRunning}
          footerText="Enter to send · Shift+Enter for newline"
          onChange={setPrompt}
          onKeyDown={handleComposerKeyDown}
          onReset={resetConversation}
          onSubmit={() => void runPrompt(prompt)}
          placeholder="Ask a follow-up question..."
          prompt={prompt}
        />
      </div>
    </div>
  );
}
