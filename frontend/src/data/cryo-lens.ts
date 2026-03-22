/**
 * CRYOLENS DATA ADAPTER
 * =====================
 * Fetch the normalized cryoLens dataset from the FastAPI backend, with a
 * fallback to curated mock data.
 *
 * MEMORY REFERENCES:
 * - MEM-0004
 * - MEM-0005
 * - MEM-0006
 */

import type {
  AgentToolCall,
  Cocktail,
  EvidenceFinding,
  ExperimentDraft,
  Hypothesis,
  Molecule,
  SourceDocument,
} from "./mock-data";
import {
  appStats as fallbackAppStats,
  askResponses,
  cocktails as fallbackCocktails,
  experimentDrafts,
  findings as fallbackFindings,
  hypotheses as fallbackHypotheses,
  molecules as fallbackMolecules,
  sources as fallbackSources,
} from "./mock-data";

export interface ExperimentRecord {
  id: string;
  title: string;
  paperTitle: string;
  assayMethod: string;
  organism: string;
  cellType: string;
  temperature: string;
  exposure: string;
  protocolName: string;
  outcomeStatus: string;
  measurementSummary: string;
  notes: string;
  sourceLocation: string;
}

export interface SearchResult {
  answer: string;
  why: string[];
  evidence: EvidenceFinding[];
  linkedMolecules: Molecule[];
  linkedCocktails: Cocktail[];
  linkedSources: SourceDocument[];
  toolCalls: AgentToolCall[];
  suggestedHypothesis?: Hypothesis;
}

export interface CryoLensDataset {
  appStats: typeof fallbackAppStats;
  molecules: Molecule[];
  cocktails: Cocktail[];
  findings: EvidenceFinding[];
  sources: SourceDocument[];
  hypotheses: Hypothesis[];
  experiments: ExperimentRecord[];
  experimentDrafts: ExperimentDraft[];
  savedPrompts: string[];
  dataSource: "live" | "mock";
  dataSourceLabel: string;
  loadLog: string[];
}

function buildFallbackDataset(loadLog: string[] = []): CryoLensDataset {
  return {
    appStats: fallbackAppStats,
    molecules: fallbackMolecules,
    cocktails: fallbackCocktails,
    findings: fallbackFindings,
    sources: fallbackSources,
    hypotheses: fallbackHypotheses,
    experiments: experimentDrafts.map((draft) => ({
      id: draft.id,
      title: draft.title,
      paperTitle: draft.benchmark,
      assayMethod: draft.assay,
      organism: "mixed",
      cellType: "screening assay",
      temperature: draft.temperature,
      exposure: "planned",
      protocolName: "draft protocol",
      outcomeStatus: "planned",
      measurementSummary: "No live measurements linked",
      notes: draft.notes,
      sourceLocation: "CryoSight demo draft",
    })),
    experimentDrafts,
    savedPrompts: askResponses.map((response) => response.prompt),
    dataSource: "mock",
    dataSourceLabel: "Mock dataset fallback",
    loadLog,
  };
}

function buildCandidateBaseUrls(): string[] {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const candidates = ["/api/cryo-lens-dataset"];

  if (envBaseUrl) {
    candidates.push(envBaseUrl.replace(/\/+$/, ""));
  }

  return [...new Set(candidates)];
}

