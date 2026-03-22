import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";
import { PageHeader } from "../components/ui/PageHeader";

const PAPERS = [
  {
    id: "01",
    title: "High throughput method for simultaneous screening of membrane permeability and toxicity for discovery of new cryoprotective agents",
    journal: "Scientific Reports",
    journalVariant: "secondary" as const,
    year: 2025,
    authors: "Ahmadkhani N., Benson J.D., et al.",
    confidence: 98,
    status: "Extracted",
  },
  {
    id: "02",
    title: "Physical vitrification and nanowarming enables organ cryopreservation and life-sustaining kidney transplant",
    journal: "Nature Communications",
    journalVariant: "tertiary" as const,
    year: 2023,
    authors: "Sharma A., Rao J.S., Han Z., et al.",
    confidence: 95,
    status: "Extracted",
  },
  {
    id: "03",
    title: "Functional recovery of the adult murine hippocampus after cryopreservation by vitrification",
    journal: "PNAS",
    journalVariant: "primary" as const,
    year: 2026,
    authors: "German A., et al.",
    confidence: 92,
    status: "Extracted",
  },
  {
    id: "04",
    title: "Cryoprotectant Toxicity: Facts, Issues, and Questions",
    journal: "Rejuvenation Research",
    journalVariant: "neutral" as const,
    year: 2015,
    authors: "Fahy G.M.",
    confidence: 88,
    status: "Extracted",
  },
  {
    id: "05",
    title: "Principles and practice of cryopreservation by vitrification",
    journal: "Methods in Molecular Biology",
    journalVariant: "neutral" as const,
    year: 2015,
    authors: "Fahy G.M., Wowk B.",
    confidence: 85,
    status: "Processing",
  },
];

export function SourcesPage() {
  return (
    <Layout>
      <div className="p-8">
        <PageHeader
          title="Evidence Source Repository"
          description="Systematic provenance layer for all extracted biomolecular insights. Filter by peer-review impact and confidence score."
          actions={
            <div className="flex gap-3">
              <div className="bg-surface-low px-4 py-2 border-b border-outline-variant flex items-center gap-2">
                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
                  Journal
                </span>
                <select className="bg-transparent border-none text-xs font-semibold focus:ring-0 p-0 text-on-surface cursor-pointer">
                  <option>All Publications</option>
                  <option>Nature</option>
                  <option>PNAS</option>
                  <option>Cryobiology</option>
                </select>
              </div>
              <div className="bg-surface-low px-4 py-2 border-b border-outline-variant flex items-center gap-2">
                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
                  Year
                </span>
                <select className="bg-transparent border-none text-xs font-semibold focus:ring-0 p-0 text-on-surface cursor-pointer">
                  <option>2020—2026</option>
                  <option>2015—2019</option>
                  <option>Archival</option>
                </select>
              </div>
            </div>
          }
        />

        {/* Table Header */}
        <div className="flex items-center px-6 py-2 bg-surface-high rounded-sm mb-2">
          <span className="w-12 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
            ID
          </span>
          <span className="flex-1 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
            Source Document
          </span>
          <span className="w-32 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
            Confidence
          </span>
        </div>

        {/* Paper Rows */}
        <div className="space-y-0">
          {PAPERS.map((paper, i) => (
            <div
              key={paper.id}
              className={`group ${i % 2 === 0 ? "bg-surface-lowest" : "bg-surface-low"} border-b border-outline-variant/10 hover:bg-white transition-all p-6 flex items-start gap-4 cursor-pointer relative`}
            >
              <div className="w-12 pt-1">
                <span className="font-headline font-bold text-outline-variant text-sm">
                  {paper.id}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant={paper.journalVariant}>{paper.journal}</Badge>
                  <span className="text-[10px] font-label text-on-surface-variant tracking-widest uppercase">
                    {paper.year}
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
                  {paper.title}
                </h3>
                <p className="text-xs text-on-surface-variant mt-2 font-body italic">
                  {paper.authors}
                </p>
              </div>
              <ConfidenceBar value={paper.confidence} label={paper.status} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <footer className="flex items-center justify-center gap-1 mt-8">
          <button className="p-2 border border-outline-variant/20 hover:bg-surface-low transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="p-2 border border-outline-variant/20 bg-primary-container text-on-primary-container font-headline font-bold text-xs px-4">
            1
          </button>
          <button className="p-2 border border-outline-variant/20 hover:bg-surface-low transition-colors font-headline font-bold text-xs px-4">
            2
          </button>
          <button className="p-2 border border-outline-variant/20 hover:bg-surface-low transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </footer>
      </div>
    </Layout>
  );
}
