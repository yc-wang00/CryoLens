"""Live cryoLens Supabase dataset adapter for FastAPI."""

# ruff: noqa: E501

from __future__ import annotations

from collections import defaultdict

import httpx

from app.core.config import settings
from app.schemas.cryo_lens import (
    CryoLensCocktail,
    CryoLensCocktailComponent,
    CryoLensDatasetResponse,
    CryoLensExperimentDraft,
    CryoLensExperimentRecord,
    CryoLensFinding,
    CryoLensHypothesis,
    CryoLensMolecule,
    CryoLensSourceDocument,
    CryoLensStats,
)


def _humanize(value: str) -> str:
    return value.replace("_", " ")


def _confidence_to_number(value: str | None) -> float:
    if value == "medium":
        return 0.78
    if value == "low":
        return 0.58
    return 0.95


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


async def fetch_cryo_lens_dataset() -> CryoLensDatasetResponse:
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
                "formulations?select=id,name,full_name,total_concentration,concentration_unit,description,notes&limit=200",
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
                type="benchmark"
                if str(formulation["name"]).lower().startswith(("vs", "m22", "dp", "pvs", "a", "b"))
                else "mixture",
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

    return CryoLensDatasetResponse(
        appStats=CryoLensStats(
            papers=len(normalized_sources),
            findings=len(normalized_findings),
            molecules=len(normalized_molecules),
            structures=len(normalized_cocktails),
        ),
        molecules=normalized_molecules,
        cocktails=normalized_cocktails,
        findings=normalized_findings,
        sources=normalized_sources,
        hypotheses=[
            CryoLensHypothesis(
                id="hyp-1",
                title="Reduce formamide burden in VS55 under 4 C loading",
                status="prioritized",
                benchmark="VS55",
                target="formamide",
                summary="Design a VS55-like follow-up that reduces formamide burden and increases glycerol support during 4 C loading.",
                evidenceIds=["finding-1", "finding-2", "finding-3"],
                nextStep="Prototype a VS55-inspired loading study with a lower formamide share and glycerol as the primary rescue partner.",
            )
        ],
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
