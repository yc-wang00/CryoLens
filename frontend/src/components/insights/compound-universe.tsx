/**
 * "The Compound Universe" — Coverage Grid
 *
 * Periodic-table-style grid grouped by role.
 * Cell color = data coverage (no data → sparse → good).
 */

import { useEffect, useState } from "react";

interface CompoundRow {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  molecular_weight: number | null;
  smiles: string | null;
  measurements: number;
  papers: number;
  findings: number;
}

const ROLE_ORDER = ["penetrating", "non_penetrating", "ice_blocker", "other"];
const ROLE_LABEL: Record<string, string> = {
  penetrating: "Penetrating CPAs",
  non_penetrating: "Non-Penetrating",
  ice_blocker: "Ice Blockers",
  other: "Other Agents",
};

function coverageColor(measurements: number): string {
  if (measurements === 0) return "bg-muted/40 border-border/40";
  if (measurements < 5) return "bg-amber-50 border-amber-200/60";
  if (measurements < 15) return "bg-sky-50 border-sky-200/60";
  return "bg-emerald-50 border-emerald-200/60";
}

function coverageLabel(measurements: number): string {
  if (measurements === 0) return "No data";
  if (measurements < 5) return "Sparse";
  if (measurements < 15) return "Moderate";
  return "Rich";
}

function coverageDot(measurements: number): string {
  if (measurements === 0) return "bg-border";
  if (measurements < 5) return "bg-amber-400";
  if (measurements < 15) return "bg-sky-400";
  return "bg-emerald-500";
}

export function CompoundUniverse() {
  const [data, setData] = useState<CompoundRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/insights/compounds-coverage")
      .then((r) => r.json())
      .then((d: CompoundRow[]) => setData(d))
      .catch(() => {});
  }, []);

  if (!data.length) return null;

  const grouped: Record<string, CompoundRow[]> = {};
  for (const c of data) {
    const role = ROLE_ORDER.includes(c.role) ? c.role : "other";
    (grouped[role] ??= []).push(c);
  }

  const withData = data.filter((c) => c.measurements > 0).length;
  const noData = data.filter((c) => c.measurements === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Compound Universe
          </p>
          <h3 className="mt-1 font-headline text-lg font-bold tracking-tight text-hero">
            {data.length} Molecules Indexed
          </h3>
          <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
            {withData} compounds have measurement data. {noData} remain unexplored —
            antifreeze proteins, ice blockers, and novel agents awaiting investigation.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-border" /> No data</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Sparse</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Moderate</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Rich</span>
        </div>
      </div>

      {ROLE_ORDER.map((role) => {
        const compounds = grouped[role];
        if (!compounds?.length) return null;
        return (
          <div key={role} className="rounded-sm border border-border/60 bg-white p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {ROLE_LABEL[role]} · {compounds.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compounds.map((c) => (
                <div
                  key={c.id}
                  className={`group relative rounded-sm border px-2.5 py-2 transition-all hover:shadow-sm hover:-translate-y-px cursor-default ${coverageColor(c.measurements)}`}
                  style={{ minWidth: 80 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${coverageDot(c.measurements)}`} />
                    <span className="text-[11px] font-semibold text-hero truncate">
                      {c.abbreviation || c.name.split(" ")[0]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-muted-foreground truncate max-w-[120px]">
                    {c.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                    <span>{c.measurements}m</span>
                    <span>{c.papers}p</span>
                  </div>
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="rounded-sm border border-border bg-white px-3 py-2 shadow-md text-[10px] whitespace-nowrap">
                      <p className="font-semibold text-hero">{c.name}</p>
                      {c.molecular_weight && <p className="text-muted-foreground">MW: {c.molecular_weight.toFixed(1)}</p>}
                      {c.smiles && <p className="font-mono text-muted-foreground">{c.smiles}</p>}
                      <p className="mt-1 text-muted-foreground">{coverageLabel(c.measurements)} · {c.measurements} measurements · {c.papers} papers</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
