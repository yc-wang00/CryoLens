import { ChevronRight, Microscope } from "lucide-react";

import type { EvidenceFinding } from "../data/mock-data";
import type { ExperimentRecord } from "../data/cryo-lens";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

interface HypothesesPageProps {
  experiments: ExperimentRecord[];
  onOpenFinding: (finding: EvidenceFinding) => void;
  onOpenExperiment: (experiment: ExperimentRecord) => void;
}

export function HypothesesPage({
  experiments,
  onOpenExperiment,
}: HypothesesPageProps) {
  return (
    <div className="space-y-5">
      <section>
        <div>
          <h1 className="console-title">Experiments</h1>
          <p className="mt-1 console-subtitle">
            Live experiment registry imported from cryoLens, including assay context and measurement summaries.
          </p>
        </div>
      </section>
      <div className="space-y-4">
        {experiments.map((experiment) => {
          return (
            <Card key={experiment.id} className="glass-panel">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{experiment.outcomeStatus}</Badge>
                      <Badge variant="outline">{experiment.temperature}</Badge>
                      <Badge variant="accent">{experiment.assayMethod}</Badge>
                    </div>
                    <div>
                      <h3 className="font-headline text-xl font-extrabold tracking-tight text-hero">
                        {experiment.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {experiment.paperTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onOpenExperiment(experiment)} variant="outline">
                      Open detail
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-5 rounded-sm border border-border bg-white/80 p-4">
                  <p className="table-header">Measurement summary</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{experiment.measurementSummary}</p>
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <Microscope className="h-4 w-4 text-primary" />
                  {experiment.protocolName} · {experiment.cellType} · {experiment.organism}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
