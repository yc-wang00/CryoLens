/**
 * CRYOLENS BROWSER DISPLAY ADAPTER
 * =================================
 * Read-only cryoLens display data fetched directly from Supabase in the browser.
 *
 * KEY CONCEPTS:
 * - browser access is limited to publishable-key + RLS-protected reads
 * - Ask and other privileged flows remain backend-owned
 * - normalize raw tables into the existing CryoSight display contracts
 *
 * USAGE:
 * - call `fetchCryoLensBrowserDisplayData()` from the main data loader
 *
 * MEMORY REFERENCES:
 * - MEM-0007
 * - MEM-0008
 */

import type { Cocktail, Molecule, SourceDocument } from "./mock-data";
import type {
  CryoLensAppStats,
  CryoLensFormulationMilestone,
  CryoLensStoryStats,
  CryoLensStoryYear,
  ExperimentRecord,
} from "./cryo-lens-contract";

const DEFAULT_SUPABASE_URL = "https://psbkprsjynqpclcfnmto.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vujSIs85ffBQcDpPQtf-Ag_6vHMdvzz";

type BrowserCompoundRow = {
  id: string;
  name: string;
  abbreviation: string | null;
  role: string;
  description: string | null;
};

type BrowserCompoundSynonymRow = {
  compound_id: string;
  synonym: string;
};

type BrowserCompoundDescriptorRow = {
  compound_id: string;
  descriptor: string;
  value: number;
  unit: string | null;
};

type BrowserFormulationRow = {
  id: string;
  name: string;
  full_name: string | null;
  description: string | null;
  notes: string | null;
  reference_doi: string | null;
  year_introduced: number | null;
};

type BrowserFormulationComponentRow = {
  formulation_id: string;
  compound_id: string;
  concentration: number;
  concentration_unit: string;
  role_in_formulation: string | null;
};

type BrowserFormulationPropertyRow = {
  formulation_id: string;
  property: string;
  value: number;
  unit: string;
};

type BrowserPaperRow = {
  doi: string;
  title: string;
  year: number;
  journal: string;
};

type BrowserFindingRow = {
  id: number;
  category: string;
  paper_doi: string;
  claim: string;
  tissue_type: string | null;
  organism: string | null;
  cell_type: string | null;
  formulation_id: string | null;
};

type BrowserExperimentRow = {
  id: number;
  solution_id: number;
  paper_doi: string;
  cell_type: string | null;
  organism: string | null;
  assay_method: string | null;
  temperature_c: number | null;
  exposure_time_min: number | null;
  protocol: string | null;
  source_location: string;
  outcome_status: string | null;
  notes: string | null;
  protocol_id: number | null;
};

type BrowserMeasurementRow = {
  experiment_id: number;
  metric: string;
  value: number;
  unit: string;
};

type BrowserProtocolRow = {
  id: number;
  name: string;
  description: string | null;
  viability_assay: string | null;
};

type BrowserSolutionRow = {
  id: number;
  name: string | null;
  notes: string | null;
};

export interface CryoLensBrowserDisplayData {
  appStats: CryoLensAppStats;
  storyStats: CryoLensStoryStats;
  cocktails: Cocktail[];
  experiments: ExperimentRecord[];
  molecules: Molecule[];
  sources: SourceDocument[];
}

function getBrowserSupabaseConfig(): { apiKey: string; url: string } {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    apiKey,
    url: url.replace(/\/+$/, ""),
  };
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function isBenchmarkFormulation(name: string): boolean {
  const lowerName = name.toLowerCase();
  return ["vs", "m22", "dp", "pvs", "a", "b"].some((prefix) => lowerName.startsWith(prefix));
}

async function fetchSupabaseRows<RowType extends Record<string, unknown>>(
  path: string,
): Promise<RowType[]> {
  const { apiKey, url } = getBrowserSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      accept: "application/json",
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Browser Supabase fetch failed for ${path}: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error(`Unexpected Supabase payload for ${path}`);
  }

  return payload as RowType[];
}

