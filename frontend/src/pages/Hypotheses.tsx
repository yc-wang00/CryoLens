import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";

const HYPOTHESES = [
  {
    id: "HYP-001",
    title: "Cold-Optimized Ternary Cocktail",
    compounds: ["Propionamide", "2,3-Butanediol", "Ethylene Glycol"],
    rationale:
      "Propionamide permeates 2x faster than DMSO with zero toxicity at 3M/4°C. Combined with 2,3-butanediol (Tg-enhancing) and EG (proven glass-former).",
    status: "Novel",
    confidence: "high",
    papers: 4,
  },
  {
    id: "HYP-002",
    title: "Toxicity Neutralization via FA+GLY",
    compounds: ["Formamide", "Glycerol", "Ethylene Glycol"],
    rationale:
      "FA/GLY binary at 12 mol/kg 4°C achieves 97% viability — the strongest toxicity neutralization effect in the database.",
    status: "Data-backed",
    confidence: "high",
    papers: 3,
  },
  {
    id: "HYP-003",
    title: "DHA Membrane Anchor Formulation",
    compounds: ["1,3-Dihydroxyacetone", "DMSO", "Trehalose"],
    rationale:
      "DHA is a natural metabolite with membrane-anchoring properties. At 3M/4°C shows 85% viability. Paired with low-dose DMSO + extracellular trehalose.",
    status: "Novel",
    confidence: "medium",
    papers: 2,
  },
  {
    id: "HYP-004",
    title: "NMA Replacement for M22",
    compounds: ["Propionamide", "Formamide", "DMSO", "EG"],
    rationale:
      "Replace N-methylacetamide in M22 with propionamide — similar amide structure but 2x faster permeation and lower toxicity.",
    status: "Theoretical",
    confidence: "medium",
    papers: 5,
  },
];

const statusVariant: Record<string, "accent" | "success" | "default"> = {
  "Novel": "accent",
  "Data-backed": "success",
  "Theoretical": "default",
};

const confidenceLabel: Record<string, { text: string; color: string }> = {
  high: { text: "High confidence", color: "text-success" },
  medium: { text: "Medium confidence", color: "text-warning" },
  low: { text: "Low confidence", color: "text-error" },
};

export function HypothesesPage() {
  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          title="Hypotheses"
          description="AI-generated hypotheses for novel CPA formulations, grounded in structured experimental data."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {HYPOTHESES.map((hyp) => (
            <article
              key={hyp.id}
              className="bg-surface border border-border rounded-lg p-6 hover:shadow-md hover:border-border-hover transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-headline font-bold text-text-tertiary">
                    {hyp.id}
                  </span>
                  <Badge variant={statusVariant[hyp.status]}>{hyp.status}</Badge>
                </div>
                <span className={`text-[12px] font-medium ${confidenceLabel[hyp.confidence].color}`}>
                  {confidenceLabel[hyp.confidence].text}
                </span>
              </div>

              <h3 className="text-[16px] font-headline font-bold text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors">
                {hyp.title}
              </h3>

              <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
                {hyp.rationale}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {hyp.compounds.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 bg-surface-muted text-text-secondary text-[11px] font-medium rounded-md"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-text-tertiary">
                <Icon name="description" className="!text-[14px]" />
                <span className="text-[12px]">
                  {hyp.papers} supporting papers
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}
