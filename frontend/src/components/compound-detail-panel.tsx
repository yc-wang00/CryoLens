import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Badge } from "./ui/badge";
import { ProgressBar } from "./ui/progress-bar";

interface ViabilityPoint {
  concentration: number | null;
  temperature_c: number | null;
  value: number;
  unit: string;
  cell_type: string | null;
  organism: string | null;
  paper_doi: string;
}

interface FormulationLink {
  id: string;
  name: string;
  total_concentration: number | null;
  concentration_unit: string | null;
  comp_concentration: number | null;
  comp_unit: string | null;
  role_in_formulation: string | null;
  finding_count: number;
}

interface Finding {
  id: number;
  category: string;
  claim: string;
  confidence: string;
  tissue_type: string | null;
  organism: string | null;
  paper_doi: string;
  paper_title: string;
  paper_year: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface CompoundProfile {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  description: string | null;
  molecular_weight: number | null;
  smiles: string | null;
  synonyms: string[];
  viability: ViabilityPoint[];
  formulations: FormulationLink[];
  findings: Finding[];
  finding_categories: CategoryCount[];
  available_metrics: string[];
  missing_metrics: string[];
  tissues_tested: string[];
}

interface Props {
  compoundId: string | null;
  onClose: () => void;
}

const CHART_W = 480;
const CHART_H = 200;
const PAD = { top: 12, right: 16, bottom: 32, left: 40 };

const METRIC_LABELS: Record<string, string> = {
  viability: "Viability",
  permeability_cpa: "CPA Permeability",
  permeability_water: "Water Permeability",
  tg: "Glass Transition (Tg)",
  ccr: "Critical Cooling Rate",
};

function humanize(s: string): string {
  return s.replace(/_/g, " ");
}

export function CompoundDetailPanel({ compoundId, onClose }: Props) {
  const [profile, setProfile] = useState<CompoundProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!compoundId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/compounds/${compoundId}/profile`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [compoundId]);

  useEffect(() => {
    if (!compoundId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [compoundId, onClose]);

  if (!compoundId) return null;

  const chartData = (profile?.viability ?? []).filter(
    (p) => p.concentration != null && p.value != null,
  );
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const maxConc = Math.max(...chartData.map((p) => p.concentration ?? 0), 1);
  const maxVal = Math.max(...chartData.map((p) => p.value), 0.01);

  function getX(conc: number) { return PAD.left + (conc / maxConc) * plotW; }
  function getY(val: number) { return PAD.top + plotH - (val / maxVal) * plotH; }

  const totalFindings = profile?.finding_categories.reduce((s, c) => s + c.count, 0) ?? 0;
  const maxCatCount = Math.max(...(profile?.finding_categories.map((c) => c.count) ?? [1]));

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#f8f9fa]/78 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-border/60 bg-white shadow-[-12px_0_40px_rgba(33,40,44,0.08)]">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border/60 bg-white/95 backdrop-blur-sm px-6 py-5">
          <button
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-white text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>

          {loading || !profile ? (
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-sm bg-muted animate-pulse" />
              <div className="h-6 w-48 rounded-sm bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{humanize(profile.role)}</Badge>
                {profile.abbreviation && <Badge variant="outline">{profile.abbreviation}</Badge>}
                {profile.molecular_weight && (
                  <Badge variant="data">{profile.molecular_weight.toFixed(1)} g/mol</Badge>
                )}
              </div>
              <h2 className="mt-2 font-headline text-xl font-bold tracking-tight text-hero">
                {profile.name}
              </h2>
              {profile.description && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
                  {profile.description}
                </p>
              )}
              {profile.synonyms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.synonyms.map((s) => (
                    <Badge key={s} variant="muted">{s}</Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {profile && !loading && (
          <div className="divide-y divide-border/40">
            {/* Viability chart */}
            <section className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Viability Profile
              </p>
              {chartData.length > 0 ? (
                <div className="mt-3 rounded-sm border border-border/50 bg-white p-3">
                  <svg className="w-full" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ height: "auto", maxHeight: 220 }}>
                    {[0.25, 0.5, 0.75, 1].map((r) => (
                      <g key={r}>
                        <line x1={PAD.left} x2={CHART_W - PAD.right} y1={getY(maxVal * r)} y2={getY(maxVal * r)} stroke="rgba(0,0,0,0.04)" />
                        <text x={PAD.left - 6} y={getY(maxVal * r) + 3} textAnchor="end" fill="rgba(107,118,128,0.6)" fontSize="8" fontFamily="var(--font-mono)">
                          {(maxVal * r).toFixed(maxVal <= 2 ? 2 : 0)}
                        </text>
                      </g>
                    ))}
                    {maxVal <= 2 && (
                      <line x1={PAD.left} x2={CHART_W - PAD.right} y1={getY(1)} y2={getY(1)} stroke="rgba(196,91,61,0.25)" strokeDasharray="4 3" />
                    )}
                    <text x={CHART_W / 2} y={CHART_H - 4} textAnchor="middle" fill="rgba(107,118,128,0.5)" fontSize="8">
                      Concentration (mol/kg)
                    </text>
                    {chartData.map((p, i) => {
                      const isCold = (p.temperature_c ?? 25) <= 10;
                      return (
                        <circle
                          key={i}
                          cx={getX(p.concentration ?? 0)}
                          cy={getY(p.value)}
                          r={4}
                          fill="#4f6073"
                          fillOpacity={0.65}
                          stroke={isCold ? "white" : "transparent"}
                          strokeWidth={isCold ? 1.5 : 0}
                        />
                      );
                    })}
                  </svg>
                  <p className="mt-1 text-[9px] text-muted-foreground text-right">
                    {chartData.length} data points · white ring = 4°C
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-sm border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
                  <p className="text-[11px] font-semibold text-muted-foreground">No viability data</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">This is a gap — viability screening has not been performed for this compound.</p>
                </div>
              )}
            </section>

            {/* Data coverage */}
            <section className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Data Coverage
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["viability", "permeability_cpa", "permeability_water", "tg", "ccr"].map((metric) => {
                  const has = profile.available_metrics.includes(metric);
                  return (
                    <div key={metric} className={`rounded-sm border px-3 py-2 ${has ? "border-emerald-200/60 bg-emerald-50" : "border-border/40 bg-muted/30"}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${has ? "bg-emerald-500" : "bg-border"}`} />
                        <span className="text-[10px] font-semibold text-hero">{METRIC_LABELS[metric] ?? metric}</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">{has ? "Data available" : "No data — gap"}</p>
                    </div>
                  );
                })}
                <div className="rounded-sm border border-border/40 bg-muted/30 px-3 py-2">
                  <span className="text-[10px] font-semibold text-hero">Tissues</span>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {profile.tissues_tested.length > 0
                      ? profile.tissues_tested.slice(0, 4).join(", ") + (profile.tissues_tested.length > 4 ? ` +${profile.tissues_tested.length - 4}` : "")
                      : "No tissue-specific data"}
                  </p>
                </div>
              </div>
            </section>

            {/* Finding categories */}
            {profile.finding_categories.length > 0 && (
              <section className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {totalFindings} Findings by Category
                </p>
                <div className="mt-3 space-y-1.5">
                  {profile.finding_categories.slice(0, 8).map((cat) => (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-[10px] font-medium text-hero truncate">
                        {humanize(cat.category)}
                      </span>
                      <div className="flex-1">
                        <ProgressBar value={(cat.count / maxCatCount) * 100} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[10px] font-mono text-muted-foreground">
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Formulations */}
            {profile.formulations.length > 0 && (
              <section className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  In {profile.formulations.length} Formulations
                </p>
                <div className="mt-3 space-y-1">
                  {profile.formulations.slice(0, 12).map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 rounded-sm border border-border/40 bg-white px-3 py-2 hover:bg-muted/20 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-hero truncate">{f.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {f.comp_concentration != null ? `${f.comp_concentration} ${f.comp_unit ?? ""}` : ""}
                          {f.role_in_formulation ? ` · ${humanize(f.role_in_formulation)}` : ""}
                        </p>
                      </div>
                      {f.finding_count > 0 && (
                        <Badge variant="data">{f.finding_count}f</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent findings */}
            {profile.findings.length > 0 && (
              <section className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Recent Findings
                </p>
                <div className="mt-3 space-y-2">
                  {profile.findings.slice(0, 8).map((f) => (
                    <div key={f.id} className="rounded-sm border border-border/40 bg-white px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge variant={f.confidence === "high" ? "default" : "outline"}>{f.confidence}</Badge>
                        <Badge variant="muted">{humanize(f.category)}</Badge>
                        <span className="text-[9px] text-muted-foreground">{f.paper_year}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground line-clamp-2">
                        {f.claim}
                      </p>
                      {f.tissue_type && (
                        <p className="mt-1 text-[9px] text-muted-foreground">{f.tissue_type} · {f.organism}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gaps summary */}
            {profile.missing_metrics.length > 0 && (
              <section className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Research Gaps
                </p>
                <div className="mt-3 rounded-sm border border-dashed border-amber-300/60 bg-amber-50/50 px-4 py-3">
                  <p className="text-[11px] font-semibold text-hero">
                    Missing data for {profile.name}:
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {profile.missing_metrics.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-amber-400" />
                        {METRIC_LABELS[m] ?? m} — no measurements recorded
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
