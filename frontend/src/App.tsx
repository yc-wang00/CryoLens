import { useEffect, useState } from "react";

import { AppShell } from "./components/app-shell";
import { EvidencePanel, type PanelState } from "./components/evidence-panel";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { Card, CardContent } from "./components/ui/card";
import { type Cocktail, type Hypothesis, type Molecule, type PageKey, type SourceDocument } from "./data/mock-data";
import { fetchCryoLensDataset, type CryoLensDataset, type ExperimentRecord } from "./data/cryo-lens";
import { AskPage } from "./pages/ask-page";
import { CocktailsPage } from "./pages/cocktails-page";
import { HypothesesPage } from "./pages/hypotheses-page";
import { MoleculesPage } from "./pages/molecules-page";
import { SourcesPage } from "./pages/sources-page";

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("ask");
  const [panel, setPanel] = useState<PanelState>({ kind: "none" });
  const [dataset, setDataset] = useState<CryoLensDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function loadDataset(): Promise<void> {
      const nextDataset = await fetchCryoLensDataset();
      if (!active) {
        return;
      }

      setDataset(nextDataset);
      setLoading(false);
    }

    void loadDataset();

    return () => {
      active = false;
    };
  }, []);

  function openMolecule(molecule: Molecule): void {
    setPanel({ kind: "molecule", molecule });
  }

  function openCocktail(cocktail: Cocktail): void {
    setPanel({ kind: "cocktail", cocktail });
  }

  function openSource(source: SourceDocument): void {
    setPanel({ kind: "source", source });
  }

  function openExperiment(experiment: ExperimentRecord): void {
    setCurrentPage("hypotheses");
    setPanel({ kind: "experiment", experiment });
  }

  function openHypothesis(hypothesis: Hypothesis): void {
    setCurrentPage("hypotheses");
    setPanel({ kind: "hypothesis", hypothesis });
  }

  async function refreshDataset(): Promise<void> {
    const nextDataset = await fetchCryoLensDataset();
    setDataset(nextDataset);
  }

  return (
    <AppShell
      currentPage={currentPage}
      dataSource={dataset?.dataSource}
      dataSourceLabel={dataset?.dataSourceLabel}
      onPageChange={setCurrentPage}
    >
      {loading || !dataset ? (
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
          <Card className="glass-panel w-full max-w-xl">
            <CardContent className="space-y-3 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Loading live data
              </p>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-hero">
                Connecting to cryoLens
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Loading the hybrid cryoLens dataset from browser-safe Supabase reads and backend Ask services.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {!loading && dataset && currentPage === "ask" ? (
        <AskPage
          dataset={dataset}
          onHypothesisSaved={refreshDataset}
          onOpenHypotheses={() => setCurrentPage("hypotheses")}
        />
      ) : null}
      {!loading && dataset && currentPage === "hypotheses" ? (
        <HypothesesPage
          experiments={dataset.experiments}
          hypotheses={dataset.hypotheses}
          onOpenExperiment={openExperiment}
          onOpenHypothesis={openHypothesis}
        />
      ) : null}
      {!loading && dataset && currentPage === "molecules" ? (
        <MoleculesPage molecules={dataset.molecules} onOpenMolecule={openMolecule} />
      ) : null}
      {!loading && dataset && currentPage === "cocktails" ? (
        <CocktailsPage cocktails={dataset.cocktails} onOpenCocktail={openCocktail} />
      ) : null}
      {!loading && dataset && currentPage === "sources" ? (
        <SourcesPage
          onOpenSource={openSource}
          sources={dataset.sources}
          storyStats={dataset.storyStats}
        />
      ) : null}
      <Dialog onOpenChange={(open) => (!open ? setPanel({ kind: "none" }) : null)} open={panel.kind !== "none"}>
        <DialogContent className="max-w-3xl" onClose={() => setPanel({ kind: "none" })}>
          <EvidencePanel panel={panel} />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export default App;
