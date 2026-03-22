/**
 * "What's Being Preserved" — Tissue Landscape
 *
 * Horizontal bar chart showing findings per tissue type.
 * Visual narrative: reproductive dominates, organ-scale is the frontier.
 */

import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";

interface TissueRow {
  tissue_type: string;
  findings: number;
  papers: number;
  organisms: number;
}

const ORGAN_FRONTIER = new Set(["kidney", "liver", "heart", "brain", "lung", "articular cartilage", "cornea"]);

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TissueLandscape() {
  const [data, setData] = useState<TissueRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/insights/tissues")
      .then((r) => r.json())
      .then((d: TissueRow[]) => setData(d))
      .catch(() => {});
  }, []);

  if (!data.length) return null;

  const max = data[0].findings;
  const reproductiveCount = data
    .filter((d) => !ORGAN_FRONTIER.has(d.tissue_type))
    .reduce((s, d) => s + d.findings, 0);
  const organCount = data
    .filter((d) => ORGAN_FRONTIER.has(d.tissue_type))
    .reduce((s, d) => s + d.findings, 0);
  const totalFindings = data.reduce((s, d) => s + d.findings, 0);

  return (
    <div className="space-y-4">
      {/* Narrative header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tissue Landscape
          </p>
          <h3 className="mt-1 font-headline text-lg font-bold tracking-tight text-hero">
            What's Being Preserved
          </h3>
          <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
            {Math.round((reproductiveCount / totalFindings) * 100)}% of findings are reproductive tissues.
            Organ-scale preservation ({organCount} findings) is the emerging frontier.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-sm border border-border/60 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tissue Types</p>
            <p className="font-headline text-base font-bold text-hero">{data.length}</p>
          </div>
          <div className="rounded-sm border border-border/60 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
            <p className="font-headline text-base font-bold text-hero">{totalFindings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-sm border border-border/60 bg-white p-4">
        <div className="space-y-1.5">
          {data.slice(0, 15).map((row) => {
            const pct = (row.findings / max) * 100;
            const isOrgan = ORGAN_FRONTIER.has(row.tissue_type);
            return (
              <div key={row.tissue_type} className="group flex items-center gap-3">
                <div className="w-28 shrink-0 text-right">
                  <span className={`text-[12px] font-medium ${isOrgan ? "text-highlight" : "text-hero"}`}>
                    {humanize(row.tissue_type)}
                  </span>
                </div>
                <div className="flex-1 h-6 bg-muted/30 rounded-[2px] relative overflow-hidden">
                  <div
                    className={`h-full rounded-[2px] transition-all duration-500 ${
                      isOrgan
                        ? "bg-gradient-to-r from-highlight/70 to-highlight/50"
                        : "bg-gradient-to-r from-primary/50 to-primary/30"
                    }`}
                    style={{ width: `${Math.max(pct, 1.5)}%` }}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {row.papers} papers · {row.organisms} organisms
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-[11px] text-muted-foreground">
                  {row.findings}
                </span>
                {isOrgan && <Badge variant="highlight" className="text-[8px] px-1.5 py-0">frontier</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
