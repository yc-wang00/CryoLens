import { useCallback, useEffect, useState } from "react";

import { CryoProgressStory } from "../components/cryo-progress-story";
import { TissueLandscape } from "../components/insights/tissue-landscape";
import { CompoundUniverse } from "../components/insights/compound-universe";
import { OrganismHeatmap } from "../components/insights/organism-heatmap";
import type { CryoLensStoryStats } from "../data/cryo-lens";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { ProgressBar } from "../components/ui/progress-bar";

interface Paper {
  doi: string;
  title: string;
  year: number;
  journal: string;
  finding_count: number;
}

interface PapersResponse {
  total: number;
  limit: number;
  offset: number;
  items: Paper[];
}

interface StatsResponse {
  counts: Record<string, number>;
  story: CryoLensStoryStats;
  top_tags: Array<{ tag: string; count: number }>;
}

type TabKey = "overview" | "tissues" | "compounds" | "organisms" | "papers";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "tissues", label: "Tissues" },
  { key: "compounds", label: "Compounds" },
  { key: "organisms", label: "Organisms" },
  { key: "papers", label: "Papers" },
];

const MCP_URL = "https://mcp.cryolens.io/mcp";

interface AgentOption {
  id: string;
  name: string;
  description: string;
  instruction: string;
  code: string;
  note?: string;
}

