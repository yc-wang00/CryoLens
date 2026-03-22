/**
 * CryoLens shared types — used across pages and components.
 */

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
