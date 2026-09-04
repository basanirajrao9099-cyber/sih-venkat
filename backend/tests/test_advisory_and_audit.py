"""
Phase 5 Comprehensive Test Suite:
1. Cryptographic Audit Trail with 'who -> what -> when -> why -> evidence -> outcome' & Merkle verification.
2. Safe Advisory AI layer (summarize, explain-finding with statutory citations, suggest-mappings).
3. Hard Default-Deny Guardrail preventing AI from mutating Finding/Obligation/Readiness state.
"""

import pytest
from sqlalchemy import text
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, get_db
from app.models.audit import AuditTrailRecord, AuditChainState
from app.models.governance import Finding, Obligation, CompilationRun, EvidenceItem
from app.guardrails.ai_guardrails import advisory_context, is_advisory_active, get_readonly_db
from app.services.audit_service import compute_record_hash, GENESIS_HASH, verify_audit_chain

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_audit_state():
    """Ensure clean compiler and audit state before and after each test."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    yield
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")


# =========================================================================
# 1. Cryptographic Audit Trail Tests ("who -> what -> when -> why -> evidence -> outcome")
# =========================================================================

def test_audit_trail_retrieval_and_full_provenance():
    """Verify GET /api/v1/audit/trail contains complete 7 fixture events with provenance fields."""
    response = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 7

    # Check EVT-001 provenance
    evt1 = events[0]
    assert evt1["id"] == "EVT-001"
    assert evt1["step"] == "STEP 1"
    assert evt1["who"] == "Dr. V. Sharma (Lead PI)"
    assert evt1["what"] == "CHANGESET_CREATED"
    assert evt1["when"] == "2026-03-04T10:14:02Z"
    assert "flex window" in evt1["why"]
    assert evt1["evidence"] == "N/A - Initial Proposal"
    assert evt1["outcome"] == "SUBMITTED"
    assert evt1["parentHash"] == GENESIS_HASH
    assert evt1["fullHash"].startswith("0x") and len(evt1["fullHash"]) == 66


def test_audit_chain_verification_intact():
    """Verify GET /api/v1/audit/verify reports chainValid=True and tamperDetected=False on untampered log."""
    response = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert response.status_code == 200
    data = response.json()
    assert data["changeSetId"] == "CS-0001"
    assert data["chainValid"] is True
    assert data["tamperDetected"] is False
    assert data["totalRecords"] >= 7
    assert data["genesisHash"] is not None
    assert data["headHash"] is not None
    assert "Cryptographic integrity confirmed" in data["message"]


def test_audit_event_appended_on_state_change():
    """Verify state-changing action appends an audit event with valid cryptographic Merkle parent link."""
    # Submit evidence EVD-01
    sub_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "uploadedBy": "Dr. V. Sharma",
            "uploaderRole": "Principal Investigator",
            "fileName": "iec_approval_doc.pdf",
            "checksumSha256": "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
        },
    )
    assert sub_res.status_code == 200

    # Check that audit trail grew
    trail_res = client.get("/api/v1/audit/trail?changeSetId=CS-0001")
    events = trail_res.json()
    latest_evt = events[-1]
    assert latest_evt["what"] == "EVIDENCE_SUBMITTED"
    assert latest_evt["who"] == "Dr. V. Sharma (Principal Investigator)"
    assert latest_evt["evidence"] == "EVD-01 (iec_approval_doc.pdf)"
    assert latest_evt["outcome"] == "SUBMITTED"

    # Verify the entire chain is still valid
    verify_res = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["chainValid"] is True
    assert v_data["tamperDetected"] is False


def test_audit_tamper_detection_pinpoints_corrupted_record(db_session):
    """Simulate manual database tampering and confirm verify_audit_chain flags it and pinpoints culprit."""
    # Corrupt description/why of EVT-003
    record = db_session.query(AuditTrailRecord).filter(AuditTrailRecord.id == "EVT-003").first()
    assert record is not None
    original_why = record.why
    record.why = "MALICIOUS TAMPER: Secretly altered compilation reason"
    db_session.commit()

    # Run verification
    verify_res = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["chainValid"] is False
    assert v_data["tamperDetected"] is True
    assert v_data["tamperDetails"] is not None
    assert len(v_data["tamperDetails"]) > 0

    tamper = v_data["tamperDetails"][0]
    assert tamper["recordId"] == "EVT-003"
    assert tamper["fieldCompromised"] == "data_integrity_hash"

    # Restore original state
    record.why = original_why
    db_session.commit()


# =========================================================================
# 2. AI Advisory Layer Tests
# =========================================================================

def test_advisory_summarize_changeset():
    """Verify POST /api/v1/advisory/summarize returns structured plain-English executive briefing."""
    res = client.post(
        "/api/v1/advisory/summarize",
        json={"changeSetId": "CS-0001", "trialId": "ATF-001", "detailLevel": "comprehensive"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["changeSetId"] == "CS-0001"
    assert "Visit 4" in data["summaryText"]
    assert len(data["impactHighlights"]) >= 3
    assert data["isAdvisory"] is True
    assert "AI-generated" in data["disclaimer"]
    assert data["sourceGrounding"] == "VERIFIED_RULE_CATALOG"
    assert data["regulatoryBasis"] == "STATUTORY_BINDING"


def test_advisory_explain_block_finding_in_plain_english():
    """
    Checkpoint: Ask the AI layer to explain a BLOCK finding in plain English.
    Confirm statutory citations (ICMR 2017) are hardcoded and non-hallucinated.
    """
    res = client.post(
        "/api/v1/advisory/explain-finding",
        json={"findingId": "F-001", "changeSetId": "CS-0001"},
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["findingId"] == "F-001"
    assert data["ruleCode"] == "RULE-ETHICS-01"
    assert data["severity"] == "HIGH"
    assert data["isAdvisory"] is True
    assert "ICMR National Ethical Guidelines" in data["statutoryCitation"]
    assert "Chapter 3" in data["statutoryCitation"]
    assert data["regulatoryBody"] == "Institutional Ethics Committee (IEC) / CDSCO Ethics Registration"
    assert data["bindingLevel"] == "STATUTORY_BINDING"
    assert "EVD-01" in data["requiredEvidenceDocument"]
    assert len(data["plainEnglishExplanation"]) > 50


def test_advisory_suggest_mappings():
    """Verify POST /api/v1/advisory/suggest-mappings recommends relevant CRFs and EDC variables."""
    res = client.post(
        "/api/v1/advisory/suggest-mappings",
        json={
            "changeParameter": "visit_window",
            "oldValue": "Day 25-31",
            "newValue": "Day 25-35",
            "trialId": "ATF-001",
        },
        headers={"X-User-Role": "Study Coordinator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["changeParameter"] == "visit_window"
    assert any("CRF-04" in f for f in data["suggestedCrfForms"])
    assert any("v4_window" in v for v in data["suggestedEdcVariables"])
    assert any("Ethics" in c for c in data["suggestedRegulatoryCheckpoints"])
    assert data["isAdvisory"] is True


def test_advisory_inquiry_logged_to_audit_trail():
    """Verify that AI advisory consultations are recorded to the append-only audit trail."""
    initial_trail = client.get("/api/v1/audit/trail?changeSetId=CS-0001").json()
    initial_count = len(initial_trail)

    # Make advisory request
    client.post(
        "/api/v1/advisory/explain-finding",
        json={"findingId": "F-002", "changeSetId": "CS-0001"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )

    updated_trail = client.get("/api/v1/audit/trail?changeSetId=CS-0001").json()
    assert len(updated_trail) == initial_count + 1
    new_evt = updated_trail[-1]
    assert new_evt["what"] == "AI_ADVISORY_QUERY"
    assert "Ethics Reviewer" in new_evt["who"]
    assert new_evt["status"] == "ADVISORY"


# =========================================================================
# 3. Hard Guardrail Enforcement Tests
# =========================================================================

def test_ai_advisory_cannot_alter_readiness_state():
    """
    Checkpoint: Confirm via a direct API test that AI advisory inquiries CANNOT alter readiness state.
    Readiness must remain BLOCKED with exactly 3 blockers before and after multiple advisory calls.
    """
    # 1. Check initial readiness
    r1 = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert r1.status_code == 200
    readiness_before = r1.json()
    assert readiness_before["status"] == "BLOCKED"
    assert readiness_before["blockingFindings"] == 3

    # 2. Invoke multiple advisory endpoints
    client.post(
        "/api/v1/advisory/summarize",
        json={"changeSetId": "CS-0001"},
    )
    client.post(
        "/api/v1/advisory/explain-finding",
        json={"findingId": "F-001", "changeSetId": "CS-0001"},
    )
    client.post(
        "/api/v1/advisory/explain-finding",
        json={"findingId": "F-002", "changeSetId": "CS-0001"},
    )
    client.post(
        "/api/v1/advisory/suggest-mappings",
        json={"changeParameter": "visit_window"},
    )

    # 3. Check readiness again - must be 100% identical and strictly BLOCKED
    r2 = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert r2.status_code == 200
    readiness_after = r2.json()
    assert readiness_after["status"] == "BLOCKED"
    assert readiness_after["blockingFindings"] == 3
    assert readiness_after["evidence"] == readiness_before["evidence"]

    # 4. Check findings in database - all 3 must remain OPEN
    findings_res = client.get("/api/v1/compiler/findings?changeSetId=CS-0001")
    open_blocks = [f for f in findings_res.json() if f["type"] == "BLOCK" and f["status"] == "OPEN"]
    assert len(open_blocks) == 3


def test_advisory_context_default_deny_guardrail_raises_on_mutation(db_session):
    """
    Adversarial test: Directly test the SQLAlchemy before_flush default-deny guardrail.
    Attempting ANY write inside advisory_context() must raise RuntimeError.
    """
    with advisory_context():
        assert is_advisory_active() is True
        # Attempt to secretly mutate a Finding
        finding = db_session.query(Finding).first()
        if finding:
            finding.status = "RESOLVED"
        else:
            db_session.add(Finding(id="F-HACK", changeset_id="CS-0001", type="BLOCK", title="Hack", status="RESOLVED"))

        # Must raise RuntimeError via default-deny interceptor
        with pytest.raises(RuntimeError) as exc_info:
            db_session.flush()

        assert "CRITICAL SECURITY VIOLATION: Advisory AI layer attempted to mutate state" in str(exc_info.value)
        db_session.rollback()


def test_get_readonly_db_dialect_support():
    """Verify get_readonly_db yields a connected session with dialect-appropriate read-only setup."""
    db_gen = get_readonly_db()
    session = next(db_gen)
    assert session is not None
    # Ensure session can perform queries
    result = session.execute(text("SELECT 1")).scalar()
    assert result == 1
    session.close()