function buildPropertySummary(properties: BrowserFormulationPropertyRow[]): string {
  return properties
    .slice(0, 2)
    .map((propertyRow) => `${propertyRow.property.toUpperCase()} ${propertyRow.value} ${propertyRow.unit}`)
    .join(" · ");
}

function formatTemperature(value: number | null): string {
  return value === null ? "not stated" : `${value} C`;
}

function formatExposure(value: number | null): string {
  return value === null ? "not stated" : `${value} min`;
}

function buildMeasurementSummary(measurements: BrowserMeasurementRow[]): string {
  return measurements
    .slice(0, 2)
    .map((measurement) => `${humanize(measurement.metric)} ${measurement.value} ${measurement.unit}`)
    .join(" · ");
}

function dedupeComponentNames(
  formulationId: string,
  componentsByFormulation: Map<string, BrowserFormulationComponentRow[]>,
  compoundById: Map<string, BrowserCompoundRow>,
): string[] {
  return Array.from(
    new Set(
      (componentsByFormulation.get(formulationId) ?? [])
        .map((component) => compoundById.get(component.compound_id)?.name ?? null)
        .filter((value): value is string => value !== null),
    ),
  );
}

function buildStoryStats(
  formulations: BrowserFormulationRow[],
  findings: BrowserFindingRow[],
  experiments: BrowserExperimentRow[],
  papers: BrowserPaperRow[],
  findingsByFormulation: Map<string, BrowserFindingRow[]>,
  componentsByFormulation: Map<string, BrowserFormulationComponentRow[]>,
  compoundById: Map<string, BrowserCompoundRow>,
  paperByDoi: Map<string, BrowserPaperRow>,
): CryoLensStoryStats {
  const paperCountsByYear = new Map<number, number>();
  const findingCountsByYear = new Map<number, number>();
  const experimentCountsByYear = new Map<number, number>();
  const categoryCounts = new Map<string, number>();

  for (const paper of papers) {
    paperCountsByYear.set(paper.year, (paperCountsByYear.get(paper.year) ?? 0) + 1);
  }

  for (const finding of findings) {
    const paper = paperByDoi.get(finding.paper_doi);
    if (paper) {
      findingCountsByYear.set(paper.year, (findingCountsByYear.get(paper.year) ?? 0) + 1);
    }
    categoryCounts.set(finding.category, (categoryCounts.get(finding.category) ?? 0) + 1);
  }

  for (const experiment of experiments) {
    const paper = paperByDoi.get(experiment.paper_doi);
    if (!paper) {
      continue;
    }

    experimentCountsByYear.set(paper.year, (experimentCountsByYear.get(paper.year) ?? 0) + 1);
  }

  const milestones = formulations
    .filter((formulation) => formulation.year_introduced !== null)
    .map<CryoLensFormulationMilestone>((formulation) => {
      const componentNames = dedupeComponentNames(formulation.id, componentsByFormulation, compoundById);
      const referencePaper = formulation.reference_doi
        ? (paperByDoi.get(formulation.reference_doi) ?? null)
        : null;

      return {
        id: formulation.id,
        name: formulation.name,
        year: formulation.year_introduced ?? 0,
        type: isBenchmarkFormulation(formulation.name) ? "benchmark" : "mixture",
        note: formulation.description
          || formulation.notes
          || componentNames.slice(0, 3).join(", ")
          || "Formulation milestone in cryoLens.",
        referenceDoi: formulation.reference_doi,
        referenceTitle: referencePaper?.title ?? null,
        linkedFindings: (findingsByFormulation.get(formulation.id) ?? []).length,
        components: componentNames,
      };
    })
    .toSorted((left, right) => left.year - right.year || left.name.localeCompare(right.name));

  const paperYears = papers.map((paper) => paper.year);
  const formulationYears = milestones.map((milestone) => milestone.year);
  const allYears = [...paperYears, ...formulationYears];

  if (!allYears.length) {
    return {
      firstFormulationYear: null,
      firstPaperYear: null,
      lastYear: null,
      yearly: [],
      milestones,
      topFindingCategories: [],
    };
  }

  const firstYear = Math.min(...allYears);
  const lastYear = Math.max(...allYears);

  const yearly: CryoLensStoryYear[] = [];
  let cumulativePapers = 0;
  let cumulativeFindings = 0;

  for (let year = firstYear; year <= lastYear; year += 1) {
    const papersForYear = paperCountsByYear.get(year) ?? 0;
    const findingsForYear = findingCountsByYear.get(year) ?? 0;
    cumulativePapers += papersForYear;
    cumulativeFindings += findingsForYear;
    yearly.push({
      year,
      papers: papersForYear,
      findings: findingsForYear,
      experiments: experimentCountsByYear.get(year) ?? 0,
      cumulativePapers,
      cumulativeFindings,
    });
  }

  const totalFindings = findings.length;
  const topFindingCategories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([label, count]) => ({
      label: humanize(label),
      count,
      sharePct: totalFindings ? Math.round((count / totalFindings) * 1000) / 10 : 0,
    }));

  return {
    firstFormulationYear: formulationYears.length ? Math.min(...formulationYears) : null,
    firstPaperYear: paperYears.length ? Math.min(...paperYears) : null,
    lastYear,
    yearly,
    milestones,
    topFindingCategories,
  };
}

