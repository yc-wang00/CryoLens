/**
 * CRYOLENS DATA ADAPTER
 * =====================
 * Merge backend-owned Ask data with browser-side read-only display data.
 *
 * KEY CONCEPTS:
 * - Ask and agent search remain backend-owned
 * - display pages can read directly from Supabase under RLS
 * - fallback stays graceful when either live source is unavailable
 *
 * MEMORY REFERENCES:
 * - MEM-0004
 * - MEM-0005
 * - MEM-0007
 * - MEM-0008
 */

import type {
  AgentToolCall,
  Cocktail,
  EvidenceFinding,
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
import { fetchCryoLensBrowserDisplayData } from "./cryo-lens-browser";
import type { CryoLensDataset, CryoLensStoryStats } from "./cryo-lens-contract";

export type { CryoLensDataset, ExperimentRecord } from "./cryo-lens-contract";

const FALLBACK_MILESTONE_YEARS: Record<string, number> = {
  DP6: 1984,
  FA_GLY_12M_4C: 2025,
  M22: 2004,
  VS55: 1985,
};

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

function buildFallbackStoryStats(): CryoLensStoryStats {
  const sourcesById = new Map(fallbackSources.map((source) => [source.id, source]));
  const categoryCounts = new Map<string, number>();
  const paperCountsByYear = new Map<number, number>();
  const findingCountsByYear = new Map<number, number>();
  const experimentCountsByYear = new Map<number, number>();

  for (const source of fallbackSources) {
    paperCountsByYear.set(source.year, (paperCountsByYear.get(source.year) ?? 0) + 1);
  }

  for (const finding of fallbackFindings) {
    const source = sourcesById.get(finding.sourceId);
    if (source) {
      findingCountsByYear.set(source.year, (findingCountsByYear.get(source.year) ?? 0) + 1);
    }
    categoryCounts.set(finding.modality, (categoryCounts.get(finding.modality) ?? 0) + 1);
  }

  const fallbackExperimentYear = Math.max(...fallbackSources.map((source) => source.year));
  for (const draft of experimentDrafts) {
    void draft;
    experimentCountsByYear.set(
      fallbackExperimentYear,
      (experimentCountsByYear.get(fallbackExperimentYear) ?? 0) + 1,
    );
  }

  const milestones = fallbackCocktails
    .filter((cocktail) => FALLBACK_MILESTONE_YEARS[cocktail.name] !== undefined || FALLBACK_MILESTONE_YEARS[cocktail.id] !== undefined)
    .map((cocktail) => {
      const year = FALLBACK_MILESTONE_YEARS[cocktail.name] ?? FALLBACK_MILESTONE_YEARS[cocktail.id] ?? fallbackExperimentYear;
      const linkedFindings = fallbackFindings.filter((finding) => (
        cocktail.components.some((component) => finding.components.some((name) => name.toLowerCase() === component.name.toLowerCase()))
      )).length;

      return {
        id: cocktail.id,
        name: cocktail.name,
        year,
        type: cocktail.type,
        note: cocktail.notes,
        referenceDoi: null,
        referenceTitle: null,
        linkedFindings,
        components: cocktail.components.map((component) => component.name),
      };
    })
    .sort((left, right) => left.year - right.year || left.name.localeCompare(right.name));

  const paperYears = fallbackSources.map((source) => source.year);
  const milestoneYears = milestones.map((milestone) => milestone.year);
  const firstYear = Math.min(...paperYears, ...milestoneYears);
  const lastYear = Math.max(...paperYears, ...milestoneYears);

  let cumulativePapers = 0;
  let cumulativeFindings = 0;
  const yearly = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const papers = paperCountsByYear.get(year) ?? 0;
    const findings = findingCountsByYear.get(year) ?? 0;
    cumulativePapers += papers;
    cumulativeFindings += findings;
    yearly.push({
      year,
      papers,
      findings,
      experiments: experimentCountsByYear.get(year) ?? 0,
      cumulativePapers,
      cumulativeFindings,
    });
  }

  return {
    firstFormulationYear: Math.min(...milestoneYears),
    firstPaperYear: Math.min(...paperYears),
    lastYear,
    yearly,
    milestones,
    topFindingCategories: [...categoryCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([label, count]) => ({
        label: label.replaceAll("_", " "),
        count,
        sharePct: Math.round((count / fallbackFindings.length) * 1000) / 10,
      })),
  };
}

