/**
 * ASK PAGE
 * ========
 * Minimal chat-first research surface for the CryoLens demo.
 *
 * KEY CONCEPTS:
 * - Keep the first view focused on one composer and a few starter prompts.
 * - Keep research telemetry available, but secondary to the conversation.
 *
 * USAGE:
 * - Render from `App.tsx` after the CryoLens dataset has loaded.
 *
 * MEMORY REFERENCES:
 * - MEM-0004
 * - MEM-0007
 * - MEM-0008
 * - MEM-0009
 */

import { ArrowUp, Bot, LoaderCircle, Search, Wrench } from "lucide-react";
import { Fragment, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { Streamdown } from "streamdown";

import { Button } from "../components/ui/button";
import {
  type AgentProfile,
  type AgentSearchStreamEvent,
  streamAgentSearch,
  type LiveAgentSearchState,
} from "../data/agent-search";
import type { CryoLensDataset } from "../data/cryo-lens";
import type { AgentToolCall, Hypothesis } from "../data/mock-data";

interface AskPageProps {
  dataset: CryoLensDataset;
  initialPrompt?: string;
  onHypothesisSaved: () => Promise<void> | void;
  onOpenHypotheses: () => void;
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
  submitLabel: string;
}

function createInitialSearchState(prompt: string, profile: AgentProfile): LiveAgentSearchState {
  return {
    assistantText: "",
    errorMessage: null,
    finished: false,
    prompt,
    profile,
    savedHypothesis: null,
    statusHistory: [profile === "hypothesis" ? "Starting hypothesis run." : "Starting research run."],
    statusMessage: profile === "hypothesis" ? "Starting hypothesis run." : "Starting research run.",
    toolCalls: [],
  };
}

function appendToolCall(toolCalls: AgentToolCall[], toolName: string): AgentToolCall[] {
  return [
    ...toolCalls,
    {
      id: `${toolName}-${toolCalls.length + 1}`,
      inputSummary: "Waiting for tool input...",
      outputSummary: "Pending",
      state: "running",
      toolName,
    },
  ];
}

function updateLatestToolCall(
  toolCalls: AgentToolCall[],
  updater: (toolCall: AgentToolCall) => AgentToolCall,
): AgentToolCall[] {
  for (let index = toolCalls.length - 1; index >= 0; index -= 1) {
    if (toolCalls[index]?.state === "running") {
      return toolCalls.map((toolCall, toolIndex) => (
        toolIndex === index ? updater(toolCall) : toolCall
      ));
    }
  }

  return toolCalls;
}

function applyStreamEvent(
  previousState: LiveAgentSearchState,
  event: AgentSearchStreamEvent,
): LiveAgentSearchState {
  switch (event.type) {
    case "status":
      return {
        ...previousState,
        statusHistory: [...previousState.statusHistory, event.message],
        statusMessage: event.message,
      };
    case "text_delta":
      return {
        ...previousState,
        assistantText: `${previousState.assistantText}${event.text}`,
      };
    case "tool_start":
      return {
        ...previousState,
        statusMessage: `Running ${event.name}...`,
        toolCalls: appendToolCall(previousState.toolCalls, event.name),
      };
    case "tool_input_delta":
      return {
        ...previousState,
        toolCalls: updateLatestToolCall(previousState.toolCalls, (toolCall) => ({
          ...toolCall,
          inputSummary: `${toolCall.inputSummary === "Waiting for tool input..." ? "" : toolCall.inputSummary}${event.text}`,
        })),
      };
    case "tool_end":
      return {
        ...previousState,
        statusMessage: `${event.name} completed.`,
        toolCalls: updateLatestToolCall(previousState.toolCalls, (toolCall) => ({
          ...toolCall,
          inputSummary: event.input || toolCall.inputSummary,
          outputSummary: "Completed in sandbox",
          state: "completed",
        })),
      };
    case "result":
      return {
        ...previousState,
        assistantText: previousState.assistantText.trim() ? previousState.assistantText : event.text,
        finished: true,
        statusMessage: "Research complete.",
      };
    case "hypothesis_saved":
      return {
        ...previousState,
        savedHypothesis: event.hypothesis,
        statusHistory: [...previousState.statusHistory, `Saved hypothesis draft: ${event.hypothesis.title}`],
        statusMessage: "Hypothesis saved.",
      };
    case "error":
      return {
        ...previousState,
        errorMessage: event.message,
        finished: true,
        statusHistory: [...previousState.statusHistory, event.message],
        statusMessage: "Research failed.",
      };
    default:
      return previousState;
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
  submitLabel,
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
            aria-label={submitLabel}
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

function ResearchTrace({ search }: { search: LiveAgentSearchState }): JSX.Element | null {
  const hasTrace = search.toolCalls.length > 0 || search.statusHistory.length > 1 || search.errorMessage;

  if (!hasTrace) {
    return null;
  }

  return (
    <details className="rounded-xl border border-border/70 bg-white/88" open={!search.finished}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-hero">
              Research trace
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.toolCalls.length} tool calls · {search.statusHistory.length} status events
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {search.finished ? "Inspect" : "Live"}
        </span>
      </summary>
      <div className="space-y-4 border-t border-border/70 px-4 py-4">
        {search.toolCalls.length ? (
          <div className="space-y-2">
            {search.toolCalls.map((toolCall) => (
              <div
                key={toolCall.id}
                className="rounded-lg border border-border/80 bg-[#f8fbfc] px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hero">
                    {toolCall.toolName}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {toolCall.state}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {toolCall.inputSummary.trim() || "Waiting for tool input..."}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {toolCall.outputSummary}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-border/80 bg-[#f8fbfc] p-3">
          {search.statusHistory.map((entry, index) => (
            <div
              key={`${index}-${entry}`}
              className="text-sm leading-6 text-foreground"
            >
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {index + 1}
              </span>
              {entry}
            </div>
          ))}
        </div>

        {search.errorMessage ? (
          <div className="rounded-lg border border-[#f0c7bf] bg-[#fdf3f1] px-3 py-3 text-sm leading-6 text-[#8d4b3e]">
            {search.errorMessage}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function HypothesisDraftCard({
  hypothesis,
  onOpenHypotheses,
}: {
  hypothesis: Hypothesis;
  onOpenHypotheses: () => void;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#466254]">
            Saved hypothesis
          </p>
          <h3 className="mt-2 font-headline text-xl font-extrabold tracking-tight text-hero">
            {hypothesis.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground">
            {hypothesis.summary}
          </p>
        </div>
        <Button
          className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
          onClick={onOpenHypotheses}
          variant="outline"
        >
          Open hypotheses
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-sm border border-emerald-200 bg-white/90 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Benchmark
          </p>
          <p className="mt-1 text-sm text-foreground">{hypothesis.benchmark}</p>
        </div>
        <div className="rounded-sm border border-emerald-200 bg-white/90 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Target
          </p>
          <p className="mt-1 text-sm text-foreground">{hypothesis.target}</p>
        </div>
        <div className="rounded-sm border border-emerald-200 bg-white/90 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Next step
          </p>
          <p className="mt-1 text-sm text-foreground">{hypothesis.nextStep}</p>
        </div>
      </div>
    </div>
  );
}

export function AskPage({
  dataset,
  initialPrompt,
  onHypothesisSaved,
  onOpenHypotheses,
}: AskPageProps): JSX.Element {
  const [prompt, setPrompt] = useState<string>(initialPrompt ?? "");
  const [activeSearch, setActiveSearch] = useState<LiveAgentSearchState | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [profile, setProfile] = useState<AgentProfile>("research");
  const requestIdRef = useRef<number>(0);

  async function runPrompt(nextPrompt: string): Promise<void> {
    const trimmedPrompt = nextPrompt.trim();
    if (!trimmedPrompt || isRunning) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPrompt(trimmedPrompt);
    setIsRunning(true);
    setActiveSearch(createInitialSearchState(trimmedPrompt, profile));

    try {
      await streamAgentSearch(trimmedPrompt, profile, (event) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (event.type === "hypothesis_saved") {
          void Promise.resolve(onHypothesisSaved());
        }

        setActiveSearch((previousState) => (
          previousState ? applyStreamEvent(previousState, event) : previousState
        ));
      });
    } catch (error) {
      if (requestIdRef.current === requestId) {
        const message = error instanceof Error ? error.message : "Unknown agent-search error.";
        setActiveSearch((previousState) => {
          const baseState = previousState ?? createInitialSearchState(trimmedPrompt, profile);
          return applyStreamEvent(baseState, {
            message,
            type: "error",
          });
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

  const dataSummary =
    `${dataset.appStats.papers} papers · ${dataset.appStats.findings} findings · ${dataset.appStats.molecules} molecules · ${dataset.appStats.structures} formulations`;

  if (!activeSearch) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center">
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Ask CryoLens
            </p>
            <h1 className="font-headline text-[2.15rem] font-extrabold leading-[1.02] tracking-tight text-hero sm:text-[2.8rem]">
              Ask CryoLens
            </h1>
            <p className="mx-auto max-w-2xl text-[15px] leading-7 text-muted-foreground">
              Query the live cryoLens evidence base or switch into hypothesis mode to save an evidence-backed next experiment.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {dataSummary}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {(["research", "hypothesis"] as AgentProfile[]).map((mode) => (
              <Button
                key={mode}
                className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                onClick={() => setProfile(mode)}
                variant={profile === mode ? "default" : "outline"}
              >
                {mode === "research" ? "Research" : "Generate hypothesis"}
              </Button>
            ))}
          </div>

          <PromptComposer
            footerText={profile === "research" ? "Start with a question or saved prompt" : "Start from a benchmark and ask for a safer or stronger variant"}
            onChange={setPrompt}
            onKeyDown={handleComposerKeyDown}
            onSubmit={() => void runPrompt(prompt)}
            placeholder={profile === "research"
              ? "Ask about VS55, formamide toxicity, or the next safer cocktail to test..."
              : "Starting from VS55, propose one lower-toxicity 4 C variant and explain why..."}
            prompt={prompt}
            submitLabel={profile === "research" ? "Run search" : "Generate hypothesis"}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {dataset.savedPrompts.map((savedPrompt) => (
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
            {activeSearch.profile === "hypothesis" ? "Generate Hypothesis" : "Ask CryoLens"}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${activeSearch.finished ? "bg-[#6a7f71]" : "bg-[#b68748]"}`} />
            {activeSearch.statusMessage}
          </p>
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
        {[
          { id: "user", role: "user" as const, content: activeSearch.prompt },
          {
            id: "assistant",
            role: "assistant" as const,
            content: activeSearch.assistantText.trim()
              ? activeSearch.assistantText
              : activeSearch.profile === "hypothesis"
                ? "Generating an evidence-backed hypothesis from the live cryoLens dataset..."
                : "Researching the live cryoLens dataset...",
          },
        ].map((message) => (
          <Fragment key={message.id}>
            <ConversationMessage
              content={message.content}
              isStreaming={message.role === "assistant" && !activeSearch.finished}
              role={message.role}
            />
          </Fragment>
        ))}

        {activeSearch.savedHypothesis ? (
          <HypothesisDraftCard
            hypothesis={activeSearch.savedHypothesis}
            onOpenHypotheses={onOpenHypotheses}
          />
        ) : null}

        <ResearchTrace search={activeSearch} />
      </div>

      <div className="mt-auto pt-6">
        <div className="mb-3 flex items-center gap-2">
          {(["research", "hypothesis"] as AgentProfile[]).map((mode) => (
            <Button
              key={mode}
              className="h-8 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
              onClick={() => setProfile(mode)}
              variant={profile === mode ? "default" : "outline"}
            >
              {mode === "research" ? "Research" : "Generate hypothesis"}
            </Button>
          ))}
        </div>
        <PromptComposer
          disabled={isRunning}
          footerText="Enter to send · Shift+Enter for newline"
          onChange={setPrompt}
          onKeyDown={handleComposerKeyDown}
          onReset={resetConversation}
          onSubmit={() => void runPrompt(prompt)}
          placeholder={profile === "research" ? "Ask a follow-up question..." : "Ask for another benchmark-guided hypothesis..."}
          prompt={prompt}
          submitLabel={profile === "research" ? "Continue search" : "Generate hypothesis"}
        />
      </div>
    </div>
  );
}
