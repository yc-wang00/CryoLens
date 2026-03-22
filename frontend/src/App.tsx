import { useState } from "react";

import { AppShell } from "./components/app-shell";
import type { PageKey } from "./types";
import { AskPage } from "./pages/ask-page";
import { CocktailsPage } from "./pages/cocktails-page";
import { HypothesesPage } from "./pages/hypotheses-page";
import { MoleculesPage } from "./pages/molecules-page";
import { SourcesPage } from "./pages/sources-page";

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("ask");

  return (
    <AppShell currentPage={currentPage} onPageChange={setCurrentPage}>
      {currentPage === "ask" && (
        <AskPage />
      )}
      {currentPage === "hypotheses" && <HypothesesPage />}
      {currentPage === "molecules" && <MoleculesPage />}
      {currentPage === "cocktails" && <CocktailsPage />}
      {currentPage === "sources" && <SourcesPage />}
    </AppShell>
  );
}

export default App;
