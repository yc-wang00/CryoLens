"""Saved hypothesis route tests."""

from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from app.api.routes import hypotheses as hypotheses_route
from app.main import app
from app.schemas.cryo_lens import CryoLensHypothesis
from app.schemas.hypotheses import HypothesisResponse


@pytest.fixture()
def client() -> AsyncIterator[TestClient]:
    """Provide a FastAPI test client with route overrides restored after each test."""
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_list_hypotheses_route(
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    """The list route should expose saved hypothesis drafts."""

    async def fake_list(session: object) -> list[CryoLensHypothesis]:
        del session
        return [
            CryoLensHypothesis(
                id="hyp-1",
                title="Lower formamide burden in VS55",
                status="draft",
                benchmark="VS55",
                target="formamide",
                summary="Reduce formamide and test glycerol support.",
                evidenceIds=["finding-1"],
                nextStep="Run a 4 C viability follow-up.",
            )
        ]

    monkeypatch.setattr(hypotheses_route, "list_hypothesis_cards", fake_list)

    response = client.get("/api/v1/hypotheses")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["title"] == "Lower formamide burden in VS55"
    assert payload[0]["benchmark"] == "VS55"


def test_create_hypothesis_route(
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    """The create route should return the saved hypothesis shape."""

    async def fake_create(session: object, payload: object) -> HypothesisResponse:
        del session
        del payload
        return HypothesisResponse(
            id="hyp-2",
            title="Increase glycerol support in VS55",
            status="prioritized",
            benchmark="VS55",
            target="formamide",
            summary="Lower formamide share and increase glycerol support at 4 C.",
            evidenceIds=["finding-1", "finding-2"],
            nextStep="Run a cold-loading viability comparison.",
        )

    monkeypatch.setattr(hypotheses_route, "create_hypothesis", fake_create)

    response = client.post(
        "/api/v1/hypotheses",
        json={
          "title": "Increase glycerol support in VS55",
          "status": "prioritized",
          "benchmark": "VS55",
          "target": "formamide",
          "summary": "Lower formamide share and increase glycerol support at 4 C.",
          "evidenceIds": ["finding-1", "finding-2"],
          "nextStep": "Run a cold-loading viability comparison.",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"] == "hyp-2"
    assert payload["evidenceIds"] == ["finding-1", "finding-2"]
