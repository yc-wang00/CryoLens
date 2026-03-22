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
    CryoLensHypothesis,
    CryoLensMolecule,
    CryoLensSourceDocument,
    CryoLensStats,
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

    async def fake_fetch() -> CryoLensDatasetResponse:
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
