import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";
import { PageHeader } from "../components/ui/PageHeader";

const PAPERS = [
  {
    id: "001",
    title: "High throughput method for simultaneous screening of membrane permeability and toxicity for discovery of new cryoprotective agents",
    journal: "Sci. Rep.",
    journalVariant: "secondary" as const,
    year: 2025,
    authors: "Ahmadkhani N., Benson J.D., et al.",
    confidence: 98,
    findings: 12,
  },
  {
    id: "002",
    title: "Physical vitrification and nanowarming enables organ cryopreservation and life-sustaining kidney transplant",
    journal: "Nat. Commun.",
    journalVariant: "tertiary" as const,
    year: 2023,
    authors: "Sharma A., Rao J.S., Han Z., et al.",
    confidence: 95,
    findings: 15,
  },
  {
    id: "003",
    title: "Functional recovery of the adult murine hippocampus after cryopreservation by vitrification",
    journal: "PNAS",
    journalVariant: "primary" as const,
    year: 2026,
    authors: "German A., et al.",
    confidence: 92,
    findings: 6,
  },
  {
    id: "004",
    title: "Cryoprotectant Toxicity: Facts, Issues, and Questions",
    journal: "Rejuv. Res.",
    journalVariant: "neutral" as const,
    year: 2015,
    authors: "Fahy G.M.",
    confidence: 88,
    findings: 18,
  },
  {
    id: "005",
    title: "Principles and practice of cryopreservation by vitrification",
    journal: "Methods Mol. Bio.",
    journalVariant: "neutral" as const,
    year: 2015,
    authors: "Fahy G.M., Wowk B.",
    confidence: 85,
    findings: 9,
  },
];

export function SourcesPage() {
  return (
    <Layout>
      <div className="p-6">
        <PageHeader
          title="Sources"
          count={379}
          description="Systematic provenance layer. Filter by journal, year, and extraction confidence."
          actions={
            <div className="flex gap-1.5">
              <select className="bg-surface-low border border-outline-variant/20 text-[11px] font-medium py-1.5 px-2.5 rounded-sm text-on-surface cursor-pointer focus:outline-none">
                <option>All Journals</option>
                <option>Nature</option>
                <option>PNAS</option>
                <option>Cryobiology</option>
              </select>
              <select className="bg-surface-low border border-outline-variant/20 text-[11px] font-medium py-1.5 px-2.5 rounded-sm text-on-surface cursor-pointer focus:outline-none">
                <option>2020–2026</option>
                <option>2015–2019</option>
                <option>All Years</option>
              </select>
            </div>
          }
        />

        {/* Header row */}
        <div className="flex items-center px-5 py-2 border-b border-outline-variant/15 text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
          <span className="w-12">#</span>
          <span className="flex-1">Source</span>
          <span className="w-28 text-right">Confidence</span>
          <span className="w-20 text-right">Findings</span>
        </div>

        {/* Rows */}
        {PAPERS.map((p) => (
          <div
            key={p.id}
            className="group flex items-start px-5 py-4 border-b border-outline-variant/8 hover:bg-surface-lowest cursor-pointer transition-colors"
          >
            <span className="w-12 font-mono text-[11px] text-outline-variant pt-0.5">
              {p.id}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={p.journalVariant}>{p.journal}</Badge>
                <span className="font-mono text-[10px] text-outline-variant">
                  {p.year}
                </span>
              </div>
              <h3 className="text-[13px] font-medium text-on-surface leading-snug group-hover:text-primary transition-colors tracking-[-0.01em]">
                {p.title}
              </h3>
              <p className="text-[11px] text-outline-variant mt-1">
                {p.authors}
              </p>
            </div>
            <div className="w-28 flex justify-end pt-1">
              <ConfidenceBar value={p.confidence} />
            </div>
            <span className="w-20 text-right tabular-nums text-[12px] text-on-surface-variant pt-1">
              {p.findings}
            </span>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-0.5 mt-6">
          {["chevron_left", null, null, null, "chevron_right"].map((icon, i) =>
            icon ? (
              <button key={i} className="w-7 h-7 flex items-center justify-center border border-outline-variant/15 hover:bg-surface-low transition-colors rounded-xs">
                <span className="material-symbols-outlined !text-[14px] text-outline-variant">{icon}</span>
              </button>
            ) : (
              <button
                key={i}
                className={`w-7 h-7 flex items-center justify-center border rounded-xs font-mono text-[11px] transition-colors ${
                  i === 1
                    ? "border-outline-variant/30 bg-primary-container/40 text-on-primary-container font-medium"
                    : "border-outline-variant/15 text-outline-variant hover:bg-surface-low"
                }`}
              >
                {i}
              </button>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
