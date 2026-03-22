/**
 * CRYO PROGRESS STORY — NeoLab Redesign
 *
 * Two-section narrative:
 * 1. Growth chart with integrated milestone markers on the axis
 * 2. Landmark formulation cards (benchmarks only)
 */

import { useState } from "react";
import { Badge } from "./ui/badge";
import type { CryoLensStoryStats, FormulationMilestone, StoryYear } from "../data/cryo-lens";

const CHART_W = 920;
const CHART_H = 260;
const PAD = { top: 20, right: 16, bottom: 64, left: 44 };

function pickBenchmarks(milestones: FormulationMilestone[]): FormulationMilestone[] {
  const benchmarkNames = new Set(["dp6", "vs55", "m22", "vm3", "pvs2"]);
  const benchmarks = milestones.filter(
    (m) => benchmarkNames.has(m.id) || (m.type === "benchmark" && m.linkedFindings >= 1),
  );
  if (benchmarks.length > 0) return benchmarks.sort((a, b) => a.year - b.year);
  return milestones
    .filter((m) => m.linkedFindings >= 2)
    .sort((a, b) => b.linkedFindings - a.linkedFindings)
    .slice(0, 6)
    .sort((a, b) => a.year - b.year);
}

function buildTicks(yearly: StoryYear[]): number[] {
  const years = yearly.map((p) => p.year);
  if (years.length <= 10) return years;
  const first = years[0];
  const last = years[years.length - 1];
  const interval = years.length > 24 ? 4 : 3;
  return Array.from(new Set(years.filter((y) => y === first || y === last || (y - first) % interval === 0)));
}

