import pytest
import time
from fastapi.testclient import TestClient
from app.models.user import RoleName


def test_dod_1_changeset_submission_and_compilation(client):
    """
    DoD 1: ChangeSet can be submitted and compiled.
    Asserts ChangeSet creation, storage, and execution through the full 7-step compilation pipeline.
    """
    # 1. Reset state
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # 2. Submit a distinct protocol amendment ChangeSet
    cs_payload = {
        "id": "CS-DOD-001",
        "trialId": "AYU-2026-0001",
        "title": "Protocol Amendment: Inclusion Criteria Age Expansion (18-65 -> 18-70)",
        "protocolVersion": "v1.2",
        "type": "Protocol Amendment",
        "previousState": "Age eligibility: 18–65 years",
        "newState": "Age eligibility: 18–70 years",
        "change": "Age expansion for senior cohort inclusion",
        "affectedEntities": ["Sites", "Participants", "Consent", "Ethics"],
        "effectiveDate": "2026-04-01",
        "status": "SUBMITTED",
        "created": "Today",
    }
    create_res = client.post("/api/v1/changesets", json=cs_payload)
    assert create_res.status_code in [200, 201], f"Failed to create ChangeSet: {create_res.text}"

    # 3. Verify it is persisted in the ChangeSets list
    list_res = client.get("/api/v1/changesets")
    assert list_res.status_code == 200
    cs_list = list_res.json()
    assert any(cs["id"] == "CS-DOD-001" for cs in cs_list)

    # 4. Trigger compilation run for the ChangeSet
    compile_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-DOD-001", "trialId": "AYU-2026-0001"},
    )
    assert compile_res.status_code == 200, f"Compilation failed: {compile_res.text}"
    run_data = compile_res.json()

    assert "runId" in run_data
    assert run_data["changeSetId"] == "CS-DOD-001"
    assert "pipelineSteps" in run_data
    assert len(run_data["pipelineSteps"]) >= 7
    step_names = [s["name"] for s in run_data["pipelineSteps"]]
    assert "CHANGESET" in step_names
    assert "IMPACT" in step_names
    assert "COMPILE" in step_names
    assert "RULES" in step_names
    assert "FINDINGS" in step_names
    assert "OBLIGATIONS" in step_names
    assert "READY" in step_names


