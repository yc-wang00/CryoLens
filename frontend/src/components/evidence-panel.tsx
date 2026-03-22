import { ExternalLink, FlaskConical, Microscope, Quote } from "lucide-react";

import type {
  Cocktail,
  EvidenceFinding,
  Molecule,
  SourceDocument,
} from "../data/mock-data";
import type { ExperimentRecord } from "../data/cryo-lens";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export type PanelState =
  | { kind: "none" }
  | { kind: "finding"; finding: EvidenceFinding }
  | { kind: "molecule"; molecule: Molecule }
  | { kind: "cocktail"; cocktail: Cocktail }
  | { kind: "experiment"; experiment: ExperimentRecord }
  | { kind: "source"; source: SourceDocument };

interface EvidencePanelProps {
  panel: PanelState;
}

export function EvidencePanel({ panel }: EvidencePanelProps) {
  if (panel.kind === "none") {
    return (
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-panel/60">
          <Badge className="w-fit" variant="accent">
            CryoLens Explorer
          </Badge>
          <CardTitle className="console-panel-title">Context panel</CardTitle>
          <CardDescription>
            Open a finding, molecule, cocktail, or source to inspect the linked evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="rounded-sm border border-dashed border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            Start with CryoLens Search, then open a finding or entity to keep the story flowing.
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Quote className="mt-0.5 h-4 w-4 text-primary" />
              Every answer can resolve to a specific supporting finding.
            </li>
            <li className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-4 w-4 text-primary" />
              Molecules and cocktails stay linked to hypotheses and source papers.
            </li>
            <li className="flex items-start gap-3">
              <Microscope className="mt-0.5 h-4 w-4 text-primary" />
              The panel keeps the demo evidence-backed instead of purely conversational.
            </li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (panel.kind === "finding") {
    const { finding } = panel;
    return (
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-panel/60">
          <Badge className="w-fit">Finding</Badge>
          <CardTitle className="console-panel-title">{finding.metricType.replaceAll("_", " ")}</CardTitle>
          <CardDescription>{finding.sourceTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="rounded-sm bg-muted p-4">
            <p className="text-sm leading-6 text-foreground">{finding.summary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-sm bg-white/80 p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Conditions
              </dt>
              <dd className="mt-1 text-foreground">{finding.conditions}</dd>
            </div>
            <div className="rounded-sm bg-white/80 p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Confidence
              </dt>
              <dd className="mt-1 text-foreground">{Math.round(finding.confidence * 100)}%</dd>
            </div>
          </dl>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Components
            </p>
            <div className="flex flex-wrap gap-2">
              {finding.components.map((component) => (
                <Badge key={component} variant="outline">
                  {component}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (panel.kind === "molecule") {
    const { molecule } = panel;
    return (
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-panel/60">
          <Badge className="w-fit">Molecule</Badge>
          <CardTitle className="console-panel-title">{molecule.name}</CardTitle>
          <CardDescription>{molecule.className}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm leading-6 text-foreground">{molecule.notes}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-sm bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Evidence count
              </p>
              <p className="mt-1 text-xl font-bold text-hero">{molecule.evidenceCount}</p>
            </div>
            <div className="rounded-sm bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Source count
              </p>
              <p className="mt-1 text-xl font-bold text-hero">{molecule.sourceCount}</p>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-muted/70 p-4 text-sm text-foreground">
            <strong className="font-semibold">Key signal:</strong> {molecule.keySignal}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (panel.kind === "cocktail") {
    const { cocktail } = panel;
    return (
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-panel/60">
          <Badge className="w-fit">{cocktail.type}</Badge>
          <CardTitle className="console-panel-title">{cocktail.name}</CardTitle>
          <CardDescription>{cocktail.notes}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {cocktail.components.map((component) => (
            <div
              key={`${cocktail.id}-${component.name}`}
              className="rounded-sm border border-border bg-white/80 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{component.name}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {component.role}
                  </p>
                </div>
                <Badge variant="outline">{component.concentration}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (panel.kind === "experiment") {
    const { experiment } = panel;
    return (
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-panel/60">
          <Badge className="w-fit" variant="accent">
            Experiment
          </Badge>
          <CardTitle className="console-panel-title">{experiment.title}</CardTitle>
          <CardDescription>{experiment.paperTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="rounded-sm border border-border bg-white/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Assay
            </p>
            <p className="mt-1 text-sm text-foreground">{experiment.assayMethod}</p>
          </div>
          <div className="rounded-sm border border-border bg-white/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Measurement summary
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">{experiment.measurementSummary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-border bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Temperature
              </p>
              <p className="mt-1 text-sm text-foreground">{experiment.temperature}</p>
            </div>
            <div className="rounded-sm border border-border bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Exposure
              </p>
              <p className="mt-1 text-sm text-foreground">{experiment.exposure}</p>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-muted/70 p-4 text-sm text-foreground">
            <strong className="font-semibold">Notes:</strong> {experiment.notes}
          </div>
          <Button className="w-full justify-between" variant="outline">
            {experiment.protocolName}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-panel/60">
        <Badge className="w-fit">Source</Badge>
        <CardTitle className="console-panel-title">{panel.source.title}</CardTitle>
        <CardDescription>
          {panel.source.journal} · {panel.source.year}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <p className="text-sm leading-6 text-foreground">{panel.source.abstract}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-sm bg-white/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Findings
            </p>
            <p className="mt-1 text-xl font-bold text-hero">{panel.source.linkedFindings}</p>
          </div>
          <div className="rounded-sm bg-white/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Molecules
            </p>
            <p className="mt-1 text-xl font-bold text-hero">{panel.source.linkedMolecules}</p>
          </div>
        </div>
        <Button className="w-full justify-between" variant="outline">
          DOI
          <span className="truncate text-xs text-muted-foreground">{panel.source.doi}</span>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
