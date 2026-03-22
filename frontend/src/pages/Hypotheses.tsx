import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";

const HYPOTHESES = [
  {
    id: "HYP-042",
    title: "Cold-Optimized PA/BD/EG Ternary Cocktail",
    status: "Novel",
    statusVariant: "terracotta" as const,
    confidence: 87,
    compounds: ["Propionamide", "2,3-Butanediol", "Ethylene Glycol"],
    rationale:
      "Propionamide permeates 2× faster than DMSO with zero toxicity at 3M/4°C. 2,3-Butanediol enhances Tg. EG provides proven glass-forming backbone.",
    mechanism: "Amide-diol synergy at subambient temperature",
    papers: 4,
    temp: "4°C",
    viability: "94%",
  },
  {
    id: "HYP-038",
    title: "FA/GLY Toxicity Neutralization Cocktail",
    status: "Data-Backed",
    statusVariant: "secondary" as const,
    confidence: 92,
    compounds: ["Formamide", "Glycerol", "Ethylene Glycol"],
    rationale:
      "FA/GLY binary at 12 mol/kg 4°C achieves 97% viability — the strongest toxicity neutralization in the database.",
    mechanism: "Preferential exclusion + hydrogen bond saturation",
    papers: 3,
    temp: "4°C",
    viability: "97%",
  },
  {
    id: "HYP-029",
    title: "DHA Membrane Anchor Formulation",
    status: "Novel",
    statusVariant: "terracotta" as const,
    confidence: 72,
    compounds: ["1,3-Dihydroxyacetone", "DMSO", "Trehalose"],
    rationale:
      "DHA is a natural metabolite with membrane-anchoring properties. At 3M/4°C shows 85% viability.",
    mechanism: "Metabolite-membrane interaction + osmotic buffering",
    papers: 2,
    temp: "4°C",
    viability: "85%",
  },
  {
    id: "HYP-015",
    title: "NMA Replacement for M22 Cocktail",
    status: "Theoretical",
    statusVariant: "neutral" as const,
    confidence: 65,
    compounds: ["Propionamide", "Formamide", "DMSO", "EG"],
    rationale:
      "Replace N-methylacetamide in M22 with propionamide — similar amide structure but 2× faster permeation.",
    mechanism: "Structural analog substitution",
    papers: 5,
    temp: "0°C",
    viability: "—",
  },
];

function DetailSidebar() {
  const h = HYPOTHESES[0];
  return (
    <div className="p-4 space-y-5 text-[12px]">
      <div className="px-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-terracotta uppercase tracking-[0.06em]">
            Selected
          </span>
        </div>
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-on-surface leading-tight">
          {h.id}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
            Mechanism
          </span>
          <p className="text-[12px] text-on-surface mt-1">{h.mechanism}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
            Compounds
          </span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {h.compounds.map((c) => (
              <span
                key={c}
                className="px-1.5 py-0.5 bg-surface-high text-on-surface-variant text-[10px] font-mono rounded-xs border border-outline-variant/10"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
              Temp
            </span>
            <p className="font-mono text-[13px] text-on-surface mt-0.5">{h.temp}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
              Viability
            </span>
            <p className="font-mono text-[13px] text-secondary mt-0.5">{h.viability}</p>
          </div>
        </div>
      </div>

      <button className="w-full py-2 border border-outline-variant/20 rounded-sm text-[10px] font-medium uppercase tracking-[0.06em] text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5">
        <Icon name="science" className="!text-[13px]" />
        Generate Protocol
      </button>
    </div>
  );
}

export function HypothesesPage() {
  return (
    <Layout sidebar={<DetailSidebar />}>
      <div className="p-6">
        <PageHeader
          title="Hypotheses"
          count={HYPOTHESES.length}
          description="AI-generated CPA formulation hypotheses grounded in structured experimental data."
        />

        <div className="space-y-px">
          {HYPOTHESES.map((h) => (
            <div
              key={h.id}
              className="group flex items-start gap-5 px-5 py-4 bg-surface-lowest hover:bg-white border-b border-outline-variant/8 cursor-pointer transition-colors"
            >
              {/* Left: ID + bar */}
              <div className="w-16 shrink-0 pt-0.5">
                <span className="font-mono text-[11px] text-outline-variant">
                  {h.id}
                </span>
                <div className="flex items-center gap-1 mt-2">
                  <span className="font-mono text-[10px] font-medium text-secondary">
                    {h.confidence}
                  </span>
                  <div className="w-10 h-[2px] bg-surface-container">
                    <div className="bg-secondary h-full" style={{ width: `${h.confidence}%` }} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={h.statusVariant}>{h.status}</Badge>
                  <span className="text-[10px] text-outline-variant tracking-[0.02em]">
                    {h.papers} papers
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-on-surface tracking-[-0.015em] leading-snug group-hover:text-primary transition-colors">
                  {h.title}
                </h3>
                <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                  {h.rationale}
                </p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {h.compounds.map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 bg-surface-high/60 text-on-surface-variant text-[9px] font-mono rounded-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <span className="material-symbols-outlined text-outline-variant/40 group-hover:text-terracotta !text-[16px] transition-colors shrink-0 mt-1">
                east
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