export function CryoProgressStory({ storyStats }: { storyStats: CryoLensStoryStats }) {
  const [hoveredYear, setHoveredYear] = useState<StoryYear | null>(null);

  if (!storyStats.yearly.length) return null;

  const yearly = storyStats.yearly;
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotH;
  const maxF = Math.max(...yearly.map((p) => p.findings), 1);
  const yearCount = Math.max(yearly.length - 1, 1);
  const xStep = plotW / yearCount;
  const barW = Math.max(Math.min(xStep * 0.55, 16), 4);
  const ticks = buildTicks(yearly);
  const benchmarks = pickBenchmarks(storyStats.milestones);
  const peak = yearly.reduce((best, p) => (p.findings > best.findings ? p : best), yearly[0]);
  const cumulative = yearly[yearly.length - 1]?.cumulativeFindings ?? 0;

  function getX(year: number): number {
    return PAD.left + (year - yearly[0].year) * xStep;
  }

  // Cumulative line points
  const maxCum = yearly[yearly.length - 1]?.cumulativeFindings ?? 1;
  const cumPoints = yearly
    .map((p) => `${getX(p.year)},${baseY - (p.cumulativeFindings / maxCum) * plotH * 0.85}`)
    .join(" ");
  const cumArea = `${PAD.left},${baseY} ${cumPoints} ${getX(yearly[yearly.length - 1].year)},${baseY}`;

  return (
    <section className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Knowledge Timeline
          </p>
          <h2 className="mt-1 font-headline text-xl font-bold tracking-tight text-hero">
            {storyStats.firstFormulationYear ?? "1984"} – {storyStats.lastYear ?? "2026"}: The Growth of Cryopreservation Research
          </h2>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Peak Year", value: peak.year },
            { label: "Peak Findings", value: peak.findings },
            { label: "Total Findings", value: cumulative.toLocaleString() },
            { label: "Papers", value: yearly.reduce((s, p) => s + p.papers, 0).toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-sm border border-border/60 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 font-headline text-base font-bold text-hero">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-sm border border-border/60 bg-white p-4">
        {/* Legend */}
        <div className="mb-3 flex items-center gap-5 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-[1px] bg-accent" /> Findings
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-4 bg-highlight/50" style={{ borderTop: "2px dashed" }} /> Cumulative
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-highlight" /> Benchmark
          </span>
        </div>

        <svg
          className="w-full"
          role="img"
          aria-label="Cryopreservation research timeline"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          style={{ height: "auto", maxHeight: 300 }}
          onMouseLeave={() => setHoveredYear(null)}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((r) => {
            const y = baseY - plotH * r;
            return (
              <g key={r}>
                <line x1={PAD.left} x2={CHART_W - PAD.right} y1={y} y2={y} stroke="rgba(0,0,0,0.04)" />
                <text x={PAD.left - 8} y={y + 3} textAnchor="end" fill="rgba(107,118,128,0.7)" fontSize="9" fontFamily="var(--font-mono, monospace)">
                  {Math.round(maxF * r)}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={PAD.left} x2={CHART_W - PAD.right} y1={baseY} y2={baseY} stroke="rgba(0,0,0,0.08)" />

          {/* Cumulative area */}
          <polygon points={cumArea} fill="url(#cumGrad)" opacity="0.35" />
          <polyline points={cumPoints} fill="none" stroke="rgba(196,91,61,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Bars */}
          {yearly.map((p) => {
            const x = getX(p.year);
            const h = (p.findings / maxF) * plotH;
            const isHovered = hoveredYear?.year === p.year;
            return (
              <g key={p.year} onMouseEnter={() => setHoveredYear(p)} style={{ cursor: "default" }}>
                {/* Invisible hit area */}
                <rect x={x - xStep / 2} y={PAD.top} width={xStep} height={plotH} fill="transparent" />
                <rect
                  x={x - barW / 2}
                  y={baseY - h}
                  width={barW}
                  height={Math.max(h, p.findings > 0 ? 1.5 : 0)}
                  rx="1"
                  fill={isHovered ? "rgba(79,96,115,0.85)" : "rgba(79,96,115,0.55)"}
                />
                {/* Paper overlay (thinner, darker) */}
                {p.papers > 0 && (
                  <rect
                    x={x - barW * 0.2}
                    y={baseY - (p.papers / maxF) * plotH}
                    width={barW * 0.4}
                    height={Math.max((p.papers / maxF) * plotH, 1)}
                    rx="0.5"
                    fill={isHovered ? "rgba(26,43,60,0.9)" : "rgba(26,43,60,0.65)"}
                  />
                )}
              </g>
            );
          })}

          {/* Benchmark markers on the axis */}
          {benchmarks.map((m) => {
            const x = getX(m.year);
            return (
              <g key={m.id}>
                <line x1={x} x2={x} y1={baseY} y2={baseY + 8} stroke="rgba(196,91,61,0.6)" strokeWidth="1" />
                <polygon
                  points={`${x},${baseY + 2} ${x - 4},${baseY + 10} ${x + 4},${baseY + 10}`}
                  fill="rgba(196,91,61,0.85)"
                />
                <text
                  x={x}
                  y={baseY + 22}
                  textAnchor="middle"
                  fill="rgba(196,91,61,1)"
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="var(--font-sans)"
                  letterSpacing="0.02em"
                >
                  {m.name}
                </text>
                <text
                  x={x}
                  y={baseY + 32}
                  textAnchor="middle"
                  fill="rgba(107,118,128,0.7)"
                  fontSize="8"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {m.year}
                </text>
              </g>
            );
          })}

          {/* Year tick labels */}
          {ticks.map((year) => {
            const x = getX(year);
            const isBenchmarkYear = benchmarks.some((b) => b.year === year);
            if (isBenchmarkYear) return null;
            return (
              <g key={year}>
                <line x1={x} x2={x} y1={baseY} y2={baseY + 4} stroke="rgba(0,0,0,0.12)" />
                <text x={x} y={baseY + 16} textAnchor="middle" fill="rgba(107,118,128,0.6)" fontSize="9" fontFamily="var(--font-mono, monospace)">
                  {year}
                </text>
              </g>
            );
          })}

          {/* Gradient def */}
          <defs>
            <linearGradient id="cumGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(196,91,61,0.15)" />
              <stop offset="100%" stopColor="rgba(196,91,61,0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hover tooltip */}
        {hoveredYear && (
          <div className="mt-2 flex items-center gap-4 rounded-sm border border-border/50 bg-muted/30 px-4 py-2 text-xs">
            <span className="font-headline font-bold text-hero">{hoveredYear.year}</span>
            <span className="text-muted-foreground">
              {hoveredYear.findings} findings · {hoveredYear.papers} papers · {hoveredYear.experiments} experiments
            </span>
            <span className="text-muted-foreground">
              Cumulative: {hoveredYear.cumulativeFindings.toLocaleString()} findings
            </span>
          </div>
        )}
      </div>

      {/* Top categories + Landmark formulations side by side */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Categories */}
        <div className="rounded-sm border border-border/60 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Finding Categories
          </p>
          <div className="mt-3 space-y-2.5">
            {storyStats.topFindingCategories.slice(0, 7).map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-hero">{cat.label}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {cat.count} · {cat.sharePct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-border/50">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(cat.sharePct * 3, 4)}%`,
                      background: `rgba(79, 96, 115, ${0.25 + cat.sharePct * 0.03})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Landmark formulations */}
        <div className="rounded-sm border border-border/60 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Landmark Formulations
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {benchmarks.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="rounded-sm border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{m.year}</span>
                  <Badge variant={m.type === "benchmark" ? "accent" : "outline"}>
                    {m.type}
                  </Badge>
                </div>
                <h4 className="mt-1.5 font-headline text-sm font-bold text-hero">{m.name}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  {m.note}
                </p>
                {m.components.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.components.slice(0, 3).map((c) => (
                      <span key={c} className="rounded-sm bg-accent/40 px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {m.linkedFindings} linked {m.linkedFindings === 1 ? "finding" : "findings"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
