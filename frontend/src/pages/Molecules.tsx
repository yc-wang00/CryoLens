import { Layout } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";

const COMPOUNDS = [
  { name: "DMSO", smiles: "CS(C)=O", role: "penetrating", mw: 78.13, measurements: 45, papers: 8, viability: "72%" },
  { name: "Ethylene Glycol", smiles: "OCCO", role: "penetrating", mw: 62.07, measurements: 38, papers: 7, viability: "81%" },
  { name: "Propionamide", smiles: "CCC(N)=O", role: "penetrating", mw: 73.09, measurements: 32, papers: 5, viability: "94%" },
  { name: "Propylene Glycol", smiles: "CC(O)CO", role: "penetrating", mw: 76.09, measurements: 28, papers: 6, viability: "78%" },
  { name: "Formamide", smiles: "NC=O", role: "penetrating", mw: 45.04, measurements: 25, papers: 5, viability: "65%" },
  { name: "Glycerol", smiles: "OCC(O)CO", role: "penetrating", mw: 92.09, measurements: 22, papers: 5, viability: "83%" },
  { name: "2,3-Butanediol", smiles: "CC(O)C(C)O", role: "penetrating", mw: 90.12, measurements: 18, papers: 4, viability: "88%" },
  { name: "Trehalose", smiles: null, role: "non-penetrating", mw: 342.30, measurements: 12, papers: 4, viability: "—" },
];

function FilterSidebar() {
  const groups = [
    { icon: "science", label: "All Compounds", active: true, count: 53 },
    { icon: "speed", label: "Penetrating", count: 38 },
    { icon: "shield", label: "Non-penetrating", count: 11 },
    { icon: "ac_unit", label: "Ice Blockers", count: 4 },
  ];

  return (
    <div className="p-4 space-y-4 text-[12px]">
      <div className="px-1">
        <span className="text-[10px] font-semibold text-terracotta uppercase tracking-[0.06em]">
          Library
        </span>
        <p className="text-[10px] text-outline-variant uppercase tracking-[0.04em] mt-0.5">
          53 Indexed
        </p>
      </div>
      <nav className="space-y-0.5">
        {groups.map((g) => (
          <div
            key={g.label}
            className={`flex items-center justify-between px-2.5 py-2 rounded-sm cursor-pointer transition-colors ${
              g.active
                ? "bg-surface-lowest text-on-surface shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
                : "text-on-surface-variant hover:bg-surface-lowest/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name={g.icon} className="!text-[15px]" />
              <span className="text-[11px] font-medium">{g.label}</span>
            </div>
            <span className="font-mono text-[10px] text-outline-variant">{g.count}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function MoleculesPage() {
  return (
    <Layout sidebar={<FilterSidebar />} sidebarPosition="left" sidebarWidth="w-56">
      <div className="p-6">
        <PageHeader
          title="Compounds"
          count={53}
          description="CPA molecular properties, viability, and measurement coverage."
        />

        {/* Header */}
        <div className="flex items-center px-5 py-2 border-b border-outline-variant/15 text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
          <span className="flex-1">Compound</span>
          <span className="w-24">Role</span>
          <span className="w-20 text-right">MW</span>
          <span className="w-20 text-right">Data</span>
          <span className="w-20 text-right">Viability</span>
        </div>

        {/* Rows */}
        {COMPOUNDS.map((c) => (
          <div
            key={c.name}
            className="group flex items-center px-5 py-3 border-b border-outline-variant/8 hover:bg-surface-lowest cursor-pointer transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-on-surface group-hover:text-primary transition-colors tracking-[-0.01em]">
                {c.name}
              </span>
              {c.smiles && (
                <span className="font-mono text-[10px] text-outline-variant ml-2">
                  {c.smiles}
                </span>
              )}
            </div>
            <span className="w-24">
              <Badge variant={c.role === "penetrating" ? "secondary" : "tertiary"}>
                {c.role === "penetrating" ? "PEN" : "NON-PEN"}
              </Badge>
            </span>
            <span className="w-20 text-right tabular-nums text-[12px] text-on-surface-variant">
              {c.mw}
            </span>
            <span className="w-20 text-right tabular-nums text-[12px] text-on-surface">
              {c.measurements}
            </span>
            <span className="w-20 text-right tabular-nums text-[12px] font-medium text-secondary">
              {c.viability}
            </span>
          </div>
        ))}
      </div>
    </Layout>
  );
}
