import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";

const COMPOUNDS = [
  { name: "DMSO", abbr: "DMSO", role: "penetrating", mw: 78.13, measurements: 45, papers: 8 },
  { name: "Ethylene Glycol", abbr: "EG", role: "penetrating", mw: 62.07, measurements: 38, papers: 7 },
  { name: "Propionamide", abbr: "PA", role: "penetrating", mw: 73.09, measurements: 32, papers: 5 },
  { name: "Propylene Glycol", abbr: "PG", role: "penetrating", mw: 76.09, measurements: 28, papers: 6 },
  { name: "Formamide", abbr: "FA", role: "penetrating", mw: 45.04, measurements: 25, papers: 5 },
  { name: "Glycerol", abbr: "GLY", role: "penetrating", mw: 92.09, measurements: 22, papers: 5 },
  { name: "Trehalose", abbr: "TRE", role: "non-penetrating", mw: 342.3, measurements: 12, papers: 4 },
  { name: "Sucrose", abbr: "SUC", role: "non-penetrating", mw: 342.3, measurements: 8, papers: 3 },
];

const columns = [
  { key: "name", label: "Compound", width: "flex-1" },
  { key: "role", label: "Role", width: "w-32" },
  { key: "mw", label: "MW (g/mol)", width: "w-28" },
  { key: "measurements", label: "Measurements", width: "w-28" },
  { key: "papers", label: "Papers", width: "w-20" },
];

export function MoleculesPage() {
  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          title="Compounds"
          description="Cryoprotective agents indexed in the CryoLens database with measurement coverage."
        />

        {/* Header */}
        <div className="flex items-center px-5 py-2.5 border-b border-border mb-1">
          {columns.map((col) => (
            <span
              key={col.key}
              className={`${col.width} text-[11px] font-semibold text-text-tertiary uppercase tracking-wider`}
            >
              {col.label}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div>
          {COMPOUNDS.map((c) => (
            <div
              key={c.name}
              className="flex items-center px-5 py-3.5 border-b border-border hover:bg-surface-muted transition-colors cursor-pointer group"
            >
              <div className="flex-1">
                <span className="text-[14px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {c.name}
                </span>
                <span className="text-[12px] text-text-tertiary ml-2">
                  {c.abbr}
                </span>
              </div>
              <div className="w-32">
                <Badge variant={c.role === "penetrating" ? "accent" : "default"}>
                  {c.role}
                </Badge>
              </div>
              <span className="w-28 text-[13px] text-text-secondary tabular-nums">
                {c.mw}
              </span>
              <span className="w-28 text-[13px] font-semibold text-text-primary tabular-nums">
                {c.measurements}
              </span>
              <span className="w-20 text-[13px] text-text-secondary tabular-nums">
                {c.papers}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
