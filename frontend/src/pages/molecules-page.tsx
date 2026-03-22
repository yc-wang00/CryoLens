import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { CardSkeleton } from "../components/ui/skeleton";
import { CompoundDetailPanel } from "../components/compound-detail-panel";

interface ViabilityPoint {
  compound_id: string;
  compound_name: string;
  abbreviation: string | null;
  concentration: number | null;
  temperature_c: number | null;
  value: number;
  unit: string;
  cell_type: string | null;
}

interface CompoundRow {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  molecular_weight: number | null;
  smiles: string | null;
  measurements: number;
  papers: number;
}

interface CoverageRow {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  viability: number;
  permeability: number;
  tg: number;
  findings: number;
  papers: number;
  tissues: number;
}

type ViewMode = "chart" | "table" | "gaps";

const COLORS = [
  "#4f6073", "#c45b3d", "#49655b", "#6b5b8a", "#2d7a4f",
  "#b07318", "#3b6d8f", "#8b4c5a", "#5a7a3b", "#7a5b3b",
  "#3d8b7a", "#8b3d5a", "#5a3d8b", "#7a8b3b",
];

const CHART_W = 800;
const CHART_H = 320;
const PAD = { top: 16, right: 24, bottom: 44, left: 46 };

const ROLE_ORDER = ["penetrating", "non_penetrating", "ice_blocker"];
const ROLE_LABEL: Record<string, string> = {
  penetrating: "Penetrating CPAs",
  non_penetrating: "Non-Penetrating",
  ice_blocker: "Ice Blockers",
};

const METRIC_COLS = ["viability", "permeability", "tg", "findings", "papers", "tissues"] as const;
const METRIC_HEADERS: Record<string, string> = {
  viability: "Viability",
  permeability: "Permeability",
  tg: "Tg",
  findings: "Findings",
  papers: "Papers",
  tissues: "Tissues",
};

function cellColor(value: number, metric: string): string {
  if (metric === "findings") {
    if (value === 0) return "bg-muted/30";
    if (value < 5) return "bg-amber-50";
    if (value < 20) return "bg-sky-50";
    return "bg-emerald-50";
  }
  if (value === 0) return "bg-muted/30";
  if (value < 3) return "bg-amber-50";
  if (value < 10) return "bg-sky-50";
  return "bg-emerald-50";
}

function cellText(value: number): string {
  if (value === 0) return "—";
  return String(value);
}

function cellTextColor(value: number): string {
  return value === 0 ? "text-border" : "text-hero";
}

