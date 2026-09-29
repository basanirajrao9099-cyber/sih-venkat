import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.trial import SiteTrainingRecord, Site, Trial
from app.models.governance import ChangeSet, EvidenceItem, Finding, Obligation
from app.models.audit import AuditTrailRecord

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state(db_session):
    """Clean training state before and after each test."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()
    yield
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()


def test_01_evd03_site_level_aggregation_initial_state(db_session):
    """
    1. Initially, for CS-0001:
       - EVD-03 is the single amendment-level training evidence requirement
       - 3 affected sites are identified (AIIA New Delhi, NIA Jaipur, ITRA Jamnagar)
       - Unaffected sites are excluded from siteEvidence and denominator
       - 0 / 3 verified
       - Overall status is MISSING (or AVAILABLE if baseline preset)
    """
    res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert res.status_code == 200
    evd_items = {e["id"]: e for e in res.json()}
    
    assert "EVD-03" in evd_items
    evd_03 = evd_items["EVD-03"]
    
    assert evd_03["affectedSitesCount"] == 3
    assert evd_03["verifiedSitesCount"] == 0
    assert evd_03["siteEvidence"] is not None
    assert len(evd_03["siteEvidence"]) == 3
    
    site_names = [s["siteName"] for s in evd_03["siteEvidence"]]
    assert any("AIIA" in name or "Ayurveda" in name for name in site_names)
    
    for s in evd_03["siteEvidence"]:
        assert s["impactStatus"] == "AFFECTED"
        assert s["trainingStatus"] == "REQUIRED"
        assert s["evidenceStatus"] == "REQUIRED"
        assert s["verificationStatus"] == "PENDING"

    # Readiness check: Training is PENDING
    readiness_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert readiness_res.status_code == 200
    readiness = readiness_res.json()
    assert readiness["isTrainingCompleted"] is False
    dim_map = {d["name"]: d for d in readiness["dimensions"]}
    assert dim_map["Training"]["status"] == "PENDING"


def test_02_site_training_completion_and_partial_verification_progression(db_session):
    """
    2. Step-by-step lifecycle:
       - Complete Site 1 -> Site 1 COMPLETED, EVD-03 SUBMITTED/Awaiting review
       - Monitor verifies Site 1 -> Site 1 VERIFIED, EVD-03 1/3 verified (still SUBMITTED/Awaiting review)
       - Complete & verify Site 2 -> 2/3 verified (still SUBMITTED/Awaiting review)
       - Complete & verify Site 3 -> 3/3 verified -> EVD-03 becomes VERIFIED, Training readiness COMPLETE
    """
    # Step A: Complete Site 1 (site-01)
    comp1 = client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma (Lead PI)"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert comp1.status_code == 200
    assert comp1.json()["status"] == "COMPLETED"
    assert comp1.json()["evidenceStatus"] == "AWAITING_REVIEW"

    # Check EVD-03 after Site 1 completed
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd_03["status"] == "SUBMITTED"
    assert evd_03["verifiedSitesCount"] == 0
    s1 = next(s for s in evd_03["siteEvidence"] if s["siteId"] in ["site-01", "SITE-001"])
    assert s1["trainingStatus"] == "COMPLETED"
    assert s1["evidenceStatus"] == "AWAITING_REVIEW"

    # Step B: Monitor verifies Site 1
    ver1 = client.post(
        "/api/v1/sites/site-01/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Sarah Jenkins (CRA)", "verificationNote": "GCP certificate verified"},
        headers={"X-User-Role": "Monitor"},
    )
    assert ver1.status_code == 200
    assert ver1.json()["status"] == "VERIFIED"
    assert ver1.json()["evidenceStatus"] == "VERIFIED"

    # Check EVD-03: 1 / 3 verified
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd_03["status"] == "SUBMITTED"
    assert evd_03["verifiedSitesCount"] == 1
    assert evd_03["affectedSitesCount"] == 3

    # Step C: Complete and verify Site 2 (site-02)
    client.post(
        "/api/v1/sites/site-02/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator site-02"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    client.post(
        "/api/v1/sites/site-02/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Sarah Jenkins (CRA)"},
        headers={"X-User-Role": "Monitor"},
    )

    # Check EVD-03: 2 / 3 verified -> still SUBMITTED / Awaiting review
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd_03["status"] == "SUBMITTED"
    assert evd_03["verifiedSitesCount"] == 2
    
    # Readiness Training is still PENDING
    readiness = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001").json()
    assert readiness["isTrainingCompleted"] is False

    # Step D: Complete and verify Site 3 (site-03)
    client.post(
        "/api/v1/sites/site-03/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator site-03"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    client.post(
        "/api/v1/sites/site-03/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Sarah Jenkins (CRA)"},
        headers={"X-User-Role": "Monitor"},
    )

    # Check EVD-03: 3 / 3 verified -> VERIFIED!
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd_03["status"] == "VERIFIED"
    assert evd_03["verifiedSitesCount"] == 3
    assert evd_03["affectedSitesCount"] == 3

    # Readiness Training dimension becomes COMPLETE
    readiness = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001").json()
    assert readiness["isTrainingCompleted"] is True
    dim_map = {d["name"]: d for d in readiness["dimensions"]}
    assert dim_map["Training"]["status"] == "COMPLETE"


def test_03_changes_requested_and_resubmission_workflow(db_session):
    """
    3. Monitor requests changes for a site's training evidence:
       - Site training status becomes CHANGES_REQUESTED
       - Site evidenceStatus becomes CHANGES_REQUESTED
       - EVD-03 overall status becomes REJECTED / CHANGES_REQUESTED
       - PI resubmits training completion -> site becomes COMPLETED, EVD-03 becomes SUBMITTED
    """
    # 1. Complete training on Site 1
    client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma"},
        headers={"X-User-Role": "Principal Investigator"},
    )

    # 2. Monitor requests changes on Site 1
    reject_res = client.post(
        "/api/v1/sites/site-01/training/request-changes",
        json={
            "changeSetId": "CS-0001",
            "rejectionReason": "Missing GCP refresher signature on attendance sheet.",
            "verifiedBy": "Lead CRA Sarah",
        },
        headers={"X-User-Role": "Monitor"},
    )
    assert reject_res.status_code == 200
    trn_data = reject_res.json()
    assert trn_data["status"] == "CHANGES_REQUESTED"
    assert trn_data["evidenceStatus"] == "CHANGES_REQUESTED"
    assert trn_data["verificationStatus"] == "CHANGES_REQUESTED"
    assert "Missing GCP refresher signature" in trn_data["rejectionReason"]

    # 3. Check EVD-03 reflects changes requested
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03 = next(e for e in evd_res.json() if e["id"] == "EVD-03")
    assert evd_03["status"] == "REJECTED"
    assert evd_03["buttonText"] == "RE-SUBMIT"
    assert "Missing GCP refresher signature" in evd_03["rejectionReason"]
    s1 = next(s for s in evd_03["siteEvidence"] if s["siteId"] in ["site-01", "SITE-001"])
    assert s1["evidenceStatus"] == "CHANGES_REQUESTED"

    # 4. Coordinator / PI resubmits training completion
    resubmit_res = client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma (Lead PI)", "notes": "Resubmitted with signed GCP certificate"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert resubmit_res.status_code == 200
    assert resubmit_res.json()["status"] == "COMPLETED"

    # 5. Check EVD-03 is now back to SUBMITTED / Awaiting review
    evd_res2 = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    evd_03_2 = next(e for e in evd_res2.json() if e["id"] == "EVD-03")
    assert evd_03_2["status"] == "SUBMITTED"


def test_04_rbac_enforcement_for_site_training_and_evidence():
    """
    4. RBAC rules:
       - Coordinator & PI: complete training (200), verify training (403), request changes (403)
       - Monitor: complete training (200 if coordinator/monitor), verify training (200), request changes (200)
       - Ethics Reviewer: verify site training (403), request changes (403)
    """
    # Complete training by Coordinator
    comp_res = client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    assert comp_res.status_code == 200

    # PI attempts to verify -> 403 Forbidden
    pi_ver = client.post(
        "/api/v1/sites/site-01/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Dr. PI"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert pi_ver.status_code == 403

    # Ethics Reviewer attempts to verify site training -> 403 Forbidden
    eth_ver = client.post(
        "/api/v1/sites/site-01/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Ethics Chair"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert eth_ver.status_code == 403

    # Monitor requests changes -> 200 OK
    mon_req_change = client.post(
        "/api/v1/sites/site-01/training/request-changes",
        json={"changeSetId": "CS-0001", "rejectionReason": "Need updated log"},
        headers={"X-User-Role": "Monitor"},
    )
    assert mon_req_change.status_code == 200


def test_05_audit_trail_records_for_site_evidence_lifecycle(db_session):
    """
    5. Verify immutable audit trail contains:
       - SITE_TRAINING_COMPLETED
       - EVIDENCE_REJECTED (when changes requested)
       - SITE_TRAINING_VERIFIED
    """
    # 1. Complete training
    client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma (Lead PI)"},
        headers={"X-User-Role": "Principal Investigator"},
    )

    # 2. Request changes
    client.post(
        "/api/v1/sites/site-01/training/request-changes",
        json={"changeSetId": "CS-0001", "rejectionReason": "Attendance roster missing", "verifiedBy": "Monitor Jane"},
        headers={"X-User-Role": "Monitor"},
    )

    # 3. Resubmit
    client.post(
        "/api/v1/sites/site-01/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Dr. V. Sharma"},
        headers={"X-User-Role": "Principal Investigator"},
    )

    # 4. Verify
    client.post(
        "/api/v1/sites/site-01/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor Jane", "verificationNote": "All approved"},
        headers={"X-User-Role": "Monitor"},
    )

    # Retrieve audit log from GET /api/v1/audit/trail or db_session
    audit_res = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    assert audit_res.status_code == 200
    events = audit_res.json()
    actions = [e.get("what") for e in events]

    assert "SITE_TRAINING_COMPLETED" in actions
    assert "EVIDENCE_REJECTED" in actions
    assert "SITE_TRAINING_VERIFIED" in actions
