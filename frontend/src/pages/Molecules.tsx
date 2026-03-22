import { Layout } from "../components/layout/Layout";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";

const COMPOUNDS = [
  { name: "DMSO", role: "Penetrating", mw: 78.13, smiles: "CS(C)=O", measurements: 45, papers: 8, viability: "72%" },
  { name: "Ethylene Glycol", role: "Penetrating", mw: 62.07, smiles: "OCCO", measurements: 38, papers: 7, viability: "81%" },
  { name: "Propionamide", role: "Penetrating", mw: 73.09, smiles: "CCC(N)=O", measurements: 32, papers: 5, viability: "94%" },
  { name: "Propylene Glycol", role: "Penetrating", mw: 76.09, smiles: "CC(O)CO", measurements: 28, papers: 6, viability: "78%" },
  { name: "Formamide", role: "Penetrating", mw: 45.04, smiles: "NC=O", measurements: 25, papers: 5, viability: "65%" },
  { name: "Glycerol", role: "Penetrating", mw: 92.09, smiles: "OCC(O)CO", measurements: 22, papers: 5, viability: "83%" },
  { name: "2,3-Butanediol", role: "Penetrating", mw: 90.12, smiles: "CC(O)C(C)O", measurements: 18, papers: 4, viability: "88%" },
  { name: "Trehalose", role: "Non-penetrating", mw: 342.30, smiles: null, measurements: 12, papers: 4, viability: "—" },
];

function SidebarNav() {
  const sections = [
    { icon: "science", label: "All Compounds", active: true },
    { icon: "speed", label: "Penetrating" },
    { icon: "shield", label: "Non-penetrating" },
    { icon: "ac_unit", label: "Ice Blockers" },
    { icon: "water_drop", label: "Carriers" },
  ];

  return (
    <div className="p-4 space-y-2">
      <div className="mb-6 px-2">
        <span className="text-sm font-bold text-terracotta font-body uppercase tracking-wider">
          Compound Library
        </span>
        <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mt-1">
          53 Indexed Molecules
        </p>
      </div>
      <nav className="space-y-1">
        {sections.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 px-3 py-2 rounded-sm cursor-pointer transition-colors ${
              s.active
                ? "bg-white text-terracotta shadow-sm"
                : "text-slate-500 hover:bg-slate-200/50"
            }`}
          >
            <Icon name={s.icon} className="text-lg" />
            <span className="font-label text-xs font-semibold uppercase tracking-widest">
              {s.label}
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function MoleculesPage() {
  return (
    <Layout sidebar={<SidebarNav />} sidebarPosition="left" sidebarWidth="w-64">
      <div className="p-8">
        <PageHeader
          title="Compound Library"
          description="All cryoprotective agents indexed in the CryoLens database with permeability, viability, and molecular properties."
        />

        {/* Table Header */}
        <div className="flex items-center px-6 py-2 bg-surface-high rounded-sm mb-2">
          {["Compound", "Role", "MW", "Measurements", "Viability"].map((h) => (
            <span
              key={h}
              className={`text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest ${
                h === "Compound" ? "flex-1" : "w-28"
              }`}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div>
          {COMPOUNDS.map((c, i) => (
            <div
              key={c.name}
              className={`group flex items-center px-6 py-4 ${i % 2 === 0 ? "bg-surface-lowest" : "bg-surface-low"} border-b border-outline-variant/10 hover:bg-white transition-all cursor-pointer`}
            >
              <div className="flex-1">
                <h3 className="text-sm font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                  {c.name}
                </h3>
                {c.smiles && (
                  <p className="text-[10px] text-outline-variant font-mono mt-0.5">
                    {c.smiles}
                  </p>
                )}
              </div>
              <span className="w-28">
                <span
                  className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter ${
                    c.role === "Penetrating"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-tertiary-container text-on-tertiary-container"
                  }`}
                >
                  {c.role}
                </span>
              </span>
              <span className="w-28 text-xs text-on-surface-variant tabular-nums">
                {c.mw} g/mol
              </span>
              <span className="w-28 text-xs font-headline font-bold text-on-surface tabular-nums">
                {c.measurements}
              </span>
              <span className="w-28 text-xs font-headline font-bold text-secondary tabular-nums">
                {c.viability}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
