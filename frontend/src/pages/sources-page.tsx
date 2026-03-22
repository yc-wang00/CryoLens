import { useCallback, useEffect, useState } from "react";

import { CryoProgressStory } from "../components/cryo-progress-story";
import { TissueLandscape } from "../components/insights/tissue-landscape";
import { CompoundUniverse } from "../components/insights/compound-universe";
import { OrganismHeatmap } from "../components/insights/organism-heatmap";
import type { CryoLensStoryStats } from "../data/cryo-lens";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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

const PAGE_SIZE = 30;

export function SourcesPage() {
  const [tab, setTab] = useState<TabKey>("overview");
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
      {/* Header */}
      <section>
        <h1 className="console-title">Knowledge Base</h1>
        <p className="mt-1 console-subtitle">
          {stats ? `${stats.counts.papers.toLocaleString()} papers · ${stats.counts.findings.toLocaleString()} findings · ${stats.counts.compounds} compounds` : "Loading..."}
        </p>
      </section>

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

          {stats ? (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Papers", value: stats.counts.papers },
                { label: "Findings", value: stats.counts.findings },
                { label: "Compounds", value: stats.counts.compounds },
                { label: "Formulations", value: stats.counts.formulations },
              ].map((s) => (
                <Card key={s.label} className="glass-panel">
                  <CardContent className="p-4">
                    <p className="table-header">{s.label}</p>
                    <p className="mt-1 font-headline text-2xl font-bold tracking-tight text-hero">
                      {(s.value ?? 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {tab === "tissues" && <TissueLandscape />}
      {tab === "compounds" && <CompoundUniverse />}
      {tab === "organisms" && <OrganismHeatmap />}

      {tab === "papers" && (
        <div className="space-y-4">
          {/* Search */}
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

          {/* Table */}
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

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button disabled={offset === 0} onClick={() => handlePage("prev")} size="sm" variant="outline">
                  Previous
                </Button>
                <span className="flex items-center px-3 text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button disabled={offset + PAGE_SIZE >= total} onClick={() => handlePage("next")} size="sm" variant="outline">
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