function buildFallbackDataset(loadLog: string[] = []): CryoLensDataset {
  return {
    appStats: fallbackAppStats,
    storyStats: buildFallbackStoryStats(),
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

async function fetchBackendCryoLensDataset(
  pushLog: (message: string) => void,
): Promise<Omit<CryoLensDataset, "dataSource" | "dataSourceLabel" | "loadLog">> {
  for (const baseUrl of buildCandidateBaseUrls()) {
    try {
      const url =
        baseUrl === "/api/cryo-lens-dataset"
          ? baseUrl
          : `${baseUrl}/api/v1/cryo-lens/dataset`;
      pushLog(`Trying backend Ask dataset source: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        pushLog(`Backend Ask dataset request failed with status ${response.status}: ${url}`);
        throw new Error(`Failed to fetch backend cryoLens dataset: ${response.status}`);
      }

      const dataset = (await response.json()) as Omit<
        CryoLensDataset,
        "dataSource" | "dataSourceLabel" | "loadLog"
      >;
      const backendBaseUrl = response.headers.get("x-cryo-backend-base-url");
      pushLog(
        `Backend Ask dataset succeeded via ${url}${backendBaseUrl ? ` -> backend ${backendBaseUrl}` : ""}`,
      );
      return dataset;
    } catch (error) {
      pushLog(`Backend Ask dataset error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error("Backend Ask dataset is unavailable.");
}

export async function fetchCryoLensDataset(
  onLog?: (message: string) => void,
): Promise<CryoLensDataset> {
  const loadLog: string[] = [];
  const pushLog = (message: string): void => {
    loadLog.push(message);
    onLog?.(message);
  };
  const [browserDisplayResult, backendDatasetResult] = await Promise.allSettled([
    fetchCryoLensBrowserDisplayData(pushLog),
    fetchBackendCryoLensDataset(pushLog),
  ]);

  const fallbackDataset = buildFallbackDataset(loadLog);

  const baseDataset = backendDatasetResult.status === "fulfilled"
    ? backendDatasetResult.value
    : fallbackDataset;

  if (backendDatasetResult.status === "rejected") {
    console.error(
      "Failed to fetch backend Ask dataset, falling back to the curated mock shell.",
      backendDatasetResult.reason,
    );
    pushLog(
      `Backend Ask dataset fell back to mock: ${backendDatasetResult.reason instanceof Error ? backendDatasetResult.reason.message : String(backendDatasetResult.reason)}`,
    );
  }

  const mergedDataset = browserDisplayResult.status === "fulfilled"
    ? {
        ...baseDataset,
        appStats: browserDisplayResult.value.appStats,
        storyStats: browserDisplayResult.value.storyStats,
        molecules: browserDisplayResult.value.molecules,
        cocktails: browserDisplayResult.value.cocktails,
        sources: browserDisplayResult.value.sources,
        experiments: browserDisplayResult.value.experiments,
      }
    : baseDataset;

  if (browserDisplayResult.status === "rejected") {
    console.error(
      "Failed to fetch browser-side cryoLens display data, preserving backend/mock display data.",
      browserDisplayResult.reason,
    );
    pushLog(
      `Browser display data fell back to backend/mock: ${browserDisplayResult.reason instanceof Error ? browserDisplayResult.reason.message : String(browserDisplayResult.reason)}`,
    );
  }

  const isAnyLiveSourceAvailable =
    browserDisplayResult.status === "fulfilled" || backendDatasetResult.status === "fulfilled";

  const dataSourceLabel = browserDisplayResult.status === "fulfilled" && backendDatasetResult.status === "fulfilled"
    ? "Hybrid live data · browser Supabase display + backend Ask"
    : browserDisplayResult.status === "fulfilled"
      ? "Live browser display · backend Ask fallback"
      : backendDatasetResult.status === "fulfilled"
        ? "Live backend dataset"
        : fallbackDataset.dataSourceLabel;

  return {
    ...mergedDataset,
    dataSource: isAnyLiveSourceAvailable ? "live" : "mock",
    dataSourceLabel,
    loadLog,
  };
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
      "Results are coming from the live CryoSight hybrid dataset, with browser display reads and backend-owned research flows.",
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
