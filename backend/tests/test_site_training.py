import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app.models.trial import SiteTrainingRecord

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state(db_session):
    """Reset compiler, audit, and site training state for clean testing."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()
    yield
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    db_session.query(SiteTrainingRecord).delete()
    db_session.commit()


def test_01_training_record_retrieval():
    """1. Training record can be retrieved in REQUIRED state initially."""
    res = client.get("/api/v1/sites/SITE-001/training?changeSetId=CS-0001")
    assert res.status_code == 200
    data = res.json()
    assert data["changeSetId"] == "CS-0001"
    assert data["status"] == "REQUIRED"
    assert data["requirementCode"] == "REQ-TRN-01"
    assert data["completedAt"] is None
    assert data["verifiedAt"] is None


def test_02_completion_changes_status_to_completed():
    """2. Completion changes status to COMPLETED and does not verify."""
    payload = {
        "changeSetId": "CS-0001",
        "completedBy": "Dr. Rajesh Gupta (Site PI)",
        "notes": "Completed GCP and amendment protocol retraining session.",
    }
    res = client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json=payload,
        headers={"X-User-Role": "Trial Coordinator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["completedBy"] == "Dr. Rajesh Gupta (Site PI)"
    assert data["completedAt"] is not None
    assert data["verifiedAt"] is None
    assert data["verifiedBy"] is None


def test_03_completed_training_can_be_retrieved():
    """3. Completed training can be retrieved again and retains COMPLETED state."""
    # Complete
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )

    # Retrieve
    res = client.get("/api/v1/sites/SITE-001/training?changeSetId=CS-0001")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["completedBy"] == "Coordinator"
    assert data["completedAt"] is not None


def test_04_verification_changes_completed_to_verified():
    """4. Verification changes COMPLETED -> VERIFIED."""
    # Complete first
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )

    # Verify as Monitor
    res = client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={
            "changeSetId": "CS-0001",
            "verifiedBy": "Monitor Jane Doe",
            "verificationNote": "Training log signatures cross-checked and verified.",
        },
        headers={"X-User-Role": "Monitor"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VERIFIED"
    assert data["verifiedBy"] == "Monitor Jane Doe"
    assert data["verifiedAt"] is not None
    assert "cross-checked" in data["verificationNote"]


def test_05_verification_before_completion_is_rejected():
    """5. Verification before completion is rejected with 400 Bad Request."""
    res = client.post(
        "/api/v1/sites/SITE-002/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res.status_code == 400
    assert "COMPLETED before verification" in res.json()["detail"]


def test_06_pi_cannot_verify():
    """6. PI cannot verify (RBAC check raises 403 Forbidden)."""
    # Complete first
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )

    # Try verify with PI role
    res = client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "PI Dr. Sharma"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_07_ethics_reviewer_cannot_verify():
    """7. ETHICS_REVIEWER cannot verify (RBAC check raises 403 Forbidden)."""
    # Complete first
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )

    # Try verify with Ethics Reviewer role
    res = client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Ethics Chair"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_08_monitor_and_admin_can_verify():
    """8. MONITOR and ADMIN can verify."""
    # Monitor verification on SITE-001
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    res_mon = client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "CRA Lead"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res_mon.status_code == 200
    assert res_mon.json()["status"] == "VERIFIED"

    # Admin verification on SITE-002
    client.post(
        "/api/v1/sites/SITE-002/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    res_adm = client.post(
        "/api/v1/sites/SITE-002/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "System Admin"},
        headers={"X-User-Role": "Admin"},
    )
    assert res_adm.status_code == 200
    assert res_adm.json()["status"] == "VERIFIED"


def test_09_completion_creates_audit_event():
    """9. Completion creates SITE_TRAINING_COMPLETED audit event."""
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator Test"},
        headers={"X-User-Role": "Trial Coordinator"},
    )

    res = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    assert res.status_code == 200
    events = res.json()
    comp_evts = [e for e in events if e["what"] == "SITE_TRAINING_COMPLETED"]
    assert len(comp_evts) >= 1
    latest = comp_evts[-1]
    assert latest["outcome"] == "COMPLETED"
    assert "SITE-01-AIIA" in latest["evidence"] or "SITE-001" in latest["evidence"] or "site-01" in latest["evidence"]


def test_10_verification_creates_audit_event():
    """10. Verification creates SITE_TRAINING_VERIFIED audit event."""
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator Test"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor Test", "verificationNote": "Checked records"},
        headers={"X-User-Role": "Monitor"},
    )

    res = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    assert res.status_code == 200
    events = res.json()
    ver_evts = [e for e in events if e["what"] == "SITE_TRAINING_VERIFIED"]
    assert len(ver_evts) >= 1
    latest = ver_evts[-1]
    assert latest["outcome"] == "VERIFIED"
    assert "Monitor Test" in latest["who"]


def test_11_existing_audit_chain_remains_valid():
    """11. Entire cryptographic audit chain remains strictly valid after training events."""
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator Test"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor Test"},
        headers={"X-User-Role": "Monitor"},
    )

    res = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert res.status_code == 200
    data = res.json()
    assert data["chainValid"] is True
    assert data["tamperDetected"] is False


def test_12_partial_sites_verified_leaves_training_pending():
    """12. Multiple impacted sites with only partial verification leaves Training readiness PENDING."""
    # Verify SITE-001 only (of 3 sites)
    client.post(
        "/api/v1/sites/SITE-001/training/complete",
        json={"changeSetId": "CS-0001", "completedBy": "Coordinator"},
        headers={"X-User-Role": "Trial Coordinator"},
    )
    client.post(
        "/api/v1/sites/SITE-001/training/verify",
        json={"changeSetId": "CS-0001", "verifiedBy": "Monitor"},
        headers={"X-User-Role": "Monitor"},
    )

    # Check readiness
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    readiness = res.json()
    assert readiness["isTrainingCompleted"] is False
    assert "Site retraining" in readiness["remainingRequirements"]

    # Training dimension should be PENDING
    dim_map = {d["name"]: d for d in readiness.get("dimensions", [])}
    training_dim = dim_map.get("Training")
    assert training_dim is not None
    assert training_dim["status"] == "PENDING"
    assert training_dim["isComplete"] is False
    assert "1 of 3" in training_dim["details"] or "pending" in training_dim["details"]


def test_13_all_sites_verified_sets_training_complete():
    """13. When all impacted sites are verified, Training readiness becomes COMPLETE."""
    site_identifiers = ["SITE-001", "SITE-002", "SITE-003"]
    for sid in site_identifiers:
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

    # Check readiness
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    readiness = res.json()
    assert readiness["isTrainingCompleted"] is True
    assert "Site retraining" not in readiness["remainingRequirements"]

    # Training dimension should be COMPLETE
    dim_map = {d["name"]: d for d in readiness.get("dimensions", [])}
    training_dim = dim_map.get("Training")
    assert training_dim is not None
    assert training_dim["status"] == "COMPLETE"
    assert training_dim["isComplete"] is True
    assert "3 of 3 sites completed" in training_dim["details"] or "All" in training_dim["details"]


def test_14_completed_not_verified_leaves_training_pending():
    """14. Sites that are COMPLETED but NOT VERIFIED keep training readiness PENDING."""
    site_identifiers = ["SITE-001", "SITE-002", "SITE-003"]
    for sid in site_identifiers:
        client.post(
            f"/api/v1/sites/{sid}/training/complete",
            json={"changeSetId": "CS-0001", "completedBy": f"Coordinator {sid}"},
            headers={"X-User-Role": "Trial Coordinator"},
        )

    # Check readiness
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    readiness = res.json()
    assert readiness["isTrainingCompleted"] is False
    assert "Site retraining" in readiness["remainingRequirements"]


def test_15_no_training_records_leaves_training_pending():
    """15. When no site training records exist, training readiness defaults to PENDING."""
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    readiness = res.json()
    assert readiness["isTrainingCompleted"] is False
    assert "Site retraining" in readiness["remainingRequirements"]


def test_16_evd_03_and_finding_f003_harmonization():
    """16. Verifying all sites synchronizes EVD-03 and resolves F-003 / OBL-03."""
    site_identifiers = ["SITE-001", "SITE-002", "SITE-003"]
    for sid in site_identifiers:
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

    # Check EVD-03
    evd_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert evd_res.status_code == 200
    evd_items = {e["id"]: e for e in evd_res.json()}
    assert evd_items["EVD-03"]["status"] == "VERIFIED"

    # Check F-003
    f_res = client.get("/api/v1/compiler/findings?changeSetId=CS-0001")
    assert f_res.status_code == 200
    findings = {f["id"]: f for f in f_res.json()}
    assert findings["F-003"]["status"] == "RESOLVED"

    # Check OBL-03
    obl_res = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001")
    assert obl_res.status_code == 200
    obligations = {o["id"]: o for o in obl_res.json()}
    assert obligations["OBL-03"]["status"] == "COMPLETED"


def test_17_other_readiness_dimensions_intact():
    """17. Dimensions other than Training (Impact, Evidence, Ethics, Compliance) remain consistent."""
    res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert res.status_code == 200
    readiness = res.json()
    dim_names = [d["name"] for d in readiness.get("dimensions", [])]
    assert "Impact" in dim_names
    assert "Evidence" in dim_names
    assert "Ethics review" in dim_names
    assert "Training" in dim_names
    assert "Compliance" in dim_names

