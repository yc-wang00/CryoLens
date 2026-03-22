export type PageKey =
  | "ask"
  | "hypotheses"
  | "molecules"
  | "cocktails"
  | "sources";

export interface SourceDocument {
  id: string;
  title: string;
  journal: string;
  year: number;
  doi: string;
  note: string;
  abstract: string;
  linkedFindings: number;
  linkedMolecules: number;
}

export interface EvidenceFinding {
  id: string;
  sourceId: string;
  sourceTitle: string;
  tissue: string;
  modality: string;
  metricType: string;
  metricValue: string;
  conditions: string;
  confidence: number;
  summary: string;
  components: string[];
  tags: string[];
}

export interface Molecule {
  id: string;
  name: string;
  aliases: string[];
  className: string;
  roleHint: string;
  sourceCount: number;
  evidenceCount: number;
  notes: string;
  keySignal: string;
}

export interface Cocktail {
  id: string;
  name: string;
  type: "benchmark" | "mixture";
  tissueTags: string[];
  notes: string;
  components: Array<{
    name: string;
    role: string;
    concentration: string;
  }>;
}

export interface Hypothesis {
  id: string;
  title: string;
  status: "draft" | "prioritized" | "planned";
  benchmark: string;
  target: string;
  summary: string;
  evidenceIds: string[];
  nextStep: string;
}

export interface AgentToolCall {
  id: string;
  toolName: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  inputSummary: string;
  outputSummary: string;
}

export interface ExperimentDraft {
  id: string;
  title: string;
  benchmark: string;
  objective: string;
  temperature: string;
  assay: string;
  notes: string;
  nextAction: string;
}
