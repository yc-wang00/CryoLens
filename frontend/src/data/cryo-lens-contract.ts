/**
 * CRYOLENS DATA CONTRACT
 * ======================
 * Shared frontend types for CryoSight live data.
 *
 * KEY CONCEPTS:
 * - Ask keeps its backend-owned dataset and sandbox flow
 * - display pages can reuse the same UI contract even if the data source changes
 *
 * USAGE:
 * - import `CryoLensDataset` for page-level data wiring
 * - import `ExperimentRecord` for experiment cards and modal detail
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 * - MEM-0008
 */

import type {
  Cocktail,
  EvidenceFinding,
  ExperimentDraft,
  Hypothesis,
  Molecule,
  SourceDocument,
} from "./mock-data";

export interface CryoLensAppStats {
  papers: number;
  findings: number;
  molecules: number;
  structures: number;
}

export interface CryoLensStoryYear {
  year: number;
  papers: number;
  findings: number;
  experiments: number;
  cumulativePapers: number;
  cumulativeFindings: number;
}

export interface CryoLensStoryCategory {
  label: string;
  count: number;
  sharePct: number;
}

export interface CryoLensFormulationMilestone {
  id: string;
  name: string;
  year: number;
  type: "benchmark" | "mixture";
  note: string;
  referenceDoi: string | null;
  referenceTitle: string | null;
  linkedFindings: number;
  components: string[];
}

export interface CryoLensStoryStats {
  firstFormulationYear: number | null;
  firstPaperYear: number | null;
  lastYear: number | null;
  yearly: CryoLensStoryYear[];
  milestones: CryoLensFormulationMilestone[];
  topFindingCategories: CryoLensStoryCategory[];
}

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

export interface CryoLensDataset {
  appStats: CryoLensAppStats;
  storyStats: CryoLensStoryStats;
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