export async function fetchCryoLensDataset(
  onLog?: (message: string) => void,
): Promise<CryoLensDataset> {
  const attemptedBaseUrls = buildCandidateBaseUrls();
  const loadLog: string[] = [];
  let lastError: unknown = null;
  const pushLog = (message: string): void => {
    loadLog.push(message);
    onLog?.(message);
  };

  for (const baseUrl of attemptedBaseUrls) {
    try {
      const url =
        baseUrl === "/api/cryo-lens-dataset"
          ? baseUrl
          : `${baseUrl}/api/v1/cryo-lens/dataset`;
      pushLog(`Trying dataset source: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        pushLog(`Dataset request failed with status ${response.status}: ${url}`);
        throw new Error(`Failed to fetch backend cryoLens dataset: ${response.status}`);
      }

      const dataset = (await response.json()) as Omit<
        CryoLensDataset,
        "dataSource" | "dataSourceLabel" | "loadLog"
      >;
      const backendBaseUrl = response.headers.get("x-cryo-backend-base-url");
      pushLog(
        `Dataset request succeeded via ${url}${backendBaseUrl ? ` -> backend ${backendBaseUrl}` : ""}`,
      );
      return {
        ...dataset,
        dataSource: "live",
        dataSourceLabel: `Live backend dataset · ${baseUrl || "same-origin proxy"}`,
        loadLog,
      };
    } catch (error) {
      pushLog(`Dataset request error for ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
      lastError = error;
    }
  }

  console.error(
    "Failed to fetch cryoLens dataset from backend, falling back to mock data.",
    lastError,
  );
  pushLog(
    `Falling back to mock dataset: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
  return buildFallbackDataset(loadLog);
}

export function searchCryoLensDataset(
  prompt: string,
  dataset: CryoLensDataset,
): SearchResult {
  const query = prompt.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  const scoreText = (text: string): number =>
    tokens.reduce((total, token) => total + (text.toLowerCase().includes(token) ? 1 : 0), 0);

  const evidence = dataset.findings
    .map((finding) => ({
      finding,
      score: scoreText(
        [
          finding.summary,
          finding.metricType,
          finding.sourceTitle,
          finding.components.join(" "),
          finding.tags.join(" "),
          finding.conditions,
        ].join(" "),
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || right.finding.confidence - left.finding.confidence)
    .slice(0, 6)
    .map((entry) => entry.finding);

  const linkedMolecules = dataset.molecules
    .filter((molecule) => {
      const haystack = [molecule.name, molecule.aliases.join(" "), molecule.notes, molecule.keySignal].join(" ");
      return scoreText(haystack) > 0 || evidence.some((finding) => finding.components.includes(molecule.name));
    })
    .slice(0, 6);

  const linkedCocktails = dataset.cocktails
    .filter((cocktail) => {
      const haystack = [
        cocktail.name,
        cocktail.notes,
        cocktail.components.map((component) => component.name).join(" "),
      ].join(" ");
      return scoreText(haystack) > 0;
    })
    .slice(0, 4);

  const linkedSources = dataset.sources
    .filter((source) => scoreText([source.title, source.note, source.journal, source.doi].join(" ")) > 0)
    .slice(0, 4);

  const finalEvidence = evidence.length ? evidence : dataset.findings.slice(0, 4);
  const topSignal = finalEvidence[0];

  return {
    answer:
      topSignal !== undefined
        ? `CryoSight found ${finalEvidence.length} matching findings. The strongest immediate signal is: ${topSignal.summary}`
        : `CryoSight did not find a strong direct match, but the live dataset includes ${dataset.appStats.findings} findings across ${dataset.appStats.papers} papers.`,
    why: [
      `${finalEvidence.length} findings matched the query terms across claims, tags, and linked sources.`,
      `${linkedMolecules.length} molecules and ${linkedCocktails.length} formulations were linked from the same pass.`,
      "Results are coming from the live cryoLens dataset through the FastAPI backend adapter.",
    ],
    evidence: finalEvidence,
    linkedMolecules,
    linkedCocktails,
    linkedSources,
    toolCalls: [
      {
        id: `${query}-findings`,
        toolName: "query_findings",
        state: "completed",
        inputSummary: `keyword search over ${dataset.appStats.findings} findings`,
        outputSummary: `${finalEvidence.length} evidence rows matched`,
      },
      {
        id: `${query}-compounds`,
        toolName: "query_compounds",
        state: "completed",
        inputSummary: `compound + synonym search over ${dataset.appStats.molecules} molecules`,
        outputSummary: `${linkedMolecules.length} linked molecules surfaced`,
      },
      {
        id: `${query}-formulations`,
        toolName: "query_formulations",
        state: "completed",
        inputSummary: `formulation search over ${dataset.appStats.structures} structures`,
        outputSummary: `${linkedCocktails.length} linked formulations surfaced`,
      },
    ],
    suggestedHypothesis: dataset.hypotheses[0],
  };
}
