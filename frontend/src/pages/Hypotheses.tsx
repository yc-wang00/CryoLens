import { Layout } from "../components/layout/Layout";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";

const HYPOTHESES = [
  {
    id: "HYP-0422",
    title: "Cold-Optimized PA/BD/EG Ternary Cocktail",
    status: "Novel",
    statusColor: "bg-terracotta/10 text-terracotta",
    confidence: 87,
    compounds: ["Propionamide", "2,3-Butanediol", "Ethylene Glycol"],
    rationale:
      "Propionamide permeates 2× faster than DMSO with zero toxicity at 3M/4°C. 2,3-Butanediol enhances Tg. EG provides proven glass-forming backbone.",
    mechanism: "Amide-diol synergy at subambient temperature",
    papers: 4,
    temperature: "4°C",
    viability: "94%",
  },
  {
    id: "HYP-0388",
    title: "FA/GLY Toxicity Neutralization Cocktail",
    status: "Data-Backed",
    statusColor: "bg-secondary-container text-on-secondary-container",
    confidence: 92,
    compounds: ["Formamide", "Glycerol", "Ethylene Glycol"],
    rationale:
      "FA/GLY binary at 12 mol/kg 4°C achieves 97% viability — the strongest toxicity neutralization in the database. Adding EG for glass-forming stability.",
    mechanism: "Preferential exclusion + hydrogen bond saturation",
    papers: 3,
    temperature: "4°C",
    viability: "97%",
  },
  {
    id: "HYP-0291",
    title: "DHA Membrane Anchor Formulation",
    status: "Novel",
    statusColor: "bg-terracotta/10 text-terracotta",
    confidence: 72,
    compounds: ["1,3-Dihydroxyacetone", "DMSO", "Trehalose"],
    rationale:
      "DHA is a natural metabolite with membrane-anchoring properties. At 3M/4°C shows 85% viability. Low-dose DMSO + extracellular trehalose for stabilization.",
    mechanism: "Metabolite-membrane interaction + osmotic buffering",
    papers: 2,
    temperature: "4°C",
    viability: "85%",
  },
  {
    id: "HYP-0156",
    title: "NMA Replacement for M22 Cocktail",
    status: "Theoretical",
    statusColor: "bg-surface-highest text-on-surface-variant",
    confidence: 65,
    compounds: ["Propionamide", "Formamide", "DMSO", "Ethylene Glycol"],
    rationale:
      "Replace N-methylacetamide in M22 with propionamide — similar amide structure but 2× faster permeation and lower toxicity profile.",
    mechanism: "Structural analog substitution with improved kinetics",
    papers: 5,
    temperature: "0°C",
    viability: "—",
  },
];

function HypothesisDetailSidebar() {
  const hyp = HYPOTHESES[0];
  return (
    <div className="flex flex-col p-6 space-y-6">
      <header>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-terracotta uppercase tracking-[0.1em]">
            Selected Hypothesis
          </span>
          <button className="material-symbols-outlined text-on-surface-variant text-sm">
            close
          </button>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-on-surface leading-tight">
          {hyp.id}
        </h2>
      </header>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Mechanism
          </span>
          <p className="text-sm text-on-surface font-medium mt-1">
            {hyp.mechanism}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Compounds
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hyp.compounds.map((c) => (
              <span
                key={c}
                className="px-2 py-1 bg-surface-highest text-on-surface-variant text-[9px] font-label font-bold uppercase border border-outline-variant/10"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Temperature
            </span>
            <p className="text-sm font-bold text-on-surface mt-1">{hyp.temperature}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Viability
            </span>
            <p className="text-sm font-bold text-secondary mt-1">{hyp.viability}</p>
          </div>
        </div>
      </div>

      <button className="w-full text-on-surface py-3 rounded-sm font-label text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-low transition-colors border border-outline-variant/20">
        <Icon name="science" className="text-sm" />
        Generate Protocol
      </button>
    </div>
  );
}

export function HypothesesPage() {
  return (
    <Layout sidebar={<HypothesisDetailSidebar />}>
      <div className="p-8">
        <PageHeader
          title="CPA Hypotheses"
          description="AI-generated hypotheses for novel cryoprotective agent formulations, grounded in structured experimental data from the CryoLens database."
        />

        <div className="space-y-4">
          {HYPOTHESES.map((hyp) => (
            <div
              key={hyp.id}
              className="group bg-surface-lowest border-b border-outline-variant/10 hover:bg-white transition-all p-6 flex items-start gap-6 cursor-pointer"
            >
              {/* ID + Confidence */}
              <div className="w-20 pt-1 shrink-0">
                <span className="font-headline font-bold text-outline-variant text-sm block">
                  {hyp.id}
                </span>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-headline font-bold text-secondary">
                    {hyp.confidence}%
                  </span>
                  <div className="w-12 h-1 bg-surface-container">
                    <div
                      className="bg-secondary h-full"
                      style={{ width: `${hyp.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter ${hyp.statusColor}`}>
                    {hyp.status}
                  </span>
                  <span className="text-[10px] font-label text-on-surface-variant tracking-widest uppercase">
                    {hyp.papers} papers
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-on-surface leading-snug group-hover:text-primary transition-colors mb-2">
                  {hyp.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                  {hyp.rationale}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hyp.compounds.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 bg-surface-highest text-on-surface-variant text-[9px] font-label font-bold uppercase border border-outline-variant/10"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <span className="material-symbols-outlined text-outline-variant group-hover:text-terracotta transition-colors shrink-0 pt-2">
                arrow_forward
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
