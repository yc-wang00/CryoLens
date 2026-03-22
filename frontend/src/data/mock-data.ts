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

export interface AskResponse {
  id: string;
  prompt: string;
  answer: string;
  why: string[];
  citations: string[];
  linkedMolecules: string[];
  linkedCocktails: string[];
  evidenceIds: string[];
  suggestedHypothesisId: string;
}

export interface AgentSearchMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}

export interface AgentToolCall {
  id: string;
  toolName: string;
  state: "queued" | "running" | "completed";
  inputSummary: string;
  outputSummary: string;
}

export interface AgentSearchRun {
  id: string;
  prompt: string;
  status: string;
  askResponseId: string;
  messages: AgentSearchMessage[];
  toolCalls: AgentToolCall[];
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

export const appStats = {
  papers: 4,
  findings: 37,
  molecules: 29,
  structures: 4,
};

export const savedPrompts: string[] = [
  "What rescues formamide toxicity at 4 C?",
  "What is in VS55?",
  "Compare VS55, DP6, and M22.",
  "What evidence suggests 4 C is safer than room temperature?",
  "What should we test next for a safer VS55-like cocktail?",
];

export const sources: SourceDocument[] = [
  {
    id: "src-1",
    title:
      "High throughput method for simultaneous screening of membrane permeability and toxicity for discovery of new cryoprotective agents",
    journal: "Scientific Reports",
    year: 2025,
    doi: "10.1038/s41598-025-85509-x",
    note: "Best source for permeability plus first-pass toxicity screening.",
    abstract:
      "Introduces a 96-well fluorescence workflow measuring permeability and short-term toxicity for 27 candidate CPAs at 4 C and 25 C.",
    linkedFindings: 11,
    linkedMolecules: 23,
  },
  {
    id: "src-2",
    title:
      "High-Throughput Evaluation of Cryoprotective Agents for Mixture Effects That Reduce Toxicity",
    journal: "bioRxiv",
    year: 2025,
    doi: "10.1101/2025.05.02.651925",
    note: "Room-temperature mixture rescue signals and concentration escalation.",
    abstract:
      "Automated liquid handling study for single-agent and binary-mixture toxicity at higher concentration in BPAEC monolayers.",
    linkedFindings: 9,
    linkedMolecules: 18,
  },
  {
    id: "src-3",
    title:
      "Screening for cryoprotective agent toxicity and toxicity reduction in mixtures at subambient temperatures",
    journal: "bioRxiv",
    year: 2025,
    doi: "10.1101/2025.05.07.652719",
    note: "Most relevant source for 4 C loading and toxicity neutralization.",
    abstract:
      "Extends the workflow to 4 C and shows many matched compositions are less toxic under subambient loading conditions.",
    linkedFindings: 12,
    linkedMolecules: 20,
  },
  {
    id: "src-4",
    title:
      "Validation of a high-throughput screening assay for the characterization of cryoprotective agent toxicity",
    journal: "bioRxiv",
    year: 2025,
    doi: "10.1101/2025.05.26.654916",
    note: "Best source for discovery campaign design and primary-screen concentration.",
    abstract:
      "Validates a T24-based HTS assay and identifies 5 M as the most informative primary screen concentration.",
    linkedFindings: 5,
    linkedMolecules: 7,
  },
];

export const findings: EvidenceFinding[] = [
  {
    id: "find-1",
    sourceId: "src-3",
    sourceTitle: sources[2].title,
    tissue: "BPAEC monolayer",
    modality: "toxicity_neutralization",
    metricType: "viability_percent",
    metricValue: "97 percent",
    conditions: "4 C | 12 mol/kg total | 30 min",
    confidence: 0.99,
    summary:
      "At 4 C, the 12 mol/kg formamide plus glycerol mixture yielded 97 percent viability, compared with 20 percent viability for 6 mol/kg formamide alone.",
    components: ["formamide", "glycerol"],
    tags: ["cold_screen", "hero_example", "amide_rescue"],
  },
  {
    id: "find-2",
    sourceId: "src-3",
    sourceTitle: sources[2].title,
    tissue: "BPAEC monolayer",
    modality: "toxicity_neutralization",
    metricType: "amide_rescue_partner_set",
    metricValue: "4 partners",
    conditions: "4 C | mixed concentrations",
    confidence: 0.94,
    summary:
      "Formamide and acetamide each showed rescue interactions with glycerol, DMSO, 2-methoxyethanol, and ethylene glycol.",
    components: [
      "formamide",
      "acetamide",
      "glycerol",
      "dimethyl sulfoxide",
      "2-methoxyethanol",
      "ethylene glycol",
    ],
    tags: ["cold_screen", "design_rule"],
  },
  {
    id: "find-3",
    sourceId: "src-1",
    sourceTitle: sources[0].title,
    tissue: "BPAEC monolayer",
    modality: "permeability_screen",
    metricType: "solute_permeability_p_cpa",
    metricValue: "57.36 x 10^-3 s^-1",
    conditions: "4 C",
    confidence: 0.95,
    summary:
      "Formamide was one of the fastest-permeating common penetrating CPAs in the initial screen.",
    components: ["formamide"],
    tags: ["permeability", "amide_feature"],
  },
  {
    id: "find-4",
    sourceId: "src-3",
    sourceTitle: sources[2].title,
    tissue: "BPAEC monolayer",
    modality: "temperature_shift",
    metricType: "better_at_4c_count",
    metricValue: "43 of 54 compositions",
    conditions: "4 C vs room temperature",
    confidence: 0.93,
    summary:
      "Forty-three of fifty-four matched compositions showed significantly higher viability at 4 C than at room temperature.",
    components: ["multiple"],
    tags: ["cold_screen", "temperature_effect"],
  },
  {
    id: "find-5",
    sourceId: "src-4",
    sourceTitle: sources[3].title,
    tissue: "T24 assay",
    modality: "hts_validation",
    metricType: "recommended_primary_screen_concentration",
    metricValue: "5 M",
    conditions: "primary screen design",
    confidence: 0.96,
    summary:
      "The validation paper identifies 5 M as the most informative primary-screen concentration for future cocktail discovery campaigns.",
    components: ["ethylene glycol", "DMSO", "glycerol", "urea"],
    tags: ["screen_design", "hts"],
  },
];

export const molecules: Molecule[] = [
  {
    id: "mol-1",
    name: "formamide",
    aliases: ["FA"],
    className: "amide",
    roleHint: "penetrating candidate",
    sourceCount: 3,
    evidenceCount: 6,
    notes:
      "Fast-permeating amide with repeated evidence of toxicity rescue by glycerol and DMSO.",
    keySignal: "High permeability, toxicity-constrained.",
  },
  {
    id: "mol-2",
    name: "glycerol",
    aliases: ["GLY"],
    className: "polyol",
    roleHint: "penetrating support partner",
    sourceCount: 3,
    evidenceCount: 5,
    notes:
      "Repeatedly appears as a rescue partner in 4 C mixture findings and anchors the strongest hero example.",
    keySignal: "Strong rescue partner signal.",
  },
  {
    id: "mol-3",
    name: "dimethyl sulfoxide",
    aliases: ["DMSO", "Me2SO"],
    className: "sulfoxide",
    roleHint: "penetrating benchmark component",
    sourceCount: 4,
    evidenceCount: 8,
    notes:
      "Core benchmark CPA with good permeability and repeated rescue-partner evidence.",
    keySignal: "Benchmark anchor and rescue partner.",
  },
  {
    id: "mol-4",
    name: "ethylene glycol",
    aliases: ["EG"],
    className: "glycol",
    roleHint: "penetrating candidate",
    sourceCount: 4,
    evidenceCount: 7,
    notes:
      "Low-toxicity member of the HTS panel and cited as a rescue partner for amides in the 4 C paper.",
    keySignal: "Lower-toxicity support option.",
  },
  {
    id: "mol-5",
    name: "1,2-propanediol",
    aliases: ["propylene glycol", "PG"],
    className: "glycol",
    roleHint: "penetrating benchmark component",
    sourceCount: 4,
    evidenceCount: 6,
    notes:
      "Fast-permeating glycol that becomes markedly safer under 4 C conditions.",
    keySignal: "Temperature-sensitive toxicity profile.",
  },
  {
    id: "mol-6",
    name: "2-methoxyethanol",
    aliases: ["2-ME"],
    className: "glycol ether",
    roleHint: "rescue candidate",
    sourceCount: 2,
    evidenceCount: 2,
    notes:
      "Appears in the rescue-partner set from the 4 C mixture paper.",
    keySignal: "Interesting secondary rescue candidate.",
  },
];

export const cocktails: Cocktail[] = [
  {
    id: "cocktail-1",
    name: "VS55",
    type: "benchmark",
    tissueTags: ["blood_vessels", "articular_cartilage", "ovarian_tissue"],
    notes:
      "Workhorse vitrification benchmark with strong glass-forming performance and a notable formamide toxicity burden.",
    components: [
      { name: "dimethyl sulfoxide", role: "penetrating", concentration: "3.1 M" },
      { name: "1,2-propanediol", role: "penetrating", concentration: "2.2 M" },
      { name: "formamide", role: "penetrating", concentration: "3.1 M" },
    ],
  },
  {
    id: "cocktail-2",
    name: "DP6",
    type: "benchmark",
    tissueTags: ["articular_cartilage", "blood_vessels"],
    notes:
      "Lower-complexity benchmark representing a cleaner toxicity reference point than VS55.",
    components: [
      { name: "dimethyl sulfoxide", role: "penetrating", concentration: "3.0 M" },
      { name: "1,2-propanediol", role: "penetrating", concentration: "3.0 M" },
    ],
  },
  {
    id: "cocktail-3",
    name: "M22",
    type: "benchmark",
    tissueTags: [
      "whole_kidney",
      "kidney_cortical_slices",
      "hippocampal_brain_slices",
    ],
    notes:
      "Canonical organ-scale benchmark with a more complex formulation including polymeric and ice-blocker components.",
    components: [
      { name: "dimethyl sulfoxide", role: "penetrating", concentration: "2.855 M" },
      { name: "formamide", role: "penetrating", concentration: "2.855 M" },
      { name: "ethylene glycol", role: "penetrating", concentration: "2.713 M" },
      { name: "polyvinylpyrrolidone", role: "polymer", concentration: "2.8% w/v" },
    ],
  },
  {
    id: "cocktail-4",
    name: "FA_GLY_12M_4C",
    type: "mixture",
    tissueTags: ["BPAEC_monolayer", "screening_assay"],
    notes:
      "Assay-defined mixture seeded from the 4 C Ahmadkhani paper because it is the clearest toxicity-neutralization example.",
    components: [
      { name: "formamide", role: "penetrating", concentration: "6 mol/kg" },
      { name: "glycerol", role: "penetrating", concentration: "6 mol/kg" },
    ],
  },
];

export const hypotheses: Hypothesis[] = [
  {
    id: "hyp-1",
    title: "Reduce formamide burden in VS55 under 4 C loading",
    status: "prioritized",
    benchmark: "VS55",
    target: "formamide",
    summary:
      "Design a VS55-like follow-up that reduces formamide burden and increases glycerol support during 4 C loading.",
    evidenceIds: ["find-1", "find-2", "find-4"],
    nextStep:
      "Prototype a VS55-inspired loading study with a lower formamide share and glycerol as the primary rescue partner.",
  },
  {
    id: "hyp-2",
    title: "Evaluate ethylene glycol as a lower-toxicity support partner",
    status: "draft",
    benchmark: "VS55",
    target: "formamide",
    summary:
      "Use ethylene glycol as a support partner in formamide-containing mixtures because it appears in the amide rescue set and looks lower-toxicity in HTS evidence.",
    evidenceIds: ["find-2", "find-5"],
    nextStep: "Rank EG-supported variants for follow-up screening.",
  },
  {
    id: "hyp-3",
    title: "Use 5 M as the first concentration band for the next screen",
    status: "planned",
    benchmark: "HTS campaign",
    target: "screen design",
    summary:
      "Adopt 5 M as the first primary-screen concentration because the validation assay identified it as the most informative range.",
    evidenceIds: ["find-5"],
    nextStep: "Set the first discovery plate around 5 M before escalating to denser concentration bands.",
  },
];

export const askResponses: AskResponse[] = [
  {
    id: "ask-1",
    prompt: "What rescues formamide toxicity at 4 C?",
    answer:
      "The strongest supported rescue partners for formamide at 4 C are glycerol and dimethyl sulfoxide, with ethylene glycol and 2-methoxyethanol also appearing in the rescue-partner set.",
    why: [
      "The 4 C mixture paper reports a named rescue-partner set for formamide and acetamide.",
      "The clearest hero result is formamide plus glycerol at 4 C with 97 percent viability.",
      "DMSO also appears in direct partner-rescue language, not just generic co-occurrence.",
    ],
    citations: [sources[2].title],
    linkedMolecules: ["formamide", "glycerol", "dimethyl sulfoxide", "ethylene glycol"],
    linkedCocktails: ["VS55", "FA_GLY_12M_4C"],
    evidenceIds: ["find-1", "find-2", "find-4"],
    suggestedHypothesisId: "hyp-1",
  },
  {
    id: "ask-2",
    prompt: "What is in VS55?",
    answer:
      "VS55 is currently modeled as a benchmark cocktail with DMSO, 1,2-propanediol, and formamide as its penetrating components.",
    why: [
      "The benchmark is stored in the structured cocktail library rather than inferred from free text.",
      "Each component is flattened into concentration-aware rows for direct comparison against other cocktails.",
    ],
    citations: ["CryoSight curated benchmark structure"],
    linkedMolecules: ["dimethyl sulfoxide", "1,2-propanediol", "formamide"],
    linkedCocktails: ["VS55", "DP6", "M22"],
    evidenceIds: ["find-3"],
    suggestedHypothesisId: "hyp-1",
  },
  {
    id: "ask-3",
    prompt: "What should we test next for a safer VS55-like cocktail?",
    answer:
      "The most defensible next step is a VS55-like follow-up that reduces formamide burden and increases glycerol and possibly ethylene glycol support under 4 C loading conditions.",
    why: [
      "Formamide is fast permeating but repeatedly appears as a toxicity bottleneck.",
      "The 4 C evidence set shows strong rescue behavior and a pronounced temperature effect.",
      "The hero finding gives a concrete literature-backed pair to anchor the next test design.",
    ],
    citations: [sources[0].title, sources[2].title, sources[3].title],
    linkedMolecules: ["formamide", "glycerol", "ethylene glycol"],
    linkedCocktails: ["VS55", "FA_GLY_12M_4C"],
    evidenceIds: ["find-1", "find-2", "find-3", "find-5"],
    suggestedHypothesisId: "hyp-1",
  },
];

export const experimentDrafts: ExperimentDraft[] = [
  {
    id: "exp-1",
    title: "VS55 formamide-reduction screen",
    benchmark: "VS55",
    objective: "Reduce formamide burden under 4 C loading while preserving permeability support.",
    temperature: "4 C",
    assay: "BPAEC monolayer viability + permeability comparison",
    notes:
      "Seed the first dry run around glycerol- and ethylene-glycol-supported variants, then rank by viability and rescue behavior.",
    nextAction: "Launch dry-run planning and generate the first plate layout.",
  },
];

export const agentSearchRuns: AgentSearchRun[] = [
  {
    id: "run-1",
    prompt: askResponses[0].prompt,
    status: "completed",
    askResponseId: askResponses[0].id,
    messages: [
      {
        id: "run-1-msg-1",
        role: "user",
        content: askResponses[0].prompt,
      },
      {
        id: "run-1-msg-2",
        role: "assistant",
        content:
          "I searched the structured findings first, then ranked direct rescue-partner evidence at 4 C rather than generic co-occurrence.",
        citations: [sources[2].title],
      },
      {
        id: "run-1-msg-3",
        role: "assistant",
        content: askResponses[0].answer,
        citations: askResponses[0].citations,
      },
    ],
    toolCalls: [
      {
        id: "run-1-tool-1",
        toolName: "query_findings",
        state: "completed",
        inputSummary: "component=formamide, temperature=4 C",
        outputSummary: "3 matched findings returned from the cold-screen evidence set.",
      },
      {
        id: "run-1-tool-2",
        toolName: "rank_rescue_partners",
        state: "completed",
        inputSummary: "target=formamide, metric=toxicity_neutralization",
        outputSummary: "Glycerol and DMSO ranked highest, with EG and 2-methoxyethanol trailing.",
      },
      {
        id: "run-1-tool-3",
        toolName: "propose_hypothesis",
        state: "completed",
        inputSummary: "benchmark=VS55, rescue_partners=glycerol|DMSO|EG",
        outputSummary: "Hypothesis draft generated for reduced-formamide VS55 variants under 4 C loading.",
      },
    ],
  },
  {
    id: "run-2",
    prompt: askResponses[1].prompt,
    status: "completed",
    askResponseId: askResponses[1].id,
    messages: [
      {
        id: "run-2-msg-1",
        role: "user",
        content: askResponses[1].prompt,
      },
      {
        id: "run-2-msg-2",
        role: "assistant",
        content:
          "I pulled the benchmark structure from the cocktail registry rather than inferring it from document text.",
      },
      {
        id: "run-2-msg-3",
        role: "assistant",
        content: askResponses[1].answer,
        citations: askResponses[1].citations,
      },
    ],
    toolCalls: [
      {
        id: "run-2-tool-1",
        toolName: "lookup_cpa_structure",
        state: "completed",
        inputSummary: "structure=VS55",
        outputSummary: "Loaded 3 components with concentration-aware benchmark metadata.",
      },
      {
        id: "run-2-tool-2",
        toolName: "compare_benchmarks",
        state: "completed",
        inputSummary: "structures=VS55|DP6|M22",
        outputSummary: "Returned overlapping and unique penetrating components for benchmark comparison.",
      },
    ],
  },
  {
    id: "run-3",
    prompt: askResponses[2].prompt,
    status: "completed",
    askResponseId: askResponses[2].id,
    messages: [
      {
        id: "run-3-msg-1",
        role: "user",
        content: askResponses[2].prompt,
      },
      {
        id: "run-3-msg-2",
        role: "assistant",
        content:
          "I traced the likely toxicity bottleneck in VS55, checked cold-loading rescue evidence, then generated a follow-up experiment from the strongest partner signals.",
        citations: [sources[0].title, sources[2].title],
      },
      {
        id: "run-3-msg-3",
        role: "assistant",
        content: askResponses[2].answer,
        citations: askResponses[2].citations,
      },
    ],
    toolCalls: [
      {
        id: "run-3-tool-1",
        toolName: "identify_benchmark_risks",
        state: "completed",
        inputSummary: "benchmark=VS55",
        outputSummary: "Formamide flagged as the strongest toxicity-constrained component.",
      },
      {
        id: "run-3-tool-2",
        toolName: "query_findings",
        state: "completed",
        inputSummary: "components=formamide|glycerol|ethylene glycol, temperature=4 C",
        outputSummary: "Cold-loading rescue set and hero finding retrieved.",
      },
      {
        id: "run-3-tool-3",
        toolName: "draft_experiment",
        state: "completed",
        inputSummary: "objective=safer VS55-like cocktail",
        outputSummary: "Generated an experiment draft with glycerol and EG as support candidates.",
      },
    ],
  },
];

export function resolveAskResponse(prompt: string): AskResponse {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const directMatch = askResponses.find(
    (response) => response.prompt.toLowerCase() === normalizedPrompt,
  );

  if (directMatch) {
    return directMatch;
  }

  if (normalizedPrompt.includes("vs55")) {
    return askResponses[1];
  }

  if (normalizedPrompt.includes("formamide")) {
    return askResponses[0];
  }

  return askResponses[2];
}

export function resolveAgentSearchRun(prompt: string): AgentSearchRun {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const directMatch = agentSearchRuns.find(
    (run) => run.prompt.toLowerCase() === normalizedPrompt,
  );

  if (directMatch) {
    return directMatch;
  }

  if (normalizedPrompt.includes("vs55")) {
    return agentSearchRuns[1];
  }

  if (normalizedPrompt.includes("formamide")) {
    return agentSearchRuns[0];
  }

  return agentSearchRuns[2];
}

export function findEvidenceByIds(ids: string[]): EvidenceFinding[] {
  return ids
    .map((id) => findings.find((finding) => finding.id === id))
    .filter((finding): finding is EvidenceFinding => finding !== undefined);
}

export function findHypothesisById(id: string): Hypothesis | undefined {
  return hypotheses.find((hypothesis) => hypothesis.id === id);
}

export function findMoleculeByName(name: string): Molecule | undefined {
  return molecules.find((molecule) => molecule.name === name);
}

export function findCocktailByName(name: string): Cocktail | undefined {
  return cocktails.find((cocktail) => cocktail.name === name);
}

export function findExperimentDraftById(id: string): ExperimentDraft | undefined {
  return experimentDrafts.find((draft) => draft.id === id);
}