export function MoleculesPage() {
  const [view, setView] = useState<ViewMode>("chart");
  const [viability, setViability] = useState<ViabilityPoint[]>([]);
  const [compounds, setCompounds] = useState<CompoundRow[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<ViabilityPoint | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);
  const [detailCompoundId, setDetailCompoundId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/library/viability").then((r) => r.json()),
      fetch("/api/v1/compounds?limit=100").then((r) => r.json()),
      fetch("/api/v1/library/coverage-matrix").then((r) => r.json()),
    ]).then(([v, c, m]) => {
      setViability(v);
      setCompounds(c.items);
      if (Array.isArray(m)) setCoverage(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const compoundNames = [...new Set(viability.map((p) => p.compound_name))].sort();
  const colorMap = Object.fromEntries(compoundNames.map((name, i) => [name, COLORS[i % COLORS.length]]));

  const chartData = viability.filter((p) =>
    p.concentration != null && p.value != null &&
    (!selectedCompound || p.compound_name === selectedCompound)
  );

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const maxConc = Math.max(...chartData.map((p) => p.concentration ?? 0), 1);
  const maxVal = Math.max(...chartData.map((p) => p.value), 0.01);

  function getX(conc: number) { return PAD.left + (conc / maxConc) * plotW; }
  function getY(val: number) { return PAD.top + plotH - (val / maxVal) * plotH; }

  // Coverage stats
  const noDataCount = coverage.filter((c) => c.viability === 0 && c.permeability === 0 && c.tg === 0).length;
  const totalGaps = coverage.reduce((s, c) =>
    s + (c.viability === 0 ? 1 : 0) + (c.permeability === 0 ? 1 : 0) + (c.tg === 0 ? 1 : 0), 0);

  if (loading) {
    return (
      <div className="space-y-5 page-enter">
        <section>
          <div className="skeleton h-8 w-56 mb-2" />
          <div className="skeleton h-4 w-72" />
        </section>
        <CardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="console-title">Compound Library</h1>
          <p className="mt-1 console-subtitle">
            {compounds.length} compounds · {viability.length} viability measurements
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={view === "chart" ? "default" : "outline"} onClick={() => setView("chart")}>Viability</Button>
          <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>Table</Button>
          <Button size="sm" variant={view === "gaps" ? "default" : "outline"} onClick={() => setView("gaps")}>Gaps</Button>
        </div>
      </section>

      {/* ── Viability scatter ── */}
      {view === "chart" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSelectedCompound(null)}
              className={`rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors ${!selectedCompound ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:text-foreground"}`}>
              All
            </button>
            {compoundNames.map((name) => {
              const compound = compounds.find((c) => c.name === name);
              return (
                <button key={name} type="button"
                  onClick={() => {
                    if (selectedCompound === name) {
                      setDetailCompoundId(compound?.id ?? null);
                    } else {
                      setSelectedCompound(name);
                    }
                  }}
                  className={`rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors flex items-center gap-1 ${selectedCompound === name ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:text-foreground"}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedCompound === name ? "white" : colorMap[name] }} />
                  {name}
                </button>
              );
            })}
          </div>
          {selectedCompound && (
            <p className="text-[10px] text-muted-foreground">
              Click again to open detail panel
            </p>
          )}

          <div className="rounded-sm border border-border/60 bg-white p-4">
            <div className="mb-2 flex justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-[0.12em]">Concentration vs Viability</span>
              <span>{chartData.length} points · White ring = 4°C</span>
            </div>
            <svg className="w-full" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ height: "auto", maxHeight: 360 }} onMouseLeave={() => setHoveredPoint(null)}>
              {[0.25, 0.5, 0.75, 1].map((r) => (
                <g key={r}>
                  <line x1={PAD.left} x2={CHART_W - PAD.right} y1={getY(maxVal * r)} y2={getY(maxVal * r)} stroke="rgba(0,0,0,0.04)" />
                  <text x={PAD.left - 6} y={getY(maxVal * r) + 3} textAnchor="end" fill="rgba(107,118,128,0.6)" fontSize="9" fontFamily="var(--font-mono)">{(maxVal * r).toFixed(maxVal <= 2 ? 2 : 0)}</text>
                </g>
              ))}
              {[0.25, 0.5, 0.75, 1].map((r) => (
                <g key={r}>
                  <line x1={getX(maxConc * r)} x2={getX(maxConc * r)} y1={PAD.top} y2={PAD.top + plotH} stroke="rgba(0,0,0,0.04)" />
                  <text x={getX(maxConc * r)} y={CHART_H - 14} textAnchor="middle" fill="rgba(107,118,128,0.6)" fontSize="9" fontFamily="var(--font-mono)">{(maxConc * r).toFixed(0)}</text>
                </g>
              ))}
              <text x={CHART_W / 2} y={CHART_H - 2} textAnchor="middle" fill="rgba(107,118,128,0.5)" fontSize="9">Concentration (mol/kg)</text>
              {maxVal <= 2 && <line x1={PAD.left} x2={CHART_W - PAD.right} y1={getY(1)} y2={getY(1)} stroke="rgba(196,91,61,0.25)" strokeDasharray="4 3" />}
              {chartData.map((p, i) => {
                const isHovered = hoveredPoint === p;
                const isCold = (p.temperature_c ?? 25) <= 10;
                return (
                  <circle key={i} cx={getX(p.concentration ?? 0)} cy={getY(p.value)} r={isHovered ? 6 : 3.5}
                    fill={colorMap[p.compound_name] ?? "#999"} fillOpacity={isHovered ? 1 : 0.65}
                    stroke={isCold ? "white" : "transparent"} strokeWidth={isCold ? 1.5 : 0}
                    style={{ cursor: "default" }} onMouseEnter={() => setHoveredPoint(p)} />
                );
              })}
            </svg>
            {hoveredPoint && (
              <div className="mt-2 flex items-center gap-3 rounded-sm border border-border/50 bg-muted/30 px-3 py-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorMap[hoveredPoint.compound_name] }} />
                <span className="font-semibold text-hero">{hoveredPoint.compound_name}</span>
                <span className="font-mono text-muted-foreground">{hoveredPoint.concentration} mol/kg &rarr; {hoveredPoint.value.toFixed(3)} {hoveredPoint.unit}</span>
                <span className="text-muted-foreground">{hoveredPoint.temperature_c}°C · {hoveredPoint.cell_type}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {view === "table" && (
        <div className="rounded-sm border border-border/70 bg-white">
          <div className="grid grid-cols-[1fr_6rem_5rem_5rem_5rem] gap-4 border-b border-border bg-muted/80 px-4 py-3">
            <div className="table-header">Compound</div>
            <div className="table-header">Role</div>
            <div className="table-header text-right">MW</div>
            <div className="table-header text-right">Data</div>
            <div className="table-header text-right">Papers</div>
          </div>
          {compounds.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setDetailCompoundId(c.id)}
              className="grid w-full grid-cols-[1fr_6rem_5rem_5rem_5rem] gap-4 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/35"
            >
              <div>
                <span className="text-sm font-semibold text-hero">{c.name}</span>
                {c.abbreviation && <span className="ml-2 text-[10px] text-muted-foreground">({c.abbreviation})</span>}
              </div>
              <Badge variant={c.role === "penetrating" ? "default" : c.role === "ice_blocker" ? "accent" : "outline"}>{c.role.replace("_", " ")}</Badge>
              <span className="text-right text-[12px] font-mono text-muted-foreground">{c.molecular_weight?.toFixed(1) ?? "—"}</span>
              <span className="text-right text-[12px] font-mono font-semibold text-hero">{c.measurements}</span>
              <span className="text-right text-[12px] font-mono text-muted-foreground">{c.papers}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Coverage / Gaps matrix ── */}
      {view === "gaps" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {noDataCount} compounds have <strong className="text-hero">zero measurement data</strong>.{" "}
                {totalGaps} total metric gaps across {coverage.length} compounds.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted/40 border border-border/40" /> No data</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-50 border border-amber-200/40" /> Sparse</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-50 border border-sky-200/40" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-50 border border-emerald-200/40" /> Rich</span>
            </div>
          </div>

          {ROLE_ORDER.map((role) => {
            const rows = coverage.filter((c) => c.role === role);
            if (rows.length === 0) return null;
            return (
              <div key={role} className="rounded-sm border border-border/60 bg-white overflow-hidden">
                <div className="border-b border-border/40 bg-muted/30 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {ROLE_LABEL[role]} · {rows.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground w-40">
                          Compound
                        </th>
                        {METRIC_COLS.map((col) => (
                          <th key={col} className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground w-20">
                            {METRIC_HEADERS[col]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => setDetailCompoundId(row.id)}
                        >
                          <td className="px-4 py-2">
                            <span className="font-semibold text-hero">{row.abbreviation || row.name}</span>
                            {row.abbreviation && <span className="ml-1.5 text-[9px] text-muted-foreground">{row.name}</span>}
                          </td>
                          {METRIC_COLS.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="px-2 py-2 text-center">
                                <span className={`inline-block min-w-[2.5rem] rounded-sm border border-border/30 px-2 py-1 font-mono text-[10px] font-semibold ${cellColor(val, col)} ${cellTextColor(val)}`}>
                                  {cellText(val)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      <CompoundDetailPanel
        compoundId={detailCompoundId}
        onClose={() => setDetailCompoundId(null)}
      />
    </div>
  );
}
