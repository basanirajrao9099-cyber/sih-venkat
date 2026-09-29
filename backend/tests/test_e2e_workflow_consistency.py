import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.trial import SiteTrainingRecord
from app.models.governance import EvidenceItem, Finding, Obligation
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


def test_01_e2e_cross_screen_affected_vs_unaffected_consistency():
    """Verify that Impact, Sites, Evidence, and Readiness agree on affected vs unaffected CTRI sites."""
    # 1. Impact API
    impact_res = client.get("/api/v1/changesets/CS-0001/impact")
    assert impact_res.status_code == 200
    impact_data = impact_res.json()
    affected_in_impact = impact_data.get("affectedSites", [])
    assert len(affected_in_impact) == 3
    impact_site_ids = {s.get("siteId") or s.get("id") for s in affected_in_impact}
    assert "SITE-001" in impact_site_ids or "site-01" in impact_site_ids
    assert "SITE-002" in impact_site_ids or "site-02" in impact_site_ids
    assert "SITE-003" in impact_site_ids or "site-03" in impact_site_ids
    assert "SITE-004" not in impact_site_ids and "site-04" not in impact_site_ids

    # 2. Sites API
    sites_res = client.get("/api/v1/sites?changeSetId=CS-0001")
    assert sites_res.status_code == 200
    all_sites = sites_res.json()
    affected_in_sites = [s for s in all_sites if s.get("impactStatus") == "AFFECTED"]
    not_affected_in_sites = [s for s in all_sites if s.get("impactStatus") == "NOT_AFFECTED"]
    assert len(affected_in_sites) == 3
    assert len(not_affected_in_sites) >= 1
    assert any(s["siteId"] in ["SITE-004", "site-04"] for s in not_affected_in_sites)

    # 3. Evidence API
    evidence_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert evidence_res.status_code == 200
    evidence_items = evidence_res.json()
    evd03 = next((e for e in evidence_items if e["id"] == "EVD-03"), None)
    assert evd03 is not None
    assert evd03["affectedSitesCount"] == 3
    assert len(evd03.get("siteEvidence", [])) == 3
    evd_site_ids = {s["siteId"] for s in evd03["siteEvidence"]}
    assert "SITE-004" not in evd_site_ids and "site-04" not in evd_site_ids

    # 4. Readiness API
    readiness_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert readiness_res.status_code == 200
    readiness_data = readiness_res.json()
    blockers = readiness_data.get("blockers", [])
    training_blockers = [b for b in blockers if b["category"] == "TRAINING"]
    assert len(training_blockers) == 3
    blocker_site_ids = {b.get("siteId") for b in training_blockers}
    assert "SITE-004" not in blocker_site_ids and "site-04" not in blocker_site_ids


def test_02_e2e_state_transition_progression_0_to_3_verified():
    """Verify progressive step-by-step resolution from 0/3 -> 1/3 -> 2/3 -> 3/3 verified."""
    # Step 0: Initial state is 0/3 verified, NOT READY
    evd_res0 = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd03_0 = next(e for e in evd_res0.json() if e["id"] == "EVD-03")
    assert evd03_0["verifiedSitesCount"] == 0
    assert evd03_0["affectedSitesCount"] == 3

    # Step 1: AIIA New Delhi completed and verified -> 1/3
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma (Lead PI)"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    evd_res1 = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd03_1 = next(e for e in evd_res1.json() if e["id"] == "EVD-03")
    assert evd03_1["verifiedSitesCount"] == 1
    assert evd03_1["affectedSitesCount"] == 3

    # Step 2: NIA Jaipur completed and verified -> 2/3
    client.post(
        "/api/v1/sites/SITE-002/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. PI Jaipur"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    client.post(
        "/api/v1/sites/SITE-002/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    evd_res2 = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd03_2 = next(e for e in evd_res2.json() if e["id"] == "EVD-03")
    assert evd03_2["verifiedSitesCount"] == 2

    # Step 3: ITRA Jamnagar completed and verified -> 3/3
    client.post(
        "/api/v1/sites/SITE-003/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. PI Jamnagar"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    client.post(
        "/api/v1/sites/SITE-003/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    evd_res3 = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd03_3 = next(e for e in evd_res3.json() if e["id"] == "EVD-03")
    assert evd03_3["verifiedSitesCount"] == 3
    assert evd03_3["status"] == "VERIFIED"

    # Verify readiness reflects training dimension complete
    read_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    read_data = read_res.json()
    assert read_data["isTrainingCompleted"] is True
    train_dim = next(d for d in read_data["dimensions"] if d["name"] == "Training")
    assert train_dim["isComplete"] is True


def test_03_e2e_changes_requested_and_resubmission_across_screens():
    """Verify rejection reason propagation and resolution across Sites, Dossier, and Readiness."""
    # 1. Complete training for SITE-002 (NIA Jaipur)
    client.post(
        "/api/v1/sites/SITE-002/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. PI Jaipur"},
        headers={"X-User-Role": "Principal Investigator"},
    )

    # 2. Monitor requests changes with specific reason
    rej_reason_text = "Page 2 missing investigator signature. Attendance log incomplete."
    rej_res = client.post(
        "/api/v1/sites/SITE-002/training/request-changes",
        json={"changeSetId": "CS-0001", "rejectionReason": rej_reason_text},
        headers={"X-User-Role": "Monitor"},
    )
    assert rej_res.status_code == 200

    # 3. Check Sites endpoint
    sites_res = client.get("/api/v1/sites?changeSetId=CS-0001")
    site_02 = next(s for s in sites_res.json() if s["siteId"] in ["SITE-002", "site-02"])
    assert site_02["trainingStatus"] == "CHANGES_REQUESTED"
    assert site_02["rejectionReason"] == rej_reason_text

    # 4. Check Evidence Dossier endpoint
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd03["status"] == "REJECTED"
    site_evd_02 = next(s for s in evd03["siteEvidence"] if s["siteId"] in ["SITE-002", "site-02"])
    assert site_evd_02["trainingStatus"] == "CHANGES_REQUESTED"
    assert site_evd_02["rejectionReason"] == rej_reason_text

    # 5. Check Readiness Blockers
    read_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    read_data = read_res.json()
    assert read_data["overallState"] == "NOT READY"
    site_02_blocker = next(b for b in read_data["blockers"] if b.get("siteId") in ["SITE-002", "site-02"])
    assert site_02_blocker["status"] == "Changes requested"
    assert "Page 2 missing investigator signature" in site_02_blocker["explanation"]

    # 6. PI Resubmits training
    resub_res = client.post(
        "/api/v1/sites/SITE-002/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. PI Jaipur (Resubmitted with signatures)"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert resub_res.status_code == 200

    # 7. Monitor verifies
    ver_res = client.post(
        "/api/v1/sites/SITE-002/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    assert ver_res.status_code == 200

    # 8. Check that blocker is cleared
    read_res2 = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    read_data2 = read_res2.json()
    site_02_blocker_after = next((b for b in read_data2["blockers"] if b.get("siteId") in ["SITE-002", "site-02"]), None)
    assert site_02_blocker_after is None
