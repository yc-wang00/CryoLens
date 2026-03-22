"""Live cryoLens Supabase dataset adapter for FastAPI."""

# ruff: noqa: E501

from __future__ import annotations

from collections import defaultdict

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.schemas.cryo_lens import (
    CryoLensCocktail,
    CryoLensCocktailComponent,
    CryoLensDatasetResponse,
    CryoLensExperimentDraft,
    CryoLensExperimentRecord,
    CryoLensFinding,
    CryoLensFormulationMilestone,
    CryoLensMolecule,
    CryoLensSourceDocument,
    CryoLensStats,
    CryoLensStoryCategory,
    CryoLensStoryStats,
    CryoLensStoryYear,
)
from app.services.hypotheses import list_hypothesis_cards


def _humanize(value: str) -> str:
    return value.replace("_", " ")


def _confidence_to_number(value: str | None) -> float:
    if value == "medium":
        return 0.78
    if value == "low":
        return 0.58
    return 0.95


def _is_benchmark_formulation(name: str) -> bool:
    lower_name = name.lower()
    return lower_name.startswith(("vs", "m22", "dp", "pvs", "a", "b"))


def _dedupe_component_names(
    component_rows: list[dict[str, object]],
    compound_by_id: dict[object, dict[str, object]],
) -> list[str]:
    return list(
        dict.fromkeys(
            str(compound["name"])
            for component in component_rows
            if (
                compound := compound_by_id.get(str(component["compound_id"]))
            ) is not None
        )
    )


def _build_story_stats(
    formulations: list[dict[str, object]],
    papers: list[dict[str, object]],
    findings: list[dict[str, object]],
    experiments: list[dict[str, object]],
    findings_by_formulation: dict[str, list[dict[str, object]]],
    components_by_formulation: dict[str, list[dict[str, object]]],
    compound_by_id: dict[object, dict[str, object]],
    paper_by_doi: dict[object, dict[str, object]],
) -> CryoLensStoryStats:
    paper_counts_by_year: dict[int, int] = defaultdict(int)
    finding_counts_by_year: dict[int, int] = defaultdict(int)
    experiment_counts_by_year: dict[int, int] = defaultdict(int)
    category_counts: dict[str, int] = defaultdict(int)

    paper_years: list[int] = []
    formulation_years: list[int] = []

    for paper in papers:
        year = int(paper["year"])
        paper_years.append(year)
        paper_counts_by_year[year] += 1

    for finding in findings:
        paper = paper_by_doi.get(str(finding["paper_doi"]))
        if paper is not None:
            finding_counts_by_year[int(paper["year"])] += 1
        category_counts[str(finding["category"])] += 1

    for experiment in experiments:
        paper = paper_by_doi.get(str(experiment["paper_doi"]))
        if paper is not None:
            experiment_counts_by_year[int(paper["year"])] += 1

    milestones: list[CryoLensFormulationMilestone] = []
    for formulation in formulations:
        year_value = formulation.get("year_introduced")
        if year_value is None:
            continue

        year = int(year_value)
        formulation_years.append(year)
        formulation_id = str(formulation["id"])
        reference_doi = (
            str(formulation["reference_doi"])
            if formulation.get("reference_doi")
            else None
        )
        reference_paper = (
            paper_by_doi.get(reference_doi)
            if reference_doi is not None
            else None
        )
        component_names = _dedupe_component_names(
            components_by_formulation.get(formulation_id, []),
            compound_by_id,
        )
        milestones.append(
            CryoLensFormulationMilestone(
                id=formulation_id,
                name=str(formulation["name"]),
                year=year,
                type=(
                    "benchmark"
                    if _is_benchmark_formulation(str(formulation["name"]))
                    else "mixture"
                ),
                note=str(
                    formulation.get("description")
                    or formulation.get("notes")
                    or (
                        ", ".join(component_names[:3])
                        if component_names
                        else "Formulation milestone in cryoLens."
                    )
                ),
                referenceDoi=reference_doi,
                referenceTitle=(
                    str(reference_paper["title"])
                    if reference_paper is not None
                    else None
                ),
                linkedFindings=len(findings_by_formulation.get(formulation_id, [])),
                components=component_names,
            )
        )

    years = [*paper_years, *formulation_years]
    if not years:
        return CryoLensStoryStats()

    first_year = min(years)
    last_year = max(years)

    cumulative_papers = 0
    cumulative_findings = 0
    yearly = []
    for year in range(first_year, last_year + 1):
        cumulative_papers += paper_counts_by_year[year]
        cumulative_findings += finding_counts_by_year[year]
        yearly.append(
            CryoLensStoryYear(
                year=year,
                papers=paper_counts_by_year[year],
                findings=finding_counts_by_year[year],
                experiments=experiment_counts_by_year[year],
                cumulativePapers=cumulative_papers,
                cumulativeFindings=cumulative_findings,
            )
        )

    total_findings = len(findings)
    top_finding_categories = [
        CryoLensStoryCategory(
            label=_humanize(category),
            count=count,
            sharePct=round((count / total_findings) * 100, 1) if total_findings else 0.0,
        )
        for category, count in sorted(
            category_counts.items(),
            key=lambda item: (-item[1], item[0]),
        )[:5]
    ]

    return CryoLensStoryStats(
        firstFormulationYear=min(formulation_years) if formulation_years else None,
        firstPaperYear=min(paper_years) if paper_years else None,
        lastYear=last_year,
        yearly=yearly,
        milestones=sorted(milestones, key=lambda item: (item.year, item.name)),
        topFindingCategories=top_finding_categories,
    )


