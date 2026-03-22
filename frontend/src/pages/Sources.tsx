import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";
import { PageHeader } from "../components/ui/PageHeader";

const PAPERS = [
  {
    title: "High throughput method for simultaneous screening of membrane permeability and toxicity",
    journal: "Scientific Reports",
    year: 2025,
    authors: "Ahmadkhani N., Benson J.D., et al.",
    confidence: 98,
    findings: 12,
  },
  {
    title: "Physical vitrification and nanowarming at liter-scale CPA volumes",
    journal: "Nature Communications",
    year: 2025,
    authors: "Gangwar L., Sharma A., et al.",
    confidence: 95,
    findings: 8,
  },
  {
    title: "Vitrification and nanowarming enable long-term organ cryopreservation and life-sustaining kidney transplantation",
    journal: "Nature Communications",
    year: 2023,
    authors: "Sharma A., Rao J.S., et al.",
    confidence: 92,
    findings: 15,
  },
  {
    title: "Functional recovery of the adult murine hippocampus after cryopreservation by vitrification",
    journal: "PNAS",
    year: 2026,
    authors: "German A., et al.",
    confidence: 88,
    findings: 6,
  },
  {
    title: "Cryoprotectant Toxicity: Facts, Issues, and Questions",
    journal: "Rejuvenation Research",
    year: 2015,
    authors: "Fahy G.M.",
    confidence: 85,
    findings: 18,
  },
];

const journalVariant: Record<string, "accent" | "success" | "default"> = {
  "Nature Communications": "success",
  "PNAS": "accent",
};

export function SourcesPage() {
  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          title="Sources"
          description="Papers indexed in the CryoLens knowledge base with extraction confidence scores."
          actions={
            <span className="text-[13px] text-text-tertiary tabular-nums">
              379 papers in corpus
            </span>
          }
        />

        <div className="space-y-1">
          {PAPERS.map((paper) => (
            <article
              key={paper.title}
              className="flex items-start gap-5 px-5 py-5 border-b border-border hover:bg-surface-muted transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Badge variant={journalVariant[paper.journal] ?? "default"}>
                    {paper.journal}
                  </Badge>
                  <span className="text-[12px] text-text-tertiary">
                    {paper.year}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors mb-1">
                  {paper.title}
                </h3>
                <p className="text-[12px] text-text-tertiary">
                  {paper.authors}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                <ConfidenceBar value={paper.confidence} />
                <span className="text-[11px] text-text-tertiary">
                  {paper.findings} findings
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}
