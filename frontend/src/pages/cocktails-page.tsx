import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

interface Component {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  concentration: number | null;
  concentration_unit: string | null;
  role_in_formulation: string | null;
}

interface Property {
  property: string;
  value: number;
  unit: string;
}

interface Formulation {
  id: string;
  name: string;
  full_name: string | null;
  total_concentration: number | null;
  concentration_unit: string | null;
  carrier_solution: string | null;
  year_introduced: number | null;
  developed_by: string | null;
  description: string | null;
  component_count: number;
  finding_count: number;
  components: Component[];
  properties: Property[];
}

interface Protocol {
  id: number;
  name: string;
  description: string | null;
  cell_type: string | null;
  organism: string | null;
  viability_assay: string | null;
  carrier_solution: string | null;
  paper_doi: string;
  steps: Array<{
    step_order: number;
    action: string;
    cpa_concentration: number | null;
    concentration_unit: string | null;
    temperature_c: number | null;
    duration_min: number | null;
    volume_ul: number | null;
    method: string | null;
    description: string | null;
  }>;
}

type ViewMode = "cocktails" | "protocols";

const ROLE_COLORS: Record<string, string> = {
  penetrating: "#4f6073",
  non_penetrating: "#49655b",
  ice_blocker: "#6b5b8a",
  carrier: "#3b6d8f",
  other: "#999",
};

export function CocktailsPage() {
  const [view, setView] = useState<ViewMode>("cocktails");
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/library/cocktails").then((r) => r.json()).then(setFormulations).catch(() => {});
    fetch("/api/v1/library/protocols").then((r) => r.json()).then(setProtocols).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="console-title">Formulations & Protocols</h1>
          <p className="mt-1 console-subtitle">
            {formulations.length} multi-component cocktails · {protocols.length} step-by-step protocols
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={view === "cocktails" ? "default" : "outline"} onClick={() => setView("cocktails")}>Cocktails</Button>
          <Button size="sm" variant={view === "protocols" ? "default" : "outline"} onClick={() => setView("protocols")}>Protocols</Button>
        </div>
      </section>

      {view === "cocktails" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {formulations.map((f) => {
            const maxConc = Math.max(...f.components.map((c) => c.concentration ?? 0), 0.01);
            return (
              <div key={f.id} className="rounded-sm border border-border/60 bg-white p-4 space-y-3 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {f.year_introduced && <Badge variant="outline">{f.year_introduced}</Badge>}
                      <Badge>{f.component_count} components</Badge>
                      {f.finding_count > 0 && <Badge variant="accent">{f.finding_count} findings</Badge>}
                    </div>
                    <h3 className="font-headline text-sm font-bold text-hero">{f.name}</h3>
                    {f.description && (
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{f.description}</p>
                    )}
                  </div>
                  {f.total_concentration && (
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-lg font-bold text-hero">{f.total_concentration}</p>
                      <p className="text-[9px] text-muted-foreground">{f.concentration_unit}</p>
                    </div>
                  )}
                </div>

                {/* Component bar visualization */}
                <div className="space-y-1">
                  {f.components.map((c) => {
                    const pct = c.concentration ? (c.concentration / maxConc) * 100 : 20;
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-[10px] font-medium text-hero truncate">{c.abbreviation || c.name}</span>
                        <div className="flex-1 h-4 bg-muted/30 rounded-[1px] overflow-hidden">
                          <div
                            className="h-full rounded-[1px] flex items-center px-1.5"
                            style={{ width: `${Math.max(pct, 8)}%`, background: ROLE_COLORS[c.role] ?? ROLE_COLORS.other, opacity: 0.6 }}
                          >
                            {c.concentration && (
                              <span className="text-[8px] font-mono text-white font-semibold">{c.concentration}{c.concentration_unit ? ` ${c.concentration_unit}` : ""}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground w-16 shrink-0">{c.role_in_formulation || c.role}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Properties */}
                {f.properties.length > 0 && (
                  <div className="flex gap-3 pt-1 border-t border-border/40">
                    {f.properties.map((p) => (
                      <div key={p.property} className="text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{p.property}</p>
                        <p className="font-mono text-[11px] font-semibold text-hero">{p.value} {p.unit}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "protocols" && (
        <div className="space-y-4">
          {protocols.map((protocol) => {
            const isExpanded = expandedProtocol === protocol.id;
            return (
              <div key={protocol.id} className="rounded-sm border border-border/60 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                  className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>{protocol.cell_type}</Badge>
                      <Badge variant="outline">{protocol.organism}</Badge>
                      <Badge variant="accent">{protocol.steps.length} steps</Badge>
                    </div>
                    <h3 className="font-headline text-sm font-bold text-hero">{protocol.name}</h3>
                    {protocol.description && (
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{protocol.description}</p>
                    )}
                  </div>
                  <span className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="relative ml-4 border-l-2 border-border/40 pl-6 space-y-0">
                      {protocol.steps.map((step, i) => (
                        <div key={step.step_order} className="relative pb-5 last:pb-0">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                            <span className="text-[7px] font-mono font-bold text-primary">{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-hero">{step.action}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
                              {step.temperature_c != null && <span className="rounded-sm bg-muted/50 px-1.5 py-0.5">{step.temperature_c}°C</span>}
                              {step.duration_min != null && <span className="rounded-sm bg-muted/50 px-1.5 py-0.5">{step.duration_min} min</span>}
                              {step.cpa_concentration != null && <span className="rounded-sm bg-muted/50 px-1.5 py-0.5">{step.cpa_concentration} {step.concentration_unit}</span>}
                              {step.volume_ul != null && <span className="rounded-sm bg-muted/50 px-1.5 py-0.5">{step.volume_ul} µL</span>}
                              {step.method && <span className="rounded-sm bg-muted/50 px-1.5 py-0.5">{step.method}</span>}
                            </div>
                            {step.description && (
                              <p className="mt-1 text-[11px] text-muted-foreground">{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] font-mono text-muted-foreground">{protocol.paper_doi}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
