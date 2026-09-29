import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.trial import SiteTrainingRecord, Site, Trial
from app.models.governance import Finding, Obligation, EvidenceItem, CompilationRun
from app.models.audit import AuditTrailRecord

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state(db_session):
    """Clean training and compiler state before and after each test."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()
    yield
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()


def test_01_readiness_workspace_initial_not_ready_and_blockers():
    """1. Workspace reflects NOT READY with clear blockers and excluded unaffected sites."""
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "BLOCKED"
    assert data["overallState"] == "NOT READY"
    assert data["isTrainingCompleted"] is False
    assert data["isEvidenceVerified"] is False

    # Blockers must be populated
    blockers = data.get("blockers", [])
    assert len(blockers) >= 3

    # Check that affected sites are listed in training blockers
    train_blockers = [b for b in blockers if b["category"] == "TRAINING"]
    assert len(train_blockers) == 3
    site_ids = [b["siteId"] for b in train_blockers]
    assert "SITE-001" in site_ids or "site-01" in site_ids
    assert "SITE-002" in site_ids or "site-02" in site_ids
    assert "SITE-003" in site_ids or "site-03" in site_ids

    # Unaffected sites (e.g. SITE-004) must NOT be in blockers
    assert "SITE-004" not in site_ids and "site-04" not in site_ids


def test_02_readiness_workspace_changes_requested_flow():
    """2. When monitor requests changes, workspace displays Changes requested blocker with reason."""
    # Complete training for SITE-002
    client.post(
        "/api/v1/sites/SITE-002/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. PI Jaipur"},
        headers={"X-User-Role": "Principal Investigator"},
    )

    # Monitor requests changes
    rej_res = client.post(
        "/api/v1/sites/SITE-002/training/request-changes",
        json={"changeSetId": "CS-0001", "rejectionReason": "Page 2 missing investigator signature."},
        headers={"X-User-Role": "Monitor"},
    )
    assert rej_res.status_code == 200

    # Fetch readiness
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    data = res.json()
    assert data["overallState"] == "NOT READY"

    site_02_blk = next((b for b in data.get("blockers", []) if b.get("siteId") in ["SITE-002", "site-02"]), None)
    assert site_02_blk is not None
    assert site_02_blk["status"] == "Changes requested"
    assert "Page 2 missing" in site_02_blk["explanation"]


def test_03_readiness_workspace_progressive_resolution_to_ready():
    """3. As evidence and site training are verified, blockers resolve and state becomes READY."""
    # 1. Resolve EVD-01 (IEC)
    client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Ethics Committee Chair"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )

    # 2. Resolve EVD-02 (Consent)
    client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Lead Monitor"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )

    # 3. Complete and verify all 3 affected sites
    for sid in ["SITE-001", "SITE-002", "SITE-003"]:
        client.post(
            f"/api/v1/sites/{sid}/training/complete",
            json={"changeSetId": "CS-0001", "completedBy": f"Coordinator {sid}"},
            headers={"X-User-Role": "Trial Coordinator"},
        )
        client.post(
            f"/api/v1/sites/{sid}/training/verify",
            json={"changeSetId": "CS-0001", "verifiedBy": "Lead Monitor"},
            headers={"X-User-Role": "Monitor"},
        )

    # Run compiler validation
    run_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert run_res.status_code == 200

    # Fetch readiness
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    data = res.json()
    assert data["status"] == "READY"
    assert data["overallState"] == "READY"
    assert data["blockers"] == []
    assert data["isTrainingCompleted"] is True
    assert data["isEvidenceVerified"] is True


def test_04_readiness_dimensions_clean_clinical_terms():
    """4. Readiness dimensions return clean clinical terminology without artificial scores."""
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    data = res.json()

    dims = data.get("dimensions", [])
    assert len(dims) == 5
    for d in dims:
        assert "%" not in d["status"]
        assert "score" not in d["status"].lower()
        assert d["name"] in ["Impact", "Evidence", "Ethics review", "Training", "Compliance"]
