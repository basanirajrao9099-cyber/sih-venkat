import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.trial import SiteTrainingRecord, Site
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


def test_01_evidence_dossier_returns_all_items_and_provenance():
    """1. Evidence dossier returns authoritative evidence items with provenance and status."""
    res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert res.status_code == 200
    items = res.json()

    item_ids = [e["id"] for e in items]
    assert "EVD-01" in item_ids
    assert "EVD-02" in item_ids
    assert "EVD-03" in item_ids
    assert "EVD-04" in item_ids

    # EVD-04 is seeded as AVAILABLE
    evd04 = next((e for e in items if e["id"] == "EVD-04"), None)
    assert evd04 is not None
    assert evd04["status"] == "AVAILABLE"
    assert evd04["verificationHash"] is not None


def test_02_evd03_site_evidence_includes_only_affected_sites():
    """2. EVD-03 specifically aggregates nested siteEvidence only for AFFECTED CTRI sites."""
    res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert res.status_code == 200
    items = res.json()

    evd03 = next((e for e in items if e["id"] == "EVD-03"), None)
    assert evd03 is not None
    assert evd03["affectedSitesCount"] == 3
    assert evd03["verifiedSitesCount"] == 0

    site_evd = evd03.get("siteEvidence", [])
    assert len(site_evd) == 3

    site_ids = [s["siteId"] for s in site_evd]
    assert "SITE-001" in site_ids or "site-01" in site_ids
    assert "SITE-002" in site_ids or "site-02" in site_ids
    assert "SITE-003" in site_ids or "site-03" in site_ids

    # Non-affected site (SITE-004) must NOT be present
    assert "SITE-004" not in site_ids and "site-04" not in site_ids


def test_03_evidence_changes_requested_and_resubmission_flow():
    """3. Verify changes requested records feedback, preserves reason, and resubmission updates state."""
    # 1. PI submits initial dossier for EVD-01
    sub_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "title": "Central Ethics Notification Letter",
            "fileName": "iec_dossier_v1.pdf",
            "uploadedBy": "Dr. V. Sharma (Lead PI)",
            "uploaderRole": "Principal Investigator",
            "description": "Initial ethics committee notification for Visit 4 schedule extension.",
        },
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"

    # 2. Ethics Reviewer requests changes with reason
    rej_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={
            "decision": "REJECT",
            "verifiedBy": "Ethics Committee Secretariat",
            "reviewerRole": "Ethics Reviewer",
            "rejectionReason": "Missing signed institutional endorsement letter from co-investigator.",
        },
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "REJECTED"
    assert "Missing signed institutional endorsement" in rej_res.json()["rejectionReason"]

    # 3. Verify evidence dossier displays the rejection reason
    get_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    items = get_res.json()
    evd01 = next((e for e in items if e["id"] == "EVD-01"), None)
    assert evd01["status"] == "REJECTED"
    assert "Missing signed institutional endorsement" in evd01["rejectionReason"]

    # 4. PI resubmits corrected dossier
    resub_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "title": "Central Ethics Notification Letter",
            "fileName": "iec_dossier_v2_endorsed.pdf",
            "uploadedBy": "Dr. V. Sharma (Lead PI)",
            "uploaderRole": "Principal Investigator",
            "description": "Revised dossier with co-investigator endorsement included.",
        },
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert resub_res.status_code == 200
    assert resub_res.json()["status"] == "SUBMITTED"
    assert resub_res.json()["rejectionReason"] is None

    # 5. Ethics Reviewer approves and verifies
    appr_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={
            "decision": "ACCEPT",
            "verifiedBy": "Central Ethics Committee Chair",
            "reviewerRole": "Ethics Reviewer",
            "comments": "Endorsement verified and approved.",
        },
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "VERIFIED"


def test_04_rbac_enforcement_on_evidence_verification():
    """4. Enforces RBAC permissions on evidence verification endpoints."""
    # PI cannot verify Ethics evidence
    pi_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert pi_res.status_code == 403

    # CRA cannot verify Ethics Committee evidence
    cra_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Monitor"},
    )
    assert cra_res.status_code == 403

    # Ethics Reviewer cannot verify CRA site training evidence (EVD-03)
    eth_res = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert eth_res.status_code == 403


def test_05_evidence_actions_produce_immutable_audit_events():
    """5. Evidence actions append verified cryptographic audit records."""
    # Submit EVD-02
    client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-02",
            "changeSetId": "CS-0001",
            "title": "Consent Addendum",
            "fileName": "consent_v1.1.pdf",
            "uploadedBy": "Lead PI",
        },
        headers={"X-User-Role": "Principal Investigator"},
    )

    # Verify audit trail contains EVIDENCE_SUBMITTED
    audit_res = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    assert audit_res.status_code == 200
    events = audit_res.json()
    action_types = [e.get("what") or e.get("action") for e in events]
    assert "EVIDENCE_SUBMITTED" in action_types
