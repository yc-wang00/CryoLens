import type { Cocktail } from "../types";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface CocktailsPageProps {
  cocktails: Cocktail[];
  onOpenCocktail: (cocktail: Cocktail) => void;
}

export function CocktailsPage({
  cocktails,
  onOpenCocktail,
}: CocktailsPageProps) {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="console-title">Cocktails</h1>
        <p className="mt-1 console-subtitle">
          Benchmark formulations and assay-defined mixtures available as structured starting points.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {cocktails.map((cocktail) => (
          <button
            key={cocktail.id}
            className="text-left"
            onClick={() => onOpenCocktail(cocktail)}
            type="button"
          >
            <Card className="glass-panel h-full transition-transform hover:-translate-y-0.5">
              <CardHeader className="border-b border-border/60 bg-panel/45">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{cocktail.type}</Badge>
                  {cocktail.tissueTags.slice(0, 2).map((tag) => (
                    <Badge key={`${cocktail.id}-${tag}`} variant="outline">
                      {tag.replaceAll("_", " ")}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-lg">{cocktail.name}</CardTitle>
                <CardDescription>{cocktail.notes}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {cocktail.components.map((component) => (
                  <div
                    key={`${cocktail.id}-${component.name}`}
                    className="flex items-center justify-between gap-3 rounded-sm border border-border bg-white/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{component.name}</p>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        {component.role}
                      </p>
                    </div>
                    <Badge variant="muted">{component.concentration}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
