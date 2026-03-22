/**
 * "Who Studies What" — Organism × Tissue Heatmap
 *
 * Grid heatmap. Intensity = number of findings.
 * Shows where research concentrates and where gaps exist.
 */

import { useEffect, useState } from "react";

interface HeatmapData {
  organisms: string[];
  tissues: string[];
  cells: Array<{ organism: string; tissue_type: string; findings: number }>;
}

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function cellColor(value: number, max: number): string {
  if (value === 0) return "bg-muted/20";
  const intensity = value / max;
  if (intensity > 0.5) return "bg-primary/70";
  if (intensity > 0.2) return "bg-primary/45";
  if (intensity > 0.08) return "bg-primary/25";
  return "bg-primary/12";
}

export function OrganismHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);

  useEffect(() => {
    fetch("/api/v1/insights/organism-tissue")
      .then((r) => r.json())
      .then((d: HeatmapData) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { organisms, tissues, cells } = data;
  const lookup = new Map(cells.map((c) => [`${c.organism}|${c.tissue_type}`, c.findings]));
  const max = Math.max(...cells.map((c) => c.findings), 1);

  const totalCombinations = organisms.length * tissues.length;
  const filledCells = cells.length;
  const coverage = Math.round((filledCells / totalCombinations) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Research Matrix
          </p>
          <h3 className="mt-1 font-headline text-lg font-bold tracking-tight text-hero">
            Who Studies What
          </h3>
          <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
            {organisms.length} organisms × {tissues.length} tissues. {coverage}% of combinations have data.
            Darker cells indicate more findings.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Light = few findings</span>
          <div className="flex gap-0.5">
            {[0.12, 0.25, 0.45, 0.7].map((opacity) => (
              <span key={opacity} className="h-3 w-5 rounded-[1px]" style={{ background: `rgba(79, 96, 115, ${opacity})` }} />
            ))}
          </div>
          <span>Dark = many</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border/60 bg-white p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-2" />
              {tissues.map((t) => (
                <th key={t} className="px-1 py-2 text-center">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", height: 72 }}>
                    {humanize(t)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organisms.map((org) => (
              <tr key={org} className="group">
                <td className="sticky left-0 z-10 bg-white pr-3 py-0.5 text-right">
                  <span className="text-[11px] font-medium text-hero whitespace-nowrap">
                    {humanize(org)}
                  </span>
                </td>
                {tissues.map((tissue) => {
                  const value = lookup.get(`${org}|${tissue}`) ?? 0;
                  return (
                    <td key={tissue} className="px-0.5 py-0.5">
                      <div
                        className={`relative h-7 w-full min-w-[2.5rem] rounded-[2px] transition-all ${cellColor(value, max)} ${value > 0 ? "cursor-default" : ""}`}
                        title={value > 0 ? `${humanize(org)} × ${humanize(tissue)}: ${value} findings` : ""}
                      >
                        {value > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-medium text-white/90">
                            {value}
                          </span>
                        )}
                      </div>
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
}