def test_dod_2_rules_produce_explainable_findings(client):
    """
    DoD 2: Rules produce explainable PASS/WARNING/BLOCK findings.
    Asserts that pre-flight rules evaluation returns structured findings and each finding is
    explainable via statutory citations (ICMR/NDCT) without black-box opacity.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Evaluate canonical ChangeSet CS-0001
    eval_res = client.post("/api/v1/compiler/evaluate?changeSetId=CS-0001")
    assert eval_res.status_code == 200
    report = eval_res.json()

    assert report["readinessStatus"] == "BLOCKED"
    assert report["blockingCount"] == 3
    assert len(report["findings"]) >= 4

    # Check finding levels
    levels = {f.get("level") or f.get("type") for f in report["findings"]}
    assert "BLOCK" in levels
    assert "WARNING" in levels

    # Verify each finding has non-empty descriptions and explainable regulatory grounding
    for finding in report["findings"]:
        fid = finding.get("findingId") or finding.get("id")
        title = finding.get("title") or finding.get("ruleTitle")
        desc = finding.get("reason") or finding.get("description")
        level = finding.get("level") or finding.get("type")

        assert len(fid) > 0
        assert len(title) >= 5
        assert len(desc) >= 10
        assert level in ["BLOCK", "WARNING", "INFO"]

        # Explain via AI advisory endpoint
        explain_res = client.post(
            "/api/v1/advisory/explain-finding",
            json={"findingId": fid, "changeSetId": "CS-0001"},
        )
        assert explain_res.status_code == 200
        explanation = explain_res.json()

        assert explanation["isAdvisory"] is True
        assert len(explanation["plainEnglishExplanation"]) > 20
        assert len(explanation["statutoryCitation"]) > 5
        assert len(explanation["actionableRemediation"]) > 10
        disclaimer = explanation.get("disclaimer", "").upper()
        assert "ADVISORY" in disclaimer or "NON-BINDING" in disclaimer


def test_dod_3_findings_create_traceable_obligations(client):
    """
    DoD 3: Findings create traceable obligations.
    Asserts Finding -> Obligation -> Owner -> Deadline -> Evidence requirement lineage.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Fetch findings
    f_res = client.get("/api/v1/compiler/findings?changeSetId=CS-0001")
    assert f_res.status_code == 200
    findings = f_res.json()

    # Fetch obligations
    o_res = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001")
    assert o_res.status_code == 200
    obligations = o_res.json()
    assert len(obligations) >= 4

    # Fetch evidence checklist
    e_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001")
    assert e_res.status_code == 200
    evidence_list = e_res.json()
    assert len(evidence_list) >= 4

    # Trace each finding to an obligation and evidence requirement
    block_findings = [f for f in findings if f["type"] == "BLOCK"]
    assert len(block_findings) == 3

    for obl in obligations:
        assert obl["id"].startswith("OBL-")
        assert len(obl["obligation"]) > 5
        assert obl["owner"] in ["Regulatory", "Ethics", "Trial Operations", "Data Management", "Safety / Pharmacovigilance"]
        assert "deadline" in obl
        assert obl["status"] in ["OPEN", "COMPLETED"]

    # Verify exact mapping for canonical blockers
    obl_map = {o["id"]: o for o in obligations}
    assert "OBL-01" in obl_map
    assert obl_map["OBL-01"]["owner"] == "Regulatory"
    assert "OBL-02" in obl_map
    assert obl_map["OBL-02"]["owner"] == "Ethics"
    assert "OBL-03" in obl_map
    assert obl_map["OBL-03"]["owner"] == "Trial Operations"


def test_dod_4_evidence_submission_and_verification(client):
    """
    DoD 4: Evidence can be submitted and verified.
    Asserts submission with SHA-256 provenance, verification rejection, resubmission, and acceptance.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # 1. Submit evidence EVD-01
    submit_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "title": "IEC Notification Letter",
            "documentType": "Ethics Clearance Notice",
            "uploadedBy": "Dr. V. Sharma (Lead PI)",
            "fileName": "dossier_iec_ack.pdf",
            "checksumSha256": "0x7F9B2C1A8E3D4F5A6B7C8D9E0F1A2B3C",
        },
        headers={"X-User-Role": "PI"},
    )
    assert submit_res.status_code == 200
    evd_data = submit_res.json()
    assert evd_data["status"] == "SUBMITTED"

    # 2. Rejection cycle
    reject_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "REJECT", "comments": "Missing committee stamp on page 3"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    # Obligation and finding must remain OPEN after rejection
    obl_res = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001")
    obl1 = next(o for o in obl_res.json() if o["id"] == "OBL-01")
    assert obl1["status"] == "OPEN"

    # 3. Acceptance cycle
    accept_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Prof. Dr. S. Namboodiri"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "VERIFIED"

    # Obligation becomes COMPLETED and finding becomes RESOLVED
    obl_res2 = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001")
    obl1_after = next(o for o in obl_res2.json() if o["id"] == "OBL-01")
    assert obl1_after["status"] == "COMPLETED"

    f_res = client.get("/api/v1/compiler/findings?changeSetId=CS-0001")
    f1_after = next(f for f in f_res.json() if f["id"] == "F-001")
    assert f1_after["status"] == "RESOLVED"

    # 4. Idempotency test: duplicate ACCEPT does not error or corrupt state
    dup_res = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert dup_res.status_code == 200
    assert dup_res.json()["status"] == "VERIFIED"


def test_dod_5_readiness_calculated_by_backend_logic_only(client):
    """
    DoD 5: Readiness is calculated by backend logic only.
    Asserts that clients cannot inject, patch, or spoof readiness state.
    Even if client submits a forged payload claiming 'status: READY', the backend must strictly
    recalculate readiness from the database state.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Client attempts to spoof readiness in the request body
    forged_payload = {
        "changeSetId": "CS-0001",
        "trialId": "AYU-2026-0001",
        "readiness": {
            "status": "READY",
            "blockingFindings": 0,
            "warnings": 0,
            "evidence": "4 / 4",
        },
    }
    res = client.post("/api/v1/compiler/run", json=forged_payload)
    assert res.status_code == 200
    run_result = res.json()

    # Backend MUST reject the spoofed READY status and calculate BLOCKED
    assert run_result["status"] == "FAILED"
    assert run_result["readiness"]["status"] == "BLOCKED"
    assert run_result["readiness"]["blockingFindings"] == 3

    # Verify dedicated readiness endpoint also computes from DB only
    readiness_res = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001")
    assert readiness_res.status_code == 200
    computed_readiness = readiness_res.json()
    assert computed_readiness["status"] == "BLOCKED"
    assert computed_readiness["blockingFindings"] == 3


