import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AskPage } from "./pages/Ask";
import { HypothesesPage } from "./pages/Hypotheses";
import { MoleculesPage } from "./pages/Molecules";
import { SourcesPage } from "./pages/Sources";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ask" replace />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/hypotheses" element={<HypothesesPage />} />
        <Route path="/molecules" element={<MoleculesPage />} />
        <Route path="/sources" element={<SourcesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