export async function fetchCryoLensBrowserDisplayData(
  onLog?: (message: string) => void,
): Promise<CryoLensBrowserDisplayData> {
  const { url } = getBrowserSupabaseConfig();
  onLog?.(`Trying browser Supabase display source: ${url}`);

  const [
    compounds,
    compoundSynonyms,
    compoundDescriptors,
    formulations,
    formulationComponents,
    formulationProperties,
    papers,
    findings,
    experiments,
    measurements,
    protocols,
    solutions,
  ] = await Promise.all([
    fetchSupabaseRows<BrowserCompoundRow>("compounds?select=id,name,abbreviation,role,description&limit=500"),
    fetchSupabaseRows<BrowserCompoundSynonymRow>("compound_synonyms?select=compound_id,synonym&limit=2000"),
    fetchSupabaseRows<BrowserCompoundDescriptorRow>("compound_descriptors?select=compound_id,descriptor,value,unit&limit=2000"),
    fetchSupabaseRows<BrowserFormulationRow>("formulations?select=id,name,full_name,description,notes,reference_doi,year_introduced&limit=500"),
    fetchSupabaseRows<BrowserFormulationComponentRow>("formulation_components?select=formulation_id,compound_id,concentration,concentration_unit,role_in_formulation&limit=2000"),
    fetchSupabaseRows<BrowserFormulationPropertyRow>("formulation_properties?select=formulation_id,property,value,unit&limit=1000"),
    fetchSupabaseRows<BrowserPaperRow>("papers?select=doi,title,year,journal&limit=1000"),
    fetchSupabaseRows<BrowserFindingRow>("findings?select=id,category,paper_doi,claim,tissue_type,organism,cell_type,formulation_id&limit=5000"),
    fetchSupabaseRows<BrowserExperimentRow>("experiments?select=id,solution_id,paper_doi,cell_type,organism,assay_method,temperature_c,exposure_time_min,protocol,source_location,outcome_status,notes,protocol_id&limit=2000"),
    fetchSupabaseRows<BrowserMeasurementRow>("measurements?select=experiment_id,metric,value,unit&limit=5000"),
    fetchSupabaseRows<BrowserProtocolRow>("protocols?select=id,name,description,viability_assay&limit=500"),
    fetchSupabaseRows<BrowserSolutionRow>("solutions?select=id,name,notes&limit=2000"),
  ]);

  const compoundById = new Map(compounds.map((compound) => [compound.id, compound]));
  const paperByDoi = new Map(papers.map((paper) => [paper.doi, paper]));
  const protocolById = new Map(protocols.map((protocol) => [protocol.id, protocol]));
  const solutionById = new Map(solutions.map((solution) => [solution.id, solution]));

  const synonymsByCompound = new Map<string, BrowserCompoundSynonymRow[]>();
  for (const synonym of compoundSynonyms) {
    const current = synonymsByCompound.get(synonym.compound_id) ?? [];
    current.push(synonym);
    synonymsByCompound.set(synonym.compound_id, current);
  }

  const descriptorsByCompound = new Map<string, BrowserCompoundDescriptorRow[]>();
  for (const descriptor of compoundDescriptors) {
    const current = descriptorsByCompound.get(descriptor.compound_id) ?? [];
    current.push(descriptor);
    descriptorsByCompound.set(descriptor.compound_id, current);
  }

  const componentsByFormulation = new Map<string, BrowserFormulationComponentRow[]>();
  for (const component of formulationComponents) {
    const current = componentsByFormulation.get(component.formulation_id) ?? [];
    current.push(component);
    componentsByFormulation.set(component.formulation_id, current);
  }

  const propertiesByFormulation = new Map<string, BrowserFormulationPropertyRow[]>();
  for (const propertyRow of formulationProperties) {
    const current = propertiesByFormulation.get(propertyRow.formulation_id) ?? [];
    current.push(propertyRow);
    propertiesByFormulation.set(propertyRow.formulation_id, current);
  }

  const findingsByPaper = new Map<string, BrowserFindingRow[]>();
  const findingsByFormulation = new Map<string, BrowserFindingRow[]>();
  for (const finding of findings) {
    const paperFindings = findingsByPaper.get(finding.paper_doi) ?? [];
    paperFindings.push(finding);
    findingsByPaper.set(finding.paper_doi, paperFindings);

    if (finding.formulation_id) {
      const formulationFindings = findingsByFormulation.get(finding.formulation_id) ?? [];
      formulationFindings.push(finding);
      findingsByFormulation.set(finding.formulation_id, formulationFindings);
    }
  }

  const sourceCountByCompound = new Map<string, Set<string>>();
  const evidenceCountByCompound = new Map<string, number>();
  for (const finding of findings) {
    if (!finding.formulation_id) {
      continue;
    }

    for (const component of componentsByFormulation.get(finding.formulation_id) ?? []) {
      const existingSources = sourceCountByCompound.get(component.compound_id) ?? new Set<string>();
      existingSources.add(finding.paper_doi);
      sourceCountByCompound.set(component.compound_id, existingSources);

      evidenceCountByCompound.set(
        component.compound_id,
        (evidenceCountByCompound.get(component.compound_id) ?? 0) + 1,
      );
    }
  }

  const molecules = compounds
    .map<Molecule>((compound) => {
      const aliases = Array.from(
        new Set(
          [
            compound.abbreviation,
            ...(synonymsByCompound.get(compound.id) ?? []).map((synonym) => synonym.synonym),
          ].filter((value): value is string => Boolean(value)),
        ),
      );
      const leadDescriptor = (descriptorsByCompound.get(compound.id) ?? [])[0];
      const evidenceCount = evidenceCountByCompound.get(compound.id) ?? 0;
      const keySignal = leadDescriptor
        ? `${humanize(leadDescriptor.descriptor)} ${leadDescriptor.value}${leadDescriptor.unit ? ` ${leadDescriptor.unit}` : ""}`
        : `${evidenceCount} linked findings`;

      return {
        id: compound.id,
        name: compound.name,
        aliases,
        className: humanize(compound.role),
        roleHint: humanize(compound.role),
        sourceCount: (sourceCountByCompound.get(compound.id) ?? new Set<string>()).size,
        evidenceCount,
        notes: compound.description ?? "Imported from cryoLens compound registry.",
        keySignal,
      };
    })
    .toSorted((left, right) => right.evidenceCount - left.evidenceCount || left.name.localeCompare(right.name));

  const cocktails = formulations
    .map<Cocktail>((formulation) => {
      const formulationFindings = findingsByFormulation.get(formulation.id) ?? [];
      const tissueTags = Array.from(
        new Set(
          formulationFindings.flatMap((finding) => (
            [finding.tissue_type, finding.organism, finding.cell_type]
              .filter((value): value is string => Boolean(value))
              .map((value) => value.replaceAll(" ", "_"))
          )),
        ),
      ).slice(0, 3);
      const propertySummary = buildPropertySummary(propertiesByFormulation.get(formulation.id) ?? []);

      return {
        id: formulation.id,
        name: formulation.name,
        type: isBenchmarkFormulation(formulation.name) ? "benchmark" : "mixture",
        tissueTags,
        notes: formulation.description
          ?? formulation.notes
          ?? (propertySummary || "Formulation imported from cryoLens."),
        components: (componentsByFormulation.get(formulation.id) ?? []).map((component) => ({
          name: compoundById.get(component.compound_id)?.name ?? component.compound_id,
          role: component.role_in_formulation ?? compoundById.get(component.compound_id)?.role ?? "component",
          concentration: `${component.concentration} ${component.concentration_unit}`,
        })),
      };
    })
    .toSorted((left, right) => left.name.localeCompare(right.name));

  const sources = papers
    .map<SourceDocument>((paper) => {
      const linkedFindings = findingsByPaper.get(paper.doi) ?? [];
      const linkedCompoundIds = new Set<string>();

      for (const finding of linkedFindings) {
        if (!finding.formulation_id) {
          continue;
        }

        for (const component of componentsByFormulation.get(finding.formulation_id) ?? []) {
          linkedCompoundIds.add(component.compound_id);
        }
      }

      const abstract = linkedFindings
        .slice(0, 2)
        .map((finding) => finding.claim)
        .join(" ");

      return {
        id: paper.doi,
        title: paper.title,
        journal: paper.journal,
        year: paper.year,
        doi: paper.doi,
        note: linkedFindings[0]?.claim ?? "Primary source in the cryoLens knowledge base.",
        abstract: abstract || "Imported from cryoLens paper registry.",
        linkedFindings: linkedFindings.length,
        linkedMolecules: linkedCompoundIds.size,
      };
    })
    .toSorted((left, right) => right.linkedFindings - left.linkedFindings || right.year - left.year);

  const measurementsByExperiment = new Map<number, BrowserMeasurementRow[]>();
  for (const measurement of measurements) {
    const current = measurementsByExperiment.get(measurement.experiment_id) ?? [];
    current.push(measurement);
    measurementsByExperiment.set(measurement.experiment_id, current);
  }

  const experimentsDisplay = experiments
    .map<ExperimentRecord>((experiment) => {
      const paper = paperByDoi.get(experiment.paper_doi);
      const protocol = experiment.protocol_id === null ? null : (protocolById.get(experiment.protocol_id) ?? null);
      const solution = solutionById.get(experiment.solution_id) ?? null;
      const measurementSummary = buildMeasurementSummary(measurementsByExperiment.get(experiment.id) ?? []);

      return {
        id: `experiment-${experiment.id}`,
        title: solution?.name ?? `Experiment ${experiment.id}`,
        paperTitle: paper?.title ?? experiment.paper_doi,
        assayMethod: experiment.assay_method ?? protocol?.viability_assay ?? "assay not stated",
        organism: experiment.organism ?? "mixed",
        cellType: experiment.cell_type ?? "not stated",
        temperature: formatTemperature(experiment.temperature_c),
        exposure: formatExposure(experiment.exposure_time_min),
        protocolName: protocol?.name ?? experiment.protocol ?? "protocol not linked",
        outcomeStatus: experiment.outcome_status ?? "measurable",
        measurementSummary: measurementSummary || "No linked measurements",
        notes: experiment.notes ?? solution?.notes ?? protocol?.description ?? "Imported from cryoLens.",
        sourceLocation: experiment.source_location,
      };
    })
    .toSorted((left, right) => left.title.localeCompare(right.title));

  const storyStats = buildStoryStats(
    formulations,
    findings,
    experiments,
    papers,
    findingsByFormulation,
    componentsByFormulation,
    compoundById,
    paperByDoi,
  );

  onLog?.(`Browser Supabase display fetch succeeded via ${url}`);

  return {
    appStats: {
      papers: papers.length,
      findings: findings.length,
      molecules: molecules.length,
      structures: cocktails.length,
    },
    storyStats,
    molecules,
    cocktails,
    sources,
    experiments: experimentsDisplay,
  };
}
