import { useEffect, useState } from "react";
import { ChevronRight, FlaskConical, Microscope } from "lucide-react";

import type { HypothesisCard, ExperimentRecord } from "../data/cryo-lens";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { EvidencePanel, type PanelState } from "../components/evidence-panel";

export function HypothesesPage() {
  const [hypotheses, setHypotheses] = useState<HypothesisCard[]>([]);
  const [experiments] = useState<ExperimentRecord[]>([]);
  const [panel, setPanel] = useState<PanelState>({ kind: "none" });

  useEffect(() => {
    fetch("/api/v1/hypotheses")
      .then((r) => r.json())
      .then((data: HypothesisCard[]) => setHypotheses(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5 page-enter">
      <section>
        <div>
          <h1 className="console-title">Hypotheses</h1>
          <p className="mt-1 console-subtitle">
            Saved benchmark-guided drafts generated from Ask, with the live experiment registry available as supporting context.
          </p>
        </div>
      </section>
      <div className="space-y-4">
        {hypotheses.length ? hypotheses.map((hypothesis) => (
          <Card key={hypothesis.id} className="glass-panel">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{hypothesis.status}</Badge>
                    <Badge variant="outline">{hypothesis.benchmark}</Badge>
                    <Badge variant="accent">{hypothesis.target}</Badge>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-extrabold tracking-tight text-hero">
                      {hypothesis.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {hypothesis.summary}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setPanel({ kind: "hypothesis", hypothesis })} variant="outline">
                    Open draft
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-5 rounded-sm border border-border bg-white/80 p-4">
                <p className="table-header">Next step</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{hypothesis.nextStep}</p>
              </div>
              <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <FlaskConical className="h-4 w-4 text-primary" />
                {hypothesis.evidenceIds.length} linked evidence rows
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="glass-panel">
            <CardContent className="p-5">
              <p className="text-sm leading-6 text-muted-foreground">
                No saved hypotheses yet. Generate one from Ask using the hypothesis mode.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <section className="pt-4">
        <div>
          <h2 className="console-title">Supporting Experiments</h2>
          <p className="mt-1 console-subtitle">
            Live experiment registry imported from CryoLens, including assay context and measurement summaries.
          </p>
        </div>
      </section>
      <div className="space-y-4">
        {experiments.map((experiment) => (
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
                  <Button onClick={() => setPanel({ kind: "experiment", experiment })} variant="outline">
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
        ))}
      </div>

      <Dialog onOpenChange={(open) => (!open ? setPanel({ kind: "none" }) : null)} open={panel.kind !== "none"}>
        <DialogContent className="max-w-3xl" onClose={() => setPanel({ kind: "none" })}>
          <EvidencePanel panel={panel} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
