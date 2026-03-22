import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Beaker,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Layers,
  LinkIcon,
  ShieldCheck,
  Sparkles,
  Target,
  TestTubeDiagonal,
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HypothesisSummary {
  id: string;
  name: string;
  tagline: string;
  target_tissue: string;
  target_organism: string;
  status: string;
  total_cpa_concentration: number | string;
  concentration_unit: string;
  mechanism_summary: string;
  advantages: string;
  evidence_score: number | string;
  evidence_paper_count: number;
  evidence_finding_count: number;
  component_count: number;
  evidence_count: number;
}

interface HypothesisComponent {
  compound_name: string;
  compound_id: string | null;
  concentration: number;
  concentration_unit: string;
  role: string;
  rationale: string;
}

interface HypothesisEvidence {
  finding_id: number;
  component_name: string;
  relevance: string;
  evidence_type: string;
  confidence: string;
  claim: string;
  category: string;
  paper_doi: string;
  source_location: string;
  tissue_type: string;
  organism: string;
  paper_title: string;
  paper_year: number;
  journal: string;
}

interface HypothesisDetail extends HypothesisSummary {
  carrier_solution: string;
  risks: string;
  protocol_summary: string;
  markdown: string;
  components: HypothesisComponent[];
  evidence: HypothesisEvidence[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const HYPOTHESIS_LABELS: Record<string, { label: string; color: string }> = {
  "cl-vitroshield": { label: "CryoLens-1", color: "bg-blue-100 text-blue-800" },
  "cl-isovit": { label: "CryoLens-2", color: "bg-emerald-100 text-emerald-800" },
  "cl-ovaguard": { label: "CryoLens-3", color: "bg-violet-100 text-violet-800" },
};

const STATUS_COLORS: Record<string, string> = {
  proposed: "bg-amber-100 text-amber-800",
  testing: "bg-blue-100 text-blue-800",
  validated: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const ROLE_LABELS: Record<string, { label: string; dot: string }> = {
  penetrating_cpa: { label: "Penetrating CPA", dot: "bg-blue-500" },
  non_penetrating_cpa: { label: "Non-Penetrating CPA", dot: "bg-teal-500" },
  ice_blocker: { label: "Ice Blocker", dot: "bg-cyan-500" },
  ice_recrystallization_inhibitor: { label: "IRI Protein", dot: "bg-indigo-500" },
  anti_apoptotic: { label: "Anti-Apoptotic", dot: "bg-rose-500" },
  antioxidant: { label: "Antioxidant", dot: "bg-orange-500" },
  membrane_sealant: { label: "Membrane Sealant", dot: "bg-pink-500" },
  osmotic_agent: { label: "Osmotic Agent", dot: "bg-lime-500" },
  carrier: { label: "Carrier", dot: "bg-gray-400" },
  delivery_vehicle: { label: "Delivery Vehicle", dot: "bg-purple-500" },
  nanowarming_agent: { label: "Nanowarming", dot: "bg-red-500" },
  other: { label: "Other", dot: "bg-gray-400" },
};

const EVIDENCE_TYPE_ICONS: Record<string, string> = {
  direct_support: "✓",
  mechanism_basis: "⚙",
  synergy_evidence: "⇄",
  dose_guidance: "◎",
  gap_motivation: "△",
  toxicity_data: "⚠",
  negative_control: "✗",
};

function ScoreBar({ score }: { score: number | string }) {
  const n = typeof score === "string" ? parseFloat(score) || 0 : score;
  const pct = Math.min((n / 10) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-highlight/80 to-highlight transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="data-value text-xs font-semibold text-hero">{n.toFixed(1)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card View (List)                                                   */
/* ------------------------------------------------------------------ */

function HypothesisCard({
  h,
  onClick,
}: {
  h: HypothesisSummary;
  onClick: () => void;
}) {
  const meta = HYPOTHESIS_LABELS[h.id] || { label: h.id, color: "bg-gray-100 text-gray-800" };

  return (
    <Card className="glass-panel card-interactive cursor-pointer" onClick={onClick}>
      <CardContent className="p-0">
        {/* Accent top bar */}
        <div className="h-1 w-full rounded-t-sm bg-gradient-to-r from-highlight/70 via-highlight/40 to-transparent" />

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                  {meta.label}
                </span>
                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[h.status] || "bg-gray-100"}`}>
                  {h.status}
                </span>
                <Badge variant="outline">{h.target_tissue}</Badge>
                <Badge variant="outline">{h.target_organism}</Badge>
              </div>

              <h3 className="font-headline text-xl font-extrabold tracking-tight text-hero">
                {h.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
                {h.tagline}
              </p>
            </div>

            {/* CPA concentration badge */}
            <div className="flex-shrink-0 text-right">
              <div className="rounded-sm border border-border bg-white/80 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total CPA
                </p>
                <p className="data-value text-2xl font-bold text-hero mt-0.5">
                  {h.total_cpa_concentration}{h.concentration_unit}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            <div className="rounded-sm bg-muted/60 p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-highlight" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Score
                </span>
              </div>
              <div className="mt-2">
                <ScoreBar score={h.evidence_score} />
              </div>
            </div>
            <div className="rounded-sm bg-muted/60 p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Components
              </p>
              <p className="data-value text-lg font-bold text-hero mt-1">{h.component_count}</p>
            </div>
            <div className="rounded-sm bg-muted/60 p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Links
              </p>
              <p className="data-value text-lg font-bold text-hero mt-1">{h.evidence_count}</p>
            </div>
            <div className="rounded-sm bg-muted/60 p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Papers Cited
              </p>
              <p className="data-value text-lg font-bold text-hero mt-1">{h.evidence_paper_count}</p>
            </div>
          </div>

          {/* Mechanism preview */}
          <div className="mt-4 rounded-sm border border-border/60 bg-white/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Mechanism
            </p>
            <p className="text-sm leading-relaxed text-foreground line-clamp-3">
              {h.mechanism_summary}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" className="gap-2">
              Explore hypothesis
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail View                                                        */
/* ------------------------------------------------------------------ */

function HypothesisDetailView({
  h,
  onBack,
}: {
  h: HypothesisDetail;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "components" | "evidence" | "report">("overview");
  const meta = HYPOTHESIS_LABELS[h.id] || { label: h.id, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-5 page-enter">
      {/* Back + Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-hero transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          All hypotheses
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>
                {meta.label}
              </span>
              <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[h.status] || ""}`}>
                {h.status}
              </span>
            </div>
            <h1 className="console-title">{h.name}</h1>
            <p className="console-subtitle max-w-3xl">{h.tagline}</p>
          </div>
          <div className="rounded-sm border border-border bg-white px-5 py-3 text-center flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total CPA
            </p>
            <p className="data-value text-3xl font-bold text-hero mt-0.5">
              {h.total_cpa_concentration}<span className="text-base ml-0.5">{h.concentration_unit}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {([
          ["overview", "Overview", Target],
          ["components", "Formulation", TestTubeDiagonal],
          ["evidence", "Evidence Chain", LinkIcon],
          ["report", "Full Report", BookOpen],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? "border-highlight text-hero"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab h={h} />}
      {activeTab === "components" && <ComponentsTab h={h} />}
      {activeTab === "evidence" && <EvidenceTab h={h} />}
      {activeTab === "report" && <ReportTab h={h} />}
    </div>
  );
}

/* --- Overview Tab --- */
function OverviewTab({ h }: { h: HypothesisDetail }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3 page-enter">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-5">
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Beaker className="h-4 w-4 text-highlight" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-hero">Mechanism</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{h.mechanism_summary}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-data-positive" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-hero">Advantages</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{h.advantages}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-hero">Protocol Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{h.protocol_summary}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar stats */}
      <div className="space-y-4">
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence Strength
            </h4>
            <ScoreBar score={h.evidence_score} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center">
                <p className="data-value text-2xl font-bold text-hero">{h.evidence?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Findings</p>
              </div>
              <div className="text-center">
                <p className="data-value text-2xl font-bold text-hero">{h.evidence_paper_count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Papers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-5 space-y-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge>{h.target_tissue}</Badge>
              <Badge variant="outline">{h.target_organism}</Badge>
            </div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-2">
              Carrier
            </h4>
            <p className="text-xs text-foreground">{h.carrier_solution}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-l-2 border-l-data-caution">
          <CardContent className="p-5 space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-data-caution">
              Key Risks
            </h4>
            <p className="text-sm leading-relaxed text-foreground">{h.risks}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* --- Components Tab --- */
function ComponentsTab({ h }: { h: HypothesisDetail }) {
  return (
    <div className="space-y-4 page-enter">
      <div className="list-stagger space-y-3">
        {h.components?.map((c, i) => {
          const roleInfo = ROLE_LABELS[c.role] || ROLE_LABELS.other;
          return (
            <Card key={i} className="glass-panel highlight-bar pl-4">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${roleInfo.dot}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {roleInfo.label}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-hero">{c.compound_name}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.rationale}
                    </p>
                  </div>
                  <div className="flex-shrink-0 rounded-sm border border-border bg-muted/60 px-3 py-2 text-center min-w-[80px]">
                    <p className="data-value text-lg font-bold text-hero">
                      {c.concentration}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{c.concentration_unit}</p>
                  </div>
                </div>
                {c.compound_id && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[11px] text-primary">{c.compound_id}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* --- Evidence Tab --- */
function EvidenceTab({ h }: { h: HypothesisDetail }) {
  const grouped = (h.evidence || []).reduce<Record<string, HypothesisEvidence[]>>((acc, e) => {
    const key = e.component_name || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6 page-enter">
      <p className="console-subtitle">
        Each evidence link traces from the hypothesis component → specific finding → source paper.
        Click a DOI to verify at the source.
      </p>

      {Object.entries(grouped).map(([component, evidences]) => (
        <div key={component}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-highlight" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-hero">
              {component}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              ({evidences.length} finding{evidences.length !== 1 ? "s" : ""})
            </span>
          </div>

          <div className="space-y-2 pl-4 border-l-2 border-border list-stagger">
            {evidences.map((e, i) => (
              <Card key={i} className="glass-panel">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Evidence type icon */}
                    <div className="flex-shrink-0 mt-0.5 h-7 w-7 rounded-sm bg-muted flex items-center justify-center text-sm" title={e.evidence_type}>
                      {EVIDENCE_TYPE_ICONS[e.evidence_type] || "•"}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Relevance note */}
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {e.relevance}
                      </p>

                      {/* Finding claim */}
                      {e.claim && (
                        <div className="mt-2 rounded-sm bg-muted/60 p-3 border-l-2 border-primary/40">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Finding #{e.finding_id} · {e.category?.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs leading-relaxed text-foreground">
                            {e.claim}
                          </p>
                        </div>
                      )}

                      {/* Source paper */}
                      {e.paper_title && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <BookOpen className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{e.paper_title}</span>
                          <span className="flex-shrink-0">({e.paper_year})</span>
                          {e.paper_doi && (
                            <a
                              href={`https://doi.org/${e.paper_doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:text-highlight transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                              DOI
                            </a>
                          )}
                        </div>
                      )}

                      {/* Badges */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          e.confidence === "high"
                            ? "bg-emerald-100 text-emerald-800"
                            : e.confidence === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {e.confidence}
                        </span>
                        <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                          {e.evidence_type?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Report Tab (Markdown) --- */
function ReportTab({ h }: { h: HypothesisDetail }) {
  if (!h.markdown) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          No detailed report available for this hypothesis.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="page-enter">
      <Card className="glass-panel">
        <CardContent className="p-8">
          <div className="prose prose-sm max-w-none prose-headings:font-headline prose-headings:text-hero prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h3:text-base prose-p:text-foreground prose-p:leading-relaxed prose-li:text-foreground prose-strong:text-hero prose-code:text-highlight prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-xs prose-table:text-sm prose-th:text-[10px] prose-th:uppercase prose-th:tracking-wider prose-th:text-muted-foreground prose-td:text-foreground prose-hr:border-border">
            <MarkdownRenderer content={h.markdown} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Simple markdown → HTML (no external deps) */
function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/80 p-4 rounded-sm overflow-x-auto text-xs"><code>$2</code></pre>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_match, header: string, body: string) => {
      const ths = header.split("|").filter(Boolean).map((h: string) => `<th class="px-3 py-2 text-left">${h.trim()}</th>`).join("");
      const rows = body.trim().split("\n").map((row: string) => {
        const tds = row.split("|").filter(Boolean).map((cell: string) => `<td class="px-3 py-2 border-t border-border">${cell.trim()}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
      return `<table class="w-full border border-border rounded-sm"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold/italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-primary hover:text-highlight">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-highlight pl-4 italic text-muted-foreground">$1</blockquote>');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function HypothesesPage() {
  const [hypotheses, setHypotheses] = useState<HypothesisSummary[]>([]);
  const [detail, setDetail] = useState<HypothesisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/v1/hypotheses`)
      .then((r) => r.json())
      .then((data) => {
        setHypotheses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openDetail(id: string) {
    fetch(`${API}/api/v1/hypotheses/${id}`)
      .then((r) => r.json())
      .then((data) => setDetail(data))
      .catch(() => {});
  }

  if (detail) {
    return (
      <HypothesisDetailView
        h={detail}
        onBack={() => setDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-5 page-enter">
      <section>
        <h1 className="console-title">CPA Design Hypotheses</h1>
        <p className="mt-1 console-subtitle max-w-2xl">
          AI-designed cryoprotective agent formulations generated by CryoLens, each backed by
          traceable evidence chains from {hypotheses.reduce((s, h) => s + (Number(h.evidence_count) || 0), 0)} findings
          across {hypotheses.reduce((s, h) => s + (Number(h.evidence_paper_count) || 0), 0)} papers.
        </p>
      </section>

      <div className="space-y-4 list-stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-sm" />
          ))
        ) : hypotheses.length ? (
          hypotheses.map((h) => (
            <HypothesisCard key={h.id} h={h} onClick={() => openDetail(h.id)} />
          ))
        ) : (
          <Card className="glass-panel">
            <CardContent className="p-8 text-center">
              <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hypotheses generated yet. Use the Research page to design a novel CPA.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