def test_dod_6_compilation_immutability_and_history_preserving(client):
    """
    DoD 6: Every compilation is immutable and history-preserving.
    Asserts that recompiling creates a new CompilationRun without overwriting prior runs.
    Both CMP-000128 and CMP-000129 remain independently queryable with original frozen snapshots.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # Run 1: Fails with 3 blockers
    run1_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert run1_res.status_code == 200
    run1 = run1_res.json()
    assert run1["runId"] == "CMP-000128"
    assert run1["status"] == "FAILED"
    assert run1["readiness"]["status"] == "BLOCKED"

    # Resolve all blockers
    client.post("/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Ethics Reviewer"})
    client.post("/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Ethics Reviewer"})
    client.post("/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Monitor"})

    # Run 2: Passes with 0 blockers
    run2_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert run2_res.status_code == 200
    run2 = run2_res.json()
    assert run2["runId"] == "CMP-000129"
    assert run2["status"] == "PASSED"
    assert run2["readiness"]["status"] == "READY"

    # Verify both runs are independently queryable by ID
    get_run1 = client.get("/api/v1/compiler/runs/CMP-000128")
    assert get_run1.status_code == 200
    assert get_run1.json()["status"] == "FAILED"
    assert get_run1.json()["readiness"]["status"] == "BLOCKED"

    get_run2 = client.get("/api/v1/compiler/runs/CMP-000129")
    assert get_run2.status_code == 200
    assert get_run2.json()["status"] == "PASSED"
    assert get_run2.json()["readiness"]["status"] == "READY"

    # Verify both runs appear in history list in chronological order
    runs_res = client.get("/api/v1/compiler/runs?changeSetId=CS-0001")
    assert runs_res.status_code == 200
    run_list = runs_res.json()
    run_ids = [r["runId"] for r in run_list]
    assert "CMP-000128" in run_ids
    assert "CMP-000129" in run_ids
    assert run_ids.index("CMP-000128") < run_ids.index("CMP-000129")


def test_dod_7_rbac_enforced_server_side(client):
    """
    DoD 7: RBAC is enforced server-side.
    Negative tests:
    - Unprivileged role attempting privileged action returns 403 Forbidden.
    - Role mismatch on specific evidence type returns 403 Forbidden.
    - Invalid bearer token returns 401 Unauthorized.
    """
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # 1. Unprivileged role (CRA / Monitor) attempting to verify Ethics Committee clearance (EVD-01)
    res_monitor = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res_monitor.status_code == 403
    assert "Access denied" in res_monitor.json()["detail"]

    # 2. Unprivileged role (Site Coordinator) attempting to verify Ethics clearance (EVD-02)
    res_coordinator = client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Site Coordinator"},
    )
    assert res_coordinator.status_code == 403

    # 3. Ethics Reviewer attempting to verify Site Monitor training logs (EVD-03)
    res_ethics_on_ops = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert res_ethics_on_ops.status_code == 403

    # 4. Invalid or tampered Bearer token
    res_fake_token = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.payload"},
    )
    assert res_fake_token.status_code == 401

    # 5. Correct privileged role succeeds
    res_correct_ethics = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert res_correct_ethics.status_code == 200

    res_correct_monitor = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT"},
        headers={"X-User-Role": "Monitor"},
    )
    assert res_correct_monitor.status_code == 200


def test_dod_8_ai_remains_advisory_guardrail(client, db_session):
    """
    DoD 8: AI remains advisory (retesting the 3-layer guardrail from Phase 5).
    Asserts:
    1. AI Advisory queries return isAdvisory=True and non-binding legal disclaimers.
    2. AI Advisory endpoints cannot mutate database state (findings/obligations/readiness unchanged).
    3. The default-deny SQL interception hook rejects any insert/update/delete attempted in advisory_context().
    """
    from app.guardrails.ai_guardrails import advisory_context
    from app.models.governance import Finding, Obligation

    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # 1. Query advisory summarize endpoint
    sum_res = client.post("/api/v1/advisory/summarize", json={"changeSetId": "CS-0001"})
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["isAdvisory"] is True
    assert "ADVISORY" in summary["disclaimer"].upper() or "NON-BINDING" in summary["disclaimer"].upper()

    # 2. Query advisory explain-finding endpoint
    exp_res = client.post("/api/v1/advisory/explain-finding", json={"findingId": "F-001", "changeSetId": "CS-0001"})
    assert exp_res.status_code == 200
    exp = exp_res.json()
    assert exp["isAdvisory"] is True

    # 3. Query advisory suggest-mappings endpoint
    map_res = client.post("/api/v1/advisory/suggest-mappings", json={"changeParameter": "visit_window"})
    assert map_res.status_code == 200
    sugg = map_res.json()
    assert sugg["isAdvisory"] is True

    # 4. Verify DB state is pristine (blockers still open, readiness still BLOCKED)
    readiness = client.get("/api/v1/compiler/readiness?changeSetId=CS-0001").json()
    assert readiness["status"] == "BLOCKED"
    assert readiness["blockingFindings"] == 3

    # 5. Direct adversarial code test: attempt mutation inside advisory_context()
    with pytest.raises(RuntimeError) as exc_info:
        with advisory_context():
            # Attempt to mutate a finding from inside advisory context
            finding = db_session.query(Finding).filter(Finding.id == "F-001").first()
            if finding:
                finding.status = "RESOLVED"
            db_session.flush()

    assert "CRITICAL SECURITY VIOLATION" in str(exc_info.value)
    db_session.rollback()


def test_dod_9_api_stability_repeated_calls(client):
    """
    DoD 9: APIs are stable under repeated calls (no flaky 500s).
    Rapidly fires sequential bursts to core endpoints to ensure stability, connection pooling,
    and zero transient internal server errors.
    """
    # 20 calls to /health
    for _ in range(20):
        res = client.get("/health")
        assert res.status_code == 200, f"Health check flaky: {res.status_code}"

    # 20 calls to /trials
    for _ in range(20):
        res = client.get("/api/v1/trials")
        assert res.status_code == 200, f"Trials list flaky: {res.status_code}"

    # 20 calls to /sites
    for _ in range(20):
        res = client.get("/api/v1/sites")
        assert res.status_code == 200, f"Sites list flaky: {res.status_code}"

    # 20 calls to /participants
    for _ in range(20):
        res = client.get("/api/v1/participants?trialId=AYU-2026-0001")
        assert res.status_code == 200, f"Participants query flaky: {res.status_code}"

    # 20 calls to /changesets/CS-0001/impact
    for _ in range(20):
        res = client.get("/api/v1/changesets/CS-0001/impact")
        assert res.status_code == 200, f"Impact graph flaky: {res.status_code}"

    # 10 calls to evaluate
    for _ in range(10):
        res = client.post("/api/v1/compiler/evaluate?changeSetId=CS-0001")
        assert res.status_code == 200, f"Evaluate flaky: {res.status_code}"

    # 20 calls to cryptographic audit verify
    for _ in range(20):
        res = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
        assert res.status_code == 200, f"Audit verify flaky: {res.status_code}"
        assert res.json()["chainValid"] is True
