import { useState } from "react";

import type { Molecule } from "../types";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ProgressBar } from "../components/ui/progress-bar";

interface MoleculesPageProps {
  molecules: Molecule[];
  onOpenMolecule: (molecule: Molecule) => void;
}

export function MoleculesPage({
  molecules,
  onOpenMolecule,
}: MoleculesPageProps) {
  const [query, setQuery] = useState<string>("");

  const visibleMolecules = molecules.filter((molecule) => {
    const haystack = `${molecule.name} ${molecule.aliases.join(" ")} ${molecule.className}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <section>
        <h1 className="console-title">Library</h1>
        <p className="mt-1 console-subtitle">
          Candidate CPA registry with role hints, evidence density, and discovery priority.
        </p>
      </section>

      <Card className="glass-panel">
        <CardContent className="p-4">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by molecule name, alias, or class..."
            value={query}
          />
        </CardContent>
      </Card>

      <div className="rounded-sm border border-border/70 bg-white">
        <div className="grid grid-cols-[1.2fr_0.55fr_0.45fr_0.8fr] gap-4 border-b border-border bg-muted/80 px-4 py-3">
          <div className="table-header">Candidate</div>
          <div className="table-header">Evidence density</div>
          <div className="table-header">Sources</div>
          <div className="table-header">Key signal</div>
        </div>
        {visibleMolecules.map((molecule) => (
          <button
            key={molecule.id}
            className="grid w-full grid-cols-[1.2fr_0.55fr_0.45fr_0.8fr] gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/35"
            onClick={() => onOpenMolecule(molecule)}
            type="button"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{molecule.className}</Badge>
                <Badge variant="outline">{molecule.roleHint}</Badge>
              </div>
              <h3 className="mt-3 font-headline text-lg font-extrabold tracking-tight text-hero">
                {molecule.name}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {molecule.notes}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {molecule.aliases.map((alias) => (
                  <Badge key={`${molecule.id}-${alias}`} variant="muted">
                    {alias}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="font-headline text-2xl font-extrabold text-hero">{molecule.evidenceCount}</p>
              <ProgressBar className="mt-2" value={molecule.evidenceCount * 12} />
            </div>
            <div>
              <p className="font-headline text-2xl font-extrabold text-hero">{molecule.sourceCount}</p>
            </div>
            <div className="text-sm leading-6 text-foreground">{molecule.keySignal}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
