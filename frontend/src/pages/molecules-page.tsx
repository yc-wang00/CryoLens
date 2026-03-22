import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

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

type ViewMode = "chart" | "table";

const COLORS = [
  "#4f6073", "#c45b3d", "#49655b", "#6b5b8a", "#2d7a4f",
  "#b07318", "#3b6d8f", "#8b4c5a", "#5a7a3b", "#7a5b3b",
  "#3d8b7a", "#8b3d5a", "#5a3d8b", "#7a8b3b",
];

const CHART_W = 800;
const CHART_H = 320;
const PAD = { top: 16, right: 24, bottom: 44, left: 46 };

export function MoleculesPage() {
  const [view, setView] = useState<ViewMode>("chart");
  const [viability, setViability] = useState<ViabilityPoint[]>([]);
  const [compounds, setCompounds] = useState<CompoundRow[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ViabilityPoint | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/library/viability").then((r) => r.json()).then(setViability).catch(() => {});
    fetch("/api/v1/compounds?limit=100").then((r) => r.json()).then((d) => setCompounds(d.items)).catch(() => {});
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

  return (
    <div className="space-y-5">
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
        </div>
      </section>

      {view === "chart" && (
        <div className="space-y-4">
          {/* Compound filter */}
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSelectedCompound(null)}
              className={`rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors ${!selectedCompound ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:text-foreground"}`}>
              All
            </button>
            {compoundNames.map((name) => (
              <button key={name} type="button" onClick={() => setSelectedCompound(selectedCompound === name ? null : name)}
                className={`rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors flex items-center gap-1 ${selectedCompound === name ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:text-foreground"}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedCompound === name ? "white" : colorMap[name] }} />
                {name}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-sm border border-border/60 bg-white p-4">
            <div className="mb-2 flex justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-[0.12em]">Concentration vs Viability</span>
              <span>{chartData.length} points · White ring = 4°C</span>
            </div>
            <svg className="w-full" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ height: "auto", maxHeight: 360 }} onMouseLeave={() => setHoveredPoint(null)}>
              {/* Grid */}
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
              {/* Points */}
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
                <span className="font-mono text-muted-foreground">{hoveredPoint.concentration} mol/kg → {hoveredPoint.value.toFixed(3)} {hoveredPoint.unit}</span>
                <span className="text-muted-foreground">{hoveredPoint.temperature_c}°C · {hoveredPoint.cell_type}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
            <div key={c.id} className="grid grid-cols-[1fr_6rem_5rem_5rem_5rem] gap-4 border-b border-border px-4 py-3 transition-colors hover:bg-muted/35">
              <div>
                <span className="text-sm font-semibold text-hero">{c.name}</span>
                {c.smiles && <span className="ml-2 text-[10px] font-mono text-muted-foreground">{c.smiles}</span>}
              </div>
              <Badge variant={c.role === "penetrating" ? "default" : c.role === "ice_blocker" ? "accent" : "outline"}>{c.role.replace("_", " ")}</Badge>
              <span className="text-right text-[12px] font-mono text-muted-foreground">{c.molecular_weight?.toFixed(1) ?? "—"}</span>
              <span className="text-right text-[12px] font-mono font-semibold text-hero">{c.measurements}</span>
              <span className="text-right text-[12px] font-mono text-muted-foreground">{c.papers}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