const AGENTS: AgentOption[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    description: "Anthropic's desktop app",
    instruction: "Add to your Claude Desktop config file:",
    code: `{
  "mcpServers": {
    "cryolens": {
      "url": "${MCP_URL}"
    }
  }
}`,
    note: "Config location: ~/Library/Application Support/Claude/claude_desktop_config.json",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's CLI agent",
    instruction: "Run this command in your terminal:",
    code: `claude mcp add cryolens --transport http ${MCP_URL}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-powered code editor",
    instruction: "Add to .cursor/mcp.json in your project:",
    code: `{
  "mcpServers": {
    "cryolens": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI editor",
    instruction: "Add to your Windsurf MCP config:",
    code: `{
  "mcpServers": {
    "cryolens": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    description: "OpenAI's coding agent",
    instruction: "Add to your codex MCP server config:",
    code: `{
  "mcpServers": {
    "cryolens": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Any MCP-compatible client",
    instruction: "Use this streamable HTTP endpoint:",
    code: MCP_URL,
    note: "Works with any client that supports the Model Context Protocol (MCP) streamable HTTP transport.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
      }}
      className="shrink-0 rounded-sm border border-border/50 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-hero hover:border-border transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState("claude-desktop");
  const agent = AGENTS.find((a) => a.id === selected) ?? AGENTS[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Connect to CryoLens</DialogTitle>
          <DialogDescription>
            Choose your AI agent below and follow the setup instructions.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 space-y-4">
          {/* Agent selector */}
          <div className="flex flex-wrap gap-1.5">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={`rounded-sm border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  selected === a.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          {/* Instructions for selected agent */}
          <div className="rounded-sm border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-hero">{agent.name}</p>
                <p className="text-[11px] text-muted-foreground">{agent.description}</p>
              </div>
              <CopyButton text={agent.code} />
            </div>
            <p className="text-[11px] text-muted-foreground">{agent.instruction}</p>
            <pre className="rounded-sm bg-white border border-border/50 px-3 py-2.5 text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {agent.code}
            </pre>
            {agent.note && (
              <p className="text-[10px] text-muted-foreground">{agent.note}</p>
            )}
          </div>

          {/* Available tools */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
              8 tools available after connecting
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "search_compounds", "get_compound_details", "search_viability",
                "compare_formulations", "search_findings", "get_protocol",
                "find_gaps", "query_database",
              ].map((tool) => (
                <span key={tool} className="rounded-sm bg-muted/60 px-2 py-1 text-[9px] font-mono text-muted-foreground">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PAGE_SIZE = 30;

export function SourcesPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [connectOpen, setConnectOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPapers = useCallback(async (searchQuery: string, pageOffset: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(pageOffset),
    });
    if (searchQuery) params.set("search", searchQuery);

    const response = await fetch(`/api/v1/papers?${params}`);
    const data: PapersResponse = await response.json();
    setPapers(data.items);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPapers("", 0);
    fetch("/api/v1/stats")
      .then((r) => r.json())
      .then((data: StatsResponse) => setStats(data))
      .catch(() => {});
  }, [fetchPapers]);

  function handleSearch() {
    setOffset(0);
    void fetchPapers(search, 0);
  }

  function handlePage(direction: "next" | "prev") {
    const newOffset = direction === "next" ? offset + PAGE_SIZE : Math.max(0, offset - PAGE_SIZE);
    setOffset(newOffset);
    void fetchPapers(search, newOffset);
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const maxFindings = papers.length ? Math.max(...papers.map((p) => p.finding_count)) : 1;

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <section className="rounded-sm border border-border/60 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge>Open Source</Badge>
              <Badge variant="accent">MCP Connected</Badge>
            </div>
            <h1 className="font-headline text-[1.6rem] font-bold tracking-tight text-hero leading-tight">
              The world's first structured knowledge base for cryopreservation.
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {stats
                ? `${stats.counts.papers.toLocaleString()} papers extracted, ${stats.counts.findings.toLocaleString()} findings normalized, ${stats.counts.compounds} compounds indexed.`
                : "Loading..."
              }
              {" "}Open to every researcher and AI agent.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => setConnectOpen(true)} variant="highlight">
                Connect your agent
              </Button>
              <a
                href="https://github.com/yc-wang00/CryoSight"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-hero transition-colors"
              >
                View on GitHub →
              </a>
            </div>
          </div>
          {stats ? (
            <div className="grid grid-cols-2 gap-2 text-center shrink-0">
              {[
                { label: "Papers", value: stats.counts.papers },
                { label: "Findings", value: stats.counts.findings },
                { label: "Compounds", value: stats.counts.compounds },
                { label: "Formulations", value: stats.counts.formulations },
              ].map((s) => (
                <div key={s.label} className="rounded-sm border border-border/50 bg-muted/30 px-4 py-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 font-headline text-xl font-bold text-hero">{(s.value ?? 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Connect dialog */}
      <ConnectDialog open={connectOpen} onClose={() => setConnectOpen(false)} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              tab === t.key
                ? "border-b-2 border-hero text-hero"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-5">
          {stats?.story ? <CryoProgressStory storyStats={stats.story} /> : null}
        </div>
      )}

      {tab === "tissues" && <TissueLandscape />}
      {tab === "compounds" && <CompoundUniverse />}
      {tab === "organisms" && <OrganismHeatmap />}

      {tab === "papers" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-sm border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              placeholder="Search papers by title or DOI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">Search</Button>
          </div>

          <div className="rounded-sm border border-border/70 bg-white">
            <div className="grid grid-cols-[3rem_1fr_8rem_6rem] gap-4 border-b border-border bg-muted/80 px-4 py-3">
              <div className="table-header">#</div>
              <div className="table-header">Source document</div>
              <div className="table-header">Findings</div>
              <div className="table-header text-right">Year</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : papers.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No papers found.</div>
            ) : (
              papers.map((paper, index) => (
                <div
                  key={paper.doi}
                  className="grid grid-cols-[3rem_1fr_8rem_6rem] gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/35"
                >
                  <div className="font-headline text-sm font-bold text-border tabular-nums">
                    {String(offset + index + 1).padStart(3, "0")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{paper.journal}</Badge>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold tracking-tight text-hero leading-snug">
                      {paper.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">{paper.doi}</p>
                  </div>
                  <div>
                    <p className="font-headline text-lg font-bold text-hero">{paper.finding_count}</p>
                    <ProgressBar
                      className="mt-1.5"
                      value={maxFindings > 0 ? (paper.finding_count / maxFindings) * 100 : 0}
                    />
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{paper.year}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button disabled={offset === 0} onClick={() => handlePage("prev")} size="sm" variant="outline">Previous</Button>
                <span className="flex items-center px-3 text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
                <Button disabled={offset + PAGE_SIZE >= total} onClick={() => handlePage("next")} size="sm" variant="outline">Next</Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
