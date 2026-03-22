"""cryoLens dataset route tests."""

from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from app.api.routes import cryo_lens as cryo_lens_route
from app.main import app
from app.schemas.cryo_lens import (
    CryoLensCocktail,
    CryoLensCocktailComponent,
    CryoLensDatasetResponse,
    CryoLensExperimentDraft,
    CryoLensExperimentRecord,
    CryoLensFinding,
    CryoLensFormulationMilestone,
    CryoLensHypothesis,
    CryoLensMolecule,
    CryoLensSourceDocument,
    CryoLensStats,
    CryoLensStoryCategory,
    CryoLensStoryStats,
    CryoLensStoryYear,
)


@pytest.fixture()
def client() -> AsyncIterator[TestClient]:
    """Provide a FastAPI test client with route overrides restored after each test."""
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _build_dataset() -> CryoLensDatasetResponse:
    return CryoLensDatasetResponse(
        appStats=CryoLensStats(papers=1, findings=1, molecules=1, structures=1),
        storyStats=CryoLensStoryStats(
            firstFormulationYear=1985,
            firstPaperYear=2025,
            lastYear=2025,
            yearly=[
                CryoLensStoryYear(
                    year=2025,
                    papers=1,
                    findings=1,
                    experiments=1,
                    cumulativePapers=1,
                    cumulativeFindings=1,
                )
            ],
            milestones=[
                CryoLensFormulationMilestone(
                    id="vs55",
                    name="VS55",
                    year=1985,
                    type="benchmark",
                    note="Benchmark milestone",
                    referenceDoi="10.1000/test",
                    referenceTitle="Test Paper",
                    linkedFindings=1,
                    components=["Dimethyl Sulfoxide"],
                )
            ],
            topFindingCategories=[
                CryoLensStoryCategory(
                    label="toxicity",
                    count=1,
                    sharePct=100.0,
                )
            ],
        ),
        molecules=[
            CryoLensMolecule(
                id="dmso",
                name="Dimethyl Sulfoxide",
                aliases=["DMSO"],
                className="penetrating",
                roleHint="penetrating",
                sourceCount=1,
                evidenceCount=1,
                notes="Test molecule",
                keySignal="1 linked finding",
            )
        ],
        cocktails=[
            CryoLensCocktail(
                id="vs55",
                name="VS55",
                type="benchmark",
                tissueTags=["kidney"],
                notes="Test cocktail",
                components=[
                    CryoLensCocktailComponent(
                        name="Dimethyl Sulfoxide",
                        role="penetrating",
                        concentration="3.1 M",
                    )
                ],
            )
        ],
        findings=[
            CryoLensFinding(
                id="finding-1",
                sourceId="10.1000/test",
                sourceTitle="Test Paper",
                tissue="kidney",
                modality="toxicity",
                metricType="viability",
                metricValue="97 percent",
                conditions="4 C | 12 mol/kg",
                confidence=0.95,
                summary="Test finding",
                components=["Dimethyl Sulfoxide"],
                tags=["viability"],
            )
        ],
        sources=[
            CryoLensSourceDocument(
                id="10.1000/test",
                title="Test Paper",
                journal="Journal",
                year=2025,
                doi="10.1000/test",
                note="Test note",
                abstract="Test abstract",
                linkedFindings=1,
                linkedMolecules=1,
            )
        ],
        hypotheses=[
            CryoLensHypothesis(
                id="hyp-1",
                title="Test hypothesis",
                status="prioritized",
                benchmark="VS55",
                target="formamide",
                summary="Test summary",
                evidenceIds=["finding-1"],
                nextStep="Run follow-up",
            )
        ],
        experiments=[
            CryoLensExperimentRecord(
                id="experiment-1",
                title="Test experiment",
                paperTitle="Test Paper",
                assayMethod="DSC",
                organism="human",
                cellType="kidney",
                temperature="4 C",
                exposure="30 min",
                protocolName="Test protocol",
                outcomeStatus="measurable",
                measurementSummary="viability 97 percent",
                notes="Test notes",
                sourceLocation="Table 1",
            )
        ],
        experimentDrafts=[
            CryoLensExperimentDraft(
                id="draft-1",
                title="Draft experiment",
                benchmark="VS55",
                objective="Test objective",
                temperature="4 C",
                assay="DSC",
                notes="Draft notes",
                nextAction="Prepare plate",
            )
        ],
        savedPrompts=["What does cryoLens know about VS55?"],
    )


def test_cryo_lens_dataset_route(
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    """The cryoLens dataset route should return the normalized backend payload."""

    async def fake_fetch(*, session: object | None = None) -> CryoLensDatasetResponse:
        del session
        return _build_dataset()

    monkeypatch.setattr(cryo_lens_route, "fetch_cryo_lens_dataset", fake_fetch)

    response = client.get("/api/v1/cryo-lens/dataset")

    assert response.status_code == 200
    payload = response.json()
    assert payload["appStats"] == {
        "papers": 1,
        "findings": 1,
        "molecules": 1,
        "structures": 1,
    }
    assert payload["molecules"][0]["name"] == "Dimethyl Sulfoxide"
    assert payload["cocktails"][0]["name"] == "VS55"
    assert payload["findings"][0]["sourceTitle"] == "Test Paper"
    assert payload["experiments"][0]["title"] == "Test experiment"
    assert payload["storyStats"]["yearly"][0]["year"] == 2025
    assert payload["storyStats"]["milestones"][0]["name"] == "VS55"
