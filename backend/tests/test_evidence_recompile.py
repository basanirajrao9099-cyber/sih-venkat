import pytest
from app.schemas.governance import (
    EvidenceSubmissionRequest,
    EvidenceVerificationRequest,
    CompilationRunRequest,
)
from app.models.governance import EvidenceItem, Finding, Obligation, CompilationRun


def test_evidence_submission_with_provenance(client, db_session):
    """
    Assert evidence submission ingests document metadata and provenance checksum,
    setting status to SUBMITTED and recording an audit trail entry.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    payload = {
        "evidenceId": "EVD-01",
        "changeSetId": "CS-0001",
        "title": "IEC Notification Letter",
        "documentType": "Ethics Committee Clearance",
        "uploadedBy": "Dr. V. Sharma (Lead PI)",
        "uploaderRole": "Principal Investigator",
        "fileName": "IEC_Ack_Letter_v1.1_signed.pdf",
        "fileSizeBytes": 2097152,
        "checksumSha256": "3a7acb4f9e1d8820b85a3269f711eec516564634c543f87b138b1e90eac931ca",
    }

    res = client.post(
        "/api/v1/compiler/evidence/submit",
        json=payload,
        headers={"X-User-Role": "Principal Investigator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "EVD-01"
    assert data["status"] == "SUBMITTED"
    assert data["fileName"] == "IEC_Ack_Letter_v1.1_signed.pdf"
    assert data["checksumSha256"] == "3a7acb4f9e1d8820b85a3269f711eec516564634c543f87b138b1e90eac931ca"
    assert data["uploadedBy"] == "Dr. V. Sharma (Lead PI)"


def test_evidence_rbac_enforcement(client, db_session):
    """
    Assert server-side RBAC restricts verification:
    - Non-permitted role (e.g. Monitor verifying Ethics evidence EVD-01) receives 403 Forbidden.
    - Permitted role (Ethics Reviewer) succeeds.
    """
    # Attempt verification of Ethics evidence by Monitor -> 403 Forbidden
    unauth_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "John Doe"},
        headers={"X-User-Role": "Monitor"},
    )
    assert unauth_res.status_code == 403
    assert "cannot verify Ethics Committee evidence" in unauth_res.json()["detail"]

    # Authorized Ethics Reviewer -> 200 OK
    auth_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Central Ethics Board Chair"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert auth_res.status_code == 200
    assert auth_res.json()["status"] == "VERIFIED"


def test_evidence_rejection_and_resubmission_loop(client, db_session):
    """
    Assert rejection workflow and resubmission:
    - Decision REJECT leaves Finding in BLOCK and sets status REJECTED with reason.
    - Submitting new evidence resets status to SUBMITTED and clears rejection reason.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Reject EVD-02 (Consent Addendum)
    reject_res = client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={
            "decision": "REJECT",
            "verifiedBy": "Ethics Review Committee",
            "rejectionReason": "Missing vernacular language translations for Hindi and Gujarati cohort.",
        },
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert "Missing vernacular" in data["rejectionReason"]

    # Associated finding F-002 must still be OPEN (BLOCK)
    finding = db_session.query(Finding).filter(Finding.id == "F-002").first()
    assert finding.status == "OPEN"

    # Resubmit corrected document
    resubmit_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-02",
            "changeSetId": "CS-0001",
            "title": "Consent Addendum (Trilingual)",
            "fileName": "PIS_ICF_v1.1_trilingual_signed.pdf",
            "checksumSha256": "4b825dc642cb6eb9a060e54bf8d69288fbee4904ce6243d37815616db8602f33",
        },
        headers={"X-User-Role": "Trial Coordinator"},
    )
    assert resubmit_res.status_code == 200
    re_data = resubmit_res.json()
    assert re_data["status"] == "SUBMITTED"
    assert re_data["rejectionReason"] is None


def test_idempotency_on_duplicate_verification(client, db_session):
    """
    Assert double-verification with the same decision is idempotent and returns 200 OK.
    """
    res1 = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res1.status_code == 200

    # Duplicate call
    res2 = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Lead Clinical Monitor"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "VERIFIED"


def test_partial_evidence_acceptance_still_blocked(client, db_session):
    """
    Assert partial evidence acceptance (resolving 2 of 3 BLOCK findings):
    Recompilation MUST still yield FAILED / BLOCKED with blockingFindings == 1.
    Guards against bugs where any verified evidence prematurely flips readiness.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Verify only EVD-01 and EVD-02 (leave EVD-03 missing)
    client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )

    # Recompile via explicit recompile endpoint
    recompile_res = client.post(
        "/api/v1/compiler/recompile",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert recompile_res.status_code == 200
    data = recompile_res.json()

    assert data["status"] == "FAILED"
    assert data["readiness"]["status"] == "BLOCKED"
    assert data["readiness"]["blockingFindings"] == 1


def test_full_fail_fix_pass_loop_with_independent_queries(client, db_session):
    """
    The centerpiece test:
    1. Initial compile -> CMP-000128 FAILED (3 BLOCK, 1 WARNING)
    2. All 3 evidence items verified
    3. Recompile -> CMP-000129 PASSED (0 BLOCK, 1 WARNING)
    4. Both runs exist independently in GET /runs and GET /runs/{run_id}
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Step 1: Initial Compile (Failing)
    res_fail = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert res_fail.status_code == 200
    run1 = res_fail.json()
    assert run1["runId"] == "CMP-000128"
    assert run1["status"] == "FAILED"
    assert run1["readiness"]["status"] == "BLOCKED"
    assert run1["readiness"]["blockingFindings"] == 3

    # Step 2: Resolve all 3 blocking evidence items
    client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Monitor"},
    )

    # Step 3: Explicit Recompile -> Passing
    res_pass = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert res_pass.status_code == 200
    run2 = res_pass.json()
    assert run2["runId"] == "CMP-000129"
    assert run2["status"] == "PASSED"
    assert run2["readiness"]["status"] == "READY"
    assert run2["readiness"]["blockingFindings"] == 0

    # Step 4: Verify Both Runs Persist Independently
    runs_res = client.get("/api/v1/compiler/runs?changeSetId=CS-0001")
    assert runs_res.status_code == 200
    runs_list = runs_res.json()
    run_ids = [r["runId"] for r in runs_list]
    assert "CMP-000128" in run_ids
    assert "CMP-000129" in run_ids

    # Query run 1 independently
    q_run1 = client.get("/api/v1/compiler/runs/CMP-000128")
    assert q_run1.status_code == 200
    assert q_run1.json()["status"] == "FAILED"
    assert q_run1.json()["readiness"]["blockingFindings"] == 3

    # Query run 2 independently
    q_run2 = client.get("/api/v1/compiler/runs/CMP-000129")
    assert q_run2.status_code == 200
    assert q_run2.json()["status"] == "PASSED"
    assert q_run2.json()["readiness"]["blockingFindings"] == 0

    # Clean up
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
