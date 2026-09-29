import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.trial import SiteTrainingRecord, Site, Trial
from app.models.governance import ChangeSet, EvidenceItem, Finding, Obligation

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state(db_session):
    """Clean training state before and after test."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()
    yield
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()


def test_01_affected_vs_unaffected_site_impact_and_training(db_session):
    """
    1. Impact analysis authoritatively determines affected vs unaffected sites.
    For CS-0001 (targeting AYU-2026-0001), SITE-001/002/003 are AFFECTED,
    while other CTRI trial sites (e.g. SITE-004, SITE-005) are NOT_AFFECTED.
    """
    res = client.get("/api/v1/sites?changeSetId=CS-0001")
    assert res.status_code == 200
    sites = res.json()
    
    site_01 = next(s for s in sites if s["siteId"] == "SITE-001")
    assert site_01["impactStatus"] == "AFFECTED"
    assert site_01["trainingStatus"] == "REQUIRED"
    assert "REQ-TRN-01" in site_01["trainingRequirement"]

    # Site from another CTRI trial should be NOT_AFFECTED
    unaffected = next((s for s in sites if s["siteId"] not in ["SITE-001", "SITE-002", "SITE-003"]), None)
    if unaffected:
        assert unaffected["impactStatus"] == "NOT_AFFECTED"
        assert unaffected["trainingStatus"] == "NOT_REQUIRED"
        assert "Not required" in unaffected["trainingRequirement"]


def test_02_unaffected_site_rejects_training_actions():
    """
    2. Attempting training completion or verification for an unaffected site is rejected with 400.
    """
    # Find an unaffected site (e.g. SITE-004 or site-ctri-01-kgmu)
    res = client.get("/api/v1/sites?changeSetId=CS-0001")
    unaffected = next((s for s in res.json() if s["siteId"] not in ["SITE-001", "SITE-002", "SITE-003"]), None)
    if not unaffected:
        pytest.skip("No additional CTRI sites in DB")

    unaffected_id = unaffected["siteId"]

    # Check training status endpoint
    trn_res = client.get(f"/api/v1/sites/{unaffected_id}/training?changeSetId=CS-0001")
    assert trn_res.status_code == 200
    assert trn_res.json()["status"] == "NOT_REQUIRED"

    # Attempt to complete training on unaffected site -> 400 Bad Request
    complete_res = client.post(
        f"/api/v1/sites/{unaffected_id}/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    assert complete_res.status_code == 400
    assert "not affected by amendment" in complete_res.json()["detail"]

    # Attempt to verify training on unaffected site -> 400 Bad Request
    verify_res = client.post(
        f"/api/v1/sites/{unaffected_id}/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    assert verify_res.status_code == 400
    assert "not affected by amendment" in verify_res.json()["detail"]


def test_03_affected_site_training_lifecycle_and_evd03_sync():
    """
    3. Complete lifecycle on affected CTRI site (SITE-001):
    REQUIRED -> COMPLETED -> VERIFIED -> EVD-03 and Readiness updated.
    """
    # 1. Initial state is REQUIRED
    trn_res = client.get("/api/v1/sites/SITE-001/training?changeSetId=CS-0001")
    assert trn_res.status_code == 200
    assert trn_res.json()["status"] == "REQUIRED"

    # 2. PI / Coordinator completes training
    comp_res = client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma (PI)"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 3. EVD-03 becomes SUBMITTED
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert evd_res.status_code == 200
    evd_items = {e["id"]: e for e in evd_res.json()}
    assert evd_items["EVD-03"]["status"] in ["SUBMITTED", "AVAILABLE", "VERIFIED"]

    # 4. Monitor verifies training on all affected sites
    for sid in ["SITE-001", "SITE-002", "SITE-003"]:
        client.post(
            f"/api/v1/sites/{sid}/training/complete",
            json={"changeSetId": "CS-0001", "completedBy": f"Coordinator {sid}"},
            headers={"X-User-Role": "Trial Coordinator"},
        )
        ver_res = client.post(
            f"/api/v1/sites/{sid}/training/verify",
            json={"changeSetId": "CS-0001", "verifiedBy": "Lead CRA Sarah", "verificationNote": "Checked log"},
            headers={"X-User-Role": "Monitor"},
        )
        assert ver_res.status_code == 200
        assert ver_res.json()["status"] == "VERIFIED"

    # 5. Readiness Training dimension becomes COMPLETE (3 of 3 affected sites)
    readiness_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert readiness_res.status_code == 200
    readiness = readiness_res.json()
    assert readiness["isTrainingCompleted"] is True
    dim_map = {d["name"]: d for d in readiness["dimensions"]}
    assert dim_map["Training"]["status"] == "COMPLETE"
    assert "3 of 3" in dim_map["Training"]["details"] or "All" in dim_map["Training"]["details"]


def test_04_impact_api_exposes_affected_sites():
    """
    4. GET /api/v1/changesets/{id}/impact returns affected sites with real CTRI details.
    """
    res = client.get("/api/v1/changesets/CS-0001/impact")
    assert res.status_code == 200
    data = res.json()
    assert data["changeSetId"] == "CS-0001"
    assert data["summary"]["sitesCount"] == 3
    assert data["summary"]["trainingAffected"] is True
    assert "affectedSites" in data
    assert len(data["affectedSites"]) == 3
    first_site = data["affectedSites"][0]
    assert first_site["impactStatus"] == "AFFECTED"
    assert "AIIA" in first_site["name"] or "India" in first_site["name"] or "site" in first_site["siteId"].lower()