async def _fetch_table(
    client: httpx.AsyncClient,
    path: str,
) -> list[dict[str, object]]:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase configuration is missing for cryoLens dataset fetches.")

    response = await client.get(
        f"{settings.supabase_url}/rest/v1/{path}",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {settings.supabase_anon_key}",
        },
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list):
        raise ValueError(f"Unexpected Supabase payload for {path}")
    return payload


async def fetch_cryo_lens_dataset(
    session: AsyncSession | None = None,
) -> CryoLensDatasetResponse:
    """Fetch and normalize the live cryoLens dataset from Supabase."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        (
            compounds,
            compound_synonyms,
            compound_descriptors,
            formulations,
            formulation_components,
            formulation_properties,
            papers,
            findings,
            finding_tags,
            experiments,
            measurements,
            protocols,
            solutions,
        ) = await asyncio_gather(
            _fetch_table(
                client,
                "compounds?select=id,name,abbreviation,role,description&limit=200",
            ),
            _fetch_table(
                client,
                "compound_synonyms?select=compound_id,synonym&limit=300",
            ),
            _fetch_table(
                client,
                "compound_descriptors?select=compound_id,descriptor,value,unit&limit=400",
            ),
            _fetch_table(
                client,
                "formulations?select=id,name,full_name,total_concentration,concentration_unit,description,notes,year_introduced,reference_doi&limit=200",
            ),
            _fetch_table(
                client,
                "formulation_components?select=formulation_id,compound_id,concentration,concentration_unit,role_in_formulation&limit=400",
            ),
            _fetch_table(
                client,
                "formulation_properties?select=formulation_id,property,value,unit&limit=300",
            ),
            _fetch_table(
                client,
                "papers?select=doi,title,year,journal&limit=200",
            ),
            _fetch_table(
                client,
                "findings?select=id,paper_doi,category,claim,details,tissue_type,organism,cell_type,formulation_id,temperature_c,concentration,concentration_unit,value,value_unit,confidence&limit=1000",
            ),
            _fetch_table(
                client,
                "finding_tags?select=finding_id,tag&limit=5000",
            ),
            _fetch_table(
                client,
                "experiments?select=id,solution_id,paper_doi,cell_type,organism,assay_method,temperature_c,exposure_time_min,protocol,source_location,outcome_status,notes,protocol_id&limit=500",
            ),
            _fetch_table(
                client,
                "measurements?select=experiment_id,metric,value,unit&limit=1000",
            ),
            _fetch_table(
                client,
                "protocols?select=id,name,description,viability_assay&limit=100",
            ),
            _fetch_table(
                client,
                "solutions?select=id,name,notes&limit=300",
            ),
        )

    paper_by_doi = {paper["doi"]: paper for paper in papers}
    compound_by_id = {compound["id"]: compound for compound in compounds}
    formulation_by_id = {formulation["id"]: formulation for formulation in formulations}
    protocol_by_id = {protocol["id"]: protocol for protocol in protocols}
    solution_by_id = {solution["id"]: solution for solution in solutions}

    synonyms_by_compound: dict[str, list[dict[str, object]]] = defaultdict(list)
    for synonym in compound_synonyms:
        compound_id = str(synonym["compound_id"])
        synonyms_by_compound[compound_id].append(synonym)

    descriptors_by_compound: dict[str, list[dict[str, object]]] = defaultdict(list)
    for descriptor in compound_descriptors:
        compound_id = str(descriptor["compound_id"])
        descriptors_by_compound[compound_id].append(descriptor)

    components_by_formulation: dict[str, list[dict[str, object]]] = defaultdict(list)
    for component in formulation_components:
        formulation_id = str(component["formulation_id"])
        components_by_formulation[formulation_id].append(component)

    properties_by_formulation: dict[str, list[dict[str, object]]] = defaultdict(list)
    for property_row in formulation_properties:
        formulation_id = str(property_row["formulation_id"])
        properties_by_formulation[formulation_id].append(property_row)

    tags_by_finding: dict[int, list[str]] = defaultdict(list)
    for tag in finding_tags:
        finding_id = int(tag["finding_id"])
        tags_by_finding[finding_id].append(str(tag["tag"]))

    findings_by_paper: dict[str, list[dict[str, object]]] = defaultdict(list)
    findings_by_formulation: dict[str, list[dict[str, object]]] = defaultdict(list)
    for finding in findings:
        paper_doi = str(finding["paper_doi"])
        findings_by_paper[paper_doi].append(finding)
        formulation_id = finding.get("formulation_id")
        if formulation_id is not None:
            findings_by_formulation[str(formulation_id)].append(finding)

    normalized_findings: list[CryoLensFinding] = []
    for finding in findings:
        paper = paper_by_doi.get(str(finding["paper_doi"]))
        formulation_id = finding.get("formulation_id")
        formulation = (
            formulation_by_id.get(str(formulation_id))
            if formulation_id is not None
            else None
        )
        component_names = []
        if formulation_id is not None:
            for component in components_by_formulation.get(str(formulation_id), []):
                compound = compound_by_id.get(str(component["compound_id"]))
                if compound is not None:
                    component_names.append(str(compound["name"]))

        conditions = [
            f'{finding["temperature_c"]} C' if finding.get("temperature_c") is not None else None,
            (
                f'{finding["concentration"]} {finding["concentration_unit"]}'
                if finding.get("concentration") is not None and finding.get("concentration_unit")
                else None
            ),
            str(formulation["name"]) if formulation is not None else None,
            str(finding["cell_type"]) if finding.get("cell_type") else None,
        ]

        metric_value = (
            f'{finding["value"]} {finding["value_unit"]}'
            if finding.get("value") is not None and finding.get("value_unit")
            else _humanize(str(finding["category"]))
        )

        normalized_findings.append(
            CryoLensFinding(
                id=f'finding-{finding["id"]}',
                sourceId=str(finding["paper_doi"]),
                sourceTitle=str(paper["title"]) if paper is not None else str(finding["paper_doi"]),
                tissue=str(
                    finding.get("tissue_type")
                    or finding.get("cell_type")
                    or finding.get("organism")
                    or "mixed model"
                ),
                modality=str(finding["category"]),
                metricType=str(finding["category"]),
                metricValue=metric_value,
                conditions=" | ".join([item for item in conditions if item]),
                confidence=_confidence_to_number(
                    str(finding["confidence"]) if finding.get("confidence") else None
                ),
                summary=" ".join(
                    [
                        str(finding["claim"]),
                        str(finding["details"]) if finding.get("details") else "",
                    ]
                ).strip(),
                components=component_names,
                tags=tags_by_finding[int(finding["id"])],
            )
        )

    normalized_sources: list[CryoLensSourceDocument] = []
    for paper in papers:
        linked_findings = findings_by_paper[str(paper["doi"])]
        linked_compound_ids: set[str] = set()
        for finding in linked_findings:
            formulation_id = finding.get("formulation_id")
            if formulation_id is None:
                continue
            for component in components_by_formulation.get(str(formulation_id), []):
                linked_compound_ids.add(str(component["compound_id"]))

        normalized_sources.append(
            CryoLensSourceDocument(
                id=str(paper["doi"]),
                title=str(paper["title"]),
                journal=str(paper["journal"]),
                year=int(paper["year"]),
                doi=str(paper["doi"]),
                note=str(linked_findings[0]["claim"]) if linked_findings else "Primary source in the cryoLens knowledge base.",
                abstract=" ".join(str(item["claim"]) for item in linked_findings[:2]),
                linkedFindings=len(linked_findings),
                linkedMolecules=len(linked_compound_ids),
            )
        )

    source_count_by_compound: dict[str, set[str]] = defaultdict(set)
    evidence_count_by_compound: dict[str, int] = defaultdict(int)
    for finding in findings:
        formulation_id = finding.get("formulation_id")
        if formulation_id is None:
            continue
        for component in components_by_formulation.get(str(formulation_id), []):
            compound_id = str(component["compound_id"])
            source_count_by_compound[compound_id].add(str(finding["paper_doi"]))
            evidence_count_by_compound[compound_id] += 1

    normalized_molecules: list[CryoLensMolecule] = []
    for compound in compounds:
        compound_id = str(compound["id"])
        aliases = list(
            dict.fromkeys(
                [
                    alias
                    for alias in [
                        str(compound["abbreviation"]) if compound.get("abbreviation") else None,
                        *[
                            str(entry["synonym"])
                            for entry in synonyms_by_compound.get(compound_id, [])
                        ],
                    ]
                    if alias
                ]
            )
        )
        descriptors = descriptors_by_compound.get(compound_id, [])
        unit_suffix = (
            f' {descriptors[0]["unit"]}'
            if descriptors and descriptors[0].get("unit")
            else ""
        )
        key_signal = (
            (
                f'{_humanize(str(descriptors[0]["descriptor"]))} '
                f'{descriptors[0]["value"]}{unit_suffix}'
            )
            if descriptors
            else f"{evidence_count_by_compound[compound_id]} linked findings"
        )
        normalized_molecules.append(
            CryoLensMolecule(
                id=compound_id,
                name=str(compound["name"]),
                aliases=aliases,
                className=_humanize(str(compound["role"])),
                roleHint=_humanize(str(compound["role"])),
                sourceCount=len(source_count_by_compound[compound_id]),
                evidenceCount=evidence_count_by_compound[compound_id],
                notes=str(compound["description"]) if compound.get("description") else "Imported from cryoLens compound registry.",
                keySignal=key_signal,
            )
        )

    normalized_cocktails: list[CryoLensCocktail] = []
    for formulation in formulations:
        formulation_id = str(formulation["id"])
        tissue_tags = list(
            dict.fromkeys(
                [
                    str(value).replace(" ", "_")
                    for finding in findings_by_formulation.get(formulation_id, [])
                    for value in [
                        finding.get("tissue_type"),
                        finding.get("organism"),
                        finding.get("cell_type"),
                    ]
                    if value
                ]
            )
        )[:3]
        properties = properties_by_formulation.get(formulation_id, [])
        property_summary = " · ".join(
            f'{str(item["property"]).upper()} {item["value"]} {item["unit"]}'
            for item in properties[:2]
        )
        normalized_cocktails.append(
            CryoLensCocktail(
                id=formulation_id,
                name=str(formulation["name"]),
                type="benchmark" if _is_benchmark_formulation(str(formulation["name"])) else "mixture",
                tissueTags=tissue_tags,
                notes=(
                    str(formulation["description"])
                    if formulation.get("description")
                    else str(formulation["notes"])
                    if formulation.get("notes")
                    else property_summary or "Formulation imported from cryoLens."
                ),
                components=[
                    CryoLensCocktailComponent(
                        name=str(
                            compound_by_id.get(str(component["compound_id"]), {}).get(
                                "name", component["compound_id"]
                            )
                        ),
                        role=str(
                            component.get("role_in_formulation")
                            or compound_by_id.get(str(component["compound_id"]), {}).get("role", "component")
                        ),
                        concentration=f'{component["concentration"]} {component["concentration_unit"]}',
                    )
                    for component in components_by_formulation.get(formulation_id, [])
                ],
            )
        )

    story_stats = _build_story_stats(
        formulations=formulations,
        papers=papers,
        findings=findings,
        experiments=experiments,
        findings_by_formulation=findings_by_formulation,
        components_by_formulation=components_by_formulation,
        compound_by_id=compound_by_id,
        paper_by_doi=paper_by_doi,
    )

    measurements_by_experiment: dict[int, list[dict[str, object]]] = defaultdict(list)
    for measurement in measurements:
        measurements_by_experiment[int(measurement["experiment_id"])].append(measurement)

    normalized_experiments: list[CryoLensExperimentRecord] = []
    for experiment in experiments:
        paper = paper_by_doi.get(str(experiment["paper_doi"]))
        protocol = (
            protocol_by_id.get(int(experiment["protocol_id"]))
            if experiment.get("protocol_id") is not None
            else None
        )
        solution = solution_by_id.get(int(experiment["solution_id"]))
        measurement_summary = " · ".join(
            f'{_humanize(str(item["metric"]))} {item["value"]} {item["unit"]}'
            for item in measurements_by_experiment[int(experiment["id"])][:2]
        )
        normalized_experiments.append(
            CryoLensExperimentRecord(
                id=f'experiment-{experiment["id"]}',
                title=str(solution["name"]) if solution and solution.get("name") else f'Experiment {experiment["id"]}',
                paperTitle=str(paper["title"]) if paper else str(experiment["paper_doi"]),
                assayMethod=str(
                    experiment.get("assay_method")
                    or (protocol.get("viability_assay") if protocol else None)
                    or "assay not stated"
                ),
                organism=str(experiment.get("organism") or "mixed"),
                cellType=str(experiment.get("cell_type") or "not stated"),
                temperature=(
                    f'{experiment["temperature_c"]} C'
                    if experiment.get("temperature_c") is not None
                    else "not stated"
                ),
                exposure=(
                    f'{experiment["exposure_time_min"]} min'
                    if experiment.get("exposure_time_min") is not None
                    else "not stated"
                ),
                protocolName=str(
                    (protocol.get("name") if protocol else None)
                    or experiment.get("protocol")
                    or "protocol not linked"
                ),
                outcomeStatus=str(experiment.get("outcome_status") or "measurable"),
                measurementSummary=measurement_summary or "No linked measurements",
                notes=str(
                    experiment.get("notes")
                    or (solution.get("notes") if solution else None)
                    or (protocol.get("description") if protocol else None)
                    or "Imported from cryoLens."
                ),
                sourceLocation=str(experiment["source_location"]),
            )
        )

    saved_hypotheses = await list_hypothesis_cards(session) if session is not None else []

    return CryoLensDatasetResponse(
        appStats=CryoLensStats(
            papers=len(normalized_sources),
            findings=len(normalized_findings),
            molecules=len(normalized_molecules),
            structures=len(normalized_cocktails),
        ),
        storyStats=story_stats,
        molecules=normalized_molecules,
        cocktails=normalized_cocktails,
        findings=normalized_findings,
        sources=normalized_sources,
        hypotheses=saved_hypotheses,
        experiments=normalized_experiments,
        experimentDrafts=[
            CryoLensExperimentDraft(
                id="exp-1",
                title="VS55 formamide-reduction screen",
                benchmark="VS55",
                objective="Reduce formamide burden under 4 C loading while preserving permeability support.",
                temperature="4 C",
                assay="BPAEC monolayer viability + permeability comparison",
                notes="Seed the first dry run around glycerol- and ethylene-glycol-supported variants, then rank by viability and rescue behavior.",
                nextAction="Launch dry-run planning and generate the first plate layout.",
            )
        ],
        savedPrompts=[
            "What does cryoLens know about VS55?",
            "Show high-confidence toxicity findings.",
            "Which formulations contain DMSO and ethylene glycol?",
            "What experiments were run at 4 C?",
            "Which papers discuss vitrification outcomes?",
        ],
    )


async def asyncio_gather(*coroutines: object) -> tuple[object, ...]:
    """Local async gather helper to keep this module dependency-light."""
    import asyncio

    return await asyncio.gather(*coroutines)
