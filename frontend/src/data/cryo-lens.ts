/**
 * CryoLens data layer — fetches from FastAPI backend REST endpoints.
 */

import type {
  Cocktail,
  EvidenceFinding,
  Molecule,
  SourceDocument,
} from "../types";

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

export type CryoLensStoryYear = StoryYear;

export interface StoryYear {
  year: number;
  papers: number;
  findings: number;
  experiments: number;
  cumulativePapers: number;
  cumulativeFindings: number;
}

export interface StoryCategory {
  label: string;
  count: number;
  sharePct: number;
}

export interface FormulationMilestone {
  id: string;
  name: string;
  year: number;
  type: string;
  note: string;
  components: string[];
  linkedFindings: number;
  referenceDoi?: string | null;
  referenceTitle?: string | null;
}

export interface CryoLensStoryStats {
  firstPaperYear: number | null;
  firstFormulationYear: number | null;
  lastYear: number | null;
  yearly: StoryYear[];
  milestones: FormulationMilestone[];
  topFindingCategories: StoryCategory[];
}

export interface AppStats {
  papers: number;
  findings: number;
  molecules: number;
  structures: number;
}

export interface HypothesisCard {
  id: string;
  title: string;
  status: string;
  benchmark: string;
  target: string;
  summary: string;
  nextStep: string;
  evidenceIds: string[];
}

export interface CryoLensDataset {
  appStats: AppStats;
  storyStats: CryoLensStoryStats;
  molecules: Molecule[];
  cocktails: Cocktail[];
  findings: EvidenceFinding[];
  sources: SourceDocument[];
  hypotheses: HypothesisCard[];
  experiments: ExperimentRecord[];
  savedPrompts: string[];
  dataSource: "live" | "mock";
  dataSourceLabel: string;
  loadLog: string[];
}

export async function fetchCryoLensDataset(
  onLog?: (message: string) => void,
): Promise<CryoLensDataset> {
  onLog?.("Fetching dataset from backend...");

  try {
    const response = await fetch("/api/v1/cryo-lens/dataset");
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    onLog?.(`Loaded ${data.appStats?.papers ?? 0} papers, ${data.appStats?.findings ?? 0} findings`);

    return {
      ...data,
      dataSource: "live" as const,
      dataSourceLabel: `Live · ${data.appStats?.papers ?? 0} papers`,
      loadLog: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onLog?.(`Failed to fetch: ${message}. Using empty dataset.`);

    return {
      appStats: { papers: 0, findings: 0, molecules: 0, structures: 0 },
      storyStats: { firstPaperYear: null, firstFormulationYear: null, lastYear: null, yearly: [], milestones: [], topFindingCategories: [] },
      molecules: [],
      cocktails: [],
      findings: [],
      sources: [],
      hypotheses: [],
      experiments: [],
      savedPrompts: [
        "What does CryoLens know about VS55?",
        "Show high-confidence toxicity findings.",
        "Which formulations contain DMSO and ethylene glycol?",
      ],
      dataSource: "mock" as const,
      dataSourceLabel: "Offline — backend unavailable",
      loadLog: [message],
    };
  }
}
