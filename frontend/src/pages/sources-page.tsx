import { CryoProgressStory } from "../components/cryo-progress-story";
import type { SourceDocument } from "../data/mock-data";
import type { CryoLensStoryStats } from "../data/cryo-lens-contract";
import { Badge } from "../components/ui/badge";
import { ProgressBar } from "../components/ui/progress-bar";

interface SourcesPageProps {
  sources: SourceDocument[];
  storyStats: CryoLensStoryStats;
  onOpenSource: (source: SourceDocument) => void;
}

export function SourcesPage({ onOpenSource, sources, storyStats }: SourcesPageProps) {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="console-title">Sources</h1>
        <p className="mt-1 console-subtitle">
          Provenance layer for every answer, ranking, and generated hypothesis.
        </p>
      </section>

      <CryoProgressStory storyStats={storyStats} />

      <div className="rounded-sm border border-border/70 bg-white">
        <div className="grid grid-cols-[0.12fr_1.25fr_0.55fr] gap-5 border-b border-border bg-muted/80 px-4 py-3">
          <div className="table-header">ID</div>
          <div className="table-header">Source document</div>
          <div className="table-header">Coverage</div>
        </div>
        {sources.map((source, index) => (
          <button
            key={source.id}
            className="grid w-full grid-cols-[0.12fr_1.25fr_0.55fr] gap-5 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/35"
            onClick={() => onOpenSource(source)}
            type="button"
          >
            <div className="font-headline text-lg font-extrabold text-border">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{source.journal}</Badge>
                <Badge variant="outline">{source.year}</Badge>
              </div>
              <h3 className="mt-3 font-headline text-lg font-extrabold tracking-tight text-hero">
                {source.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.note}</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="table-header">Linked findings</p>
                <p className="mt-1 font-headline text-2xl font-extrabold text-hero">
                  {source.linkedFindings}
                </p>
                <ProgressBar className="mt-2" value={source.linkedFindings * 8} />
              </div>
              <p className="text-xs text-muted-foreground">{source.doi}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
