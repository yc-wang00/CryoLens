import { ArrowRight, Bot, Search, Sparkles, Wrench } from "lucide-react";
import { Fragment, useRef, useState } from "react";

import type { AgentToolCall } from "../data/mock-data";
import type { CryoLensDataset } from "../data/cryo-lens";
import {
  streamAgentSearch,
  type AgentSearchStreamEvent,
  type LiveAgentSearchState,
} from "../data/agent-search";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";

interface AskPageProps {
  dataset: CryoLensDataset;
  datasetLog?: string[];
  initialPrompt?: string;
}

function createInitialSearchState(prompt: string): LiveAgentSearchState {
  return {
    assistantText: "",
    errorMessage: null,
    finished: false,
    prompt,
    statusHistory: ["Starting sandboxed research run."],
    statusMessage: "Starting sandboxed research run.",
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

function ToolCallBlock({ toolCalls }: { toolCalls: AgentToolCall[] }) {
  if (!toolCalls.length) {
    return null;
  }

  return (
    <div className="rounded-sm border border-border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hero">
          Tool calls
        </span>
      </div>
      <div className="space-y-3">
        {toolCalls.map((toolCall) => (
          <div key={toolCall.id} className="rounded-sm border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-hero">
                {toolCall.toolName}
              </span>
              <Badge variant="accent">{toolCall.state}</Badge>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Input
            </p>
            <p className="mt-1 max-h-28 overflow-hidden text-sm leading-6 text-foreground">
              {toolCall.inputSummary}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Result
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">{toolCall.outputSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AskPage({
  dataset,
  datasetLog = [],
  initialPrompt,
}: AskPageProps) {
  const [prompt, setPrompt] = useState<string>(initialPrompt ?? dataset.savedPrompts[0] ?? "");
  const [activeSearch, setActiveSearch] = useState<LiveAgentSearchState | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
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
    setActiveSearch(createInitialSearchState(trimmedPrompt));

    try {
      await streamAgentSearch(trimmedPrompt, (event) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setActiveSearch((previousState) => (
          previousState ? applyStreamEvent(previousState, event) : previousState
        ));
      });
    } catch (error) {
      if (requestIdRef.current === requestId) {
        const message = error instanceof Error ? error.message : "Unknown agent-search error.";
        setActiveSearch((previousState) => {
          const baseState = previousState ?? createInitialSearchState(trimmedPrompt);
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
  }

  if (!activeSearch) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-3 text-center">
            <Badge className="mx-auto w-fit" variant="accent">
              CryoSight search
            </Badge>
            <h1 className="console-title">Search CryoSight</h1>
            <p className="mx-auto max-w-2xl console-subtitle">
              Launch a sandboxed Claude research run, inspect live Supabase evidence through read-only SQL, and stream the agent&apos;s reasoning trace back into the demo UI.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {dataset.appStats.papers} papers · {dataset.appStats.findings} findings · {dataset.appStats.molecules} molecules · {dataset.appStats.structures} formulations
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {dataset.dataSourceLabel}
            </p>
          </div>

          <Card className="glass-panel">
            <CardContent className="space-y-4 p-6">
              <div className="rounded-sm border border-border bg-white p-4">
                <Textarea
                  className="min-h-32 border-none bg-transparent px-0 py-0 text-base leading-7 shadow-none focus:border-none"
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask CryoSight to research the live cryoLens database..."
                  value={prompt}
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  className="h-11 px-5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  onClick={() => void runPrompt(prompt)}
                >
                  Run sandboxed search
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardContent className="grid gap-3 p-5">
                <div>
                  <Badge className="w-fit">Starter prompts</Badge>
                  <h2 className="mt-3 text-lg font-semibold uppercase tracking-[0.08em] text-hero">
                    Suggested searches
                  </h2>
                </div>
                {dataset.savedPrompts.map((savedPrompt) => (
                  <Button
                    key={savedPrompt}
                    className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-sm font-medium normal-case tracking-normal"
                    onClick={() => void runPrompt(savedPrompt)}
                    variant="outline"
                  >
                    {savedPrompt}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardContent className="grid gap-3 p-5">
                <div>
                  <Badge className="w-fit" variant="accent">
                    Backend flow
                  </Badge>
                  <h2 className="mt-3 text-lg font-semibold uppercase tracking-[0.08em] text-hero">
                    What CryoSight is doing
                  </h2>
                </div>
                <div className="rounded-sm border border-border bg-white p-4 text-sm leading-6 text-foreground">
                  Each Ask prompt now starts a server-side Vercel sandbox, installs the Claude runtime if needed, and runs a live research pass against Supabase through a read-only MCP SQL surface.
                </div>
                <div className="rounded-sm border border-border bg-white p-4 text-sm leading-6 text-foreground">
                  The browser only receives streamed status, tool activity, and answer text. Database credentials and agent credentials stay on the backend.
                </div>
              </CardContent>
            </Card>
          </div>

          {datasetLog.length ? (
            <Card className="glass-panel">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hero">
                    Dataset load log
                  </span>
                </div>
                <div className="space-y-2 rounded-sm border border-border bg-white p-4">
                  {datasetLog.map((line, index) => (
                    <p
                      key={`${index}-${line}`}
                      className="font-mono text-[11px] leading-5 text-muted-foreground"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="console-title">CryoSight Search</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${activeSearch.finished ? "bg-[#6a7f71]" : "bg-[#b68748]"}`} />
            {activeSearch.statusMessage}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {dataset.dataSourceLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
            onClick={resetConversation}
            variant="outline"
          >
            New chat
          </Button>
        </div>
      </section>

      <Card className="glass-panel">
        <CardContent className="space-y-5 p-5">
          {[
            { id: "user", role: "user" as const, content: activeSearch.prompt },
            {
              id: "assistant",
              role: "assistant" as const,
              content: activeSearch.assistantText || "Sandbox is starting the research run...",
            },
          ].map((message, index) => (
            <Fragment key={message.id}>
              <div
                className={message.role === "user"
                  ? "ml-auto max-w-[86%] rounded-sm border border-border bg-white px-5 py-4"
                  : "mr-auto max-w-[94%] rounded-sm border border-border bg-muted/55 px-5 py-4"}
              >
                <div className="mb-2 flex items-center gap-2">
                  {message.role === "user" ? (
                    <Search className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hero">
                    {message.role === "user" ? "You" : "CryoSight"}
                  </span>
                  {message.role === "assistant" && !activeSearch.finished ? (
                    <Badge variant="accent">streaming</Badge>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{message.content}</p>
              </div>

              {index === 1 ? <ToolCallBlock toolCalls={activeSearch.toolCalls} /> : null}
            </Fragment>
          ))}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Dataset
              </p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-hero">
                {dataset.appStats.findings}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                findings available to the live research surface
              </p>
            </div>
            <div className="rounded-sm border border-border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tool calls
              </p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-hero">
                {activeSearch.toolCalls.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                schema and SQL operations traced from the sandbox
              </p>
            </div>
            <div className="rounded-sm border border-border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-hero">
                <Sparkles className="h-4 w-4" />
                {activeSearch.finished ? "complete" : "running"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeSearch.errorMessage ?? activeSearch.statusMessage}
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-white p-5">
            <div className="mb-4">
              <Badge className="w-fit" variant="accent">
                Run log
              </Badge>
              <h2 className="mt-3 text-lg font-semibold uppercase tracking-[0.08em] text-hero">
                Sandbox timeline
              </h2>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto rounded-sm border border-border bg-muted/25 p-3">
              {activeSearch.statusHistory.map((entry, index) => (
                <div
                  key={`${index}-${entry}`}
                  className="rounded-sm border border-border/70 bg-white px-3 py-2 text-sm leading-6 text-foreground"
                >
                  <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {index + 1}
                  </span>
                  {entry}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge className="w-fit">Next search</Badge>
                <h2 className="mt-3 text-lg font-semibold uppercase tracking-[0.08em] text-hero">
                  Continue the investigation
                </h2>
              </div>
            </div>
            <div className="mt-4 rounded-sm border border-border bg-muted/30 p-4">
              <Textarea
                className="min-h-28 border-none bg-transparent px-0 py-0 text-base leading-7 shadow-none focus:border-none"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask a follow-up research question..."
                value={prompt}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                className="h-11 px-5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                disabled={isRunning}
                onClick={() => void runPrompt(prompt)}
              >
                Continue search
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={resetConversation} variant="outline">
                Clear run
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
