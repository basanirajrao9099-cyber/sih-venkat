import pytest
from fastapi.testclient import TestClient


def test_master_18_step_demo_scenario_end_to_end(client: TestClient):
    """
    Master 18-Step Live Demonstration Scenario (PRD Section 46 & Shared Contract).
    Validates the entire judge-facing story start to finish:
    1. System Health Check
    2. RBAC Authentication & Session
    3. Portfolio Registry (Trial AYU-2026-0001 / ATF-001)
    4. 3 Participating Clinical Sites (AIIA, NIA, ITRA)
    5. 47 Locked Participant Cohort
    6. ChangeSet Proposal Creation (CS-0001 Visit 4 Day 25–31 -> Day 25–35)
    7. ChangeSet Docket Persistence
    8. Blast Radius Dependency Resolver (13 Impact Nodes)
    9. 10 Pre-flight Clinical Governance Rules Evaluation
    10. First Compilation Run -> CMP-000128 FAILED (3 BLOCK, 1 WARNING)
    11. Governance Findings Inspection (F-001, F-002, F-003, F-004)
    12. Actionable Obligations Assignment (OBL-01 to OBL-04)
    13. Evidence Checklist Verification (3 MISSING, 1 AVAILABLE)
    14. Advisory AI Explanation with Statutory Citations (ICMR / NDCT 2019)
    15. Regulatory Evidence Submission with SHA-256 Checksum
    16. Role-Based Evidence Verification (Ethics Reviewer / Monitor)
    17. Recompile Run -> CMP-000129 PASSED (0 BLOCK, Readiness READY)
    18. Immutable Merkle Audit Trail Verification (Genesis to Head Chain Valid)
    """

    # Reset compiler state to ensure clean test environment
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    # STEP 1: System Health Check
    step1_res = client.get("/health")
    assert step1_res.status_code == 200
    step1_data = step1_res.json()
    assert step1_data["status"] in ["healthy", "ok"]
    assert "ayu-trial fabric" in step1_data["service"].lower()

    # STEP 2: RBAC Authentication (Login as Lead PI)
    step2_res = client.post(
        "/api/v1/auth/login",
        json={"email": "pi@aiia.gov.in", "password": "AyuTrial@2026"},
    )
    assert step2_res.status_code == 200
    auth_data = step2_res.json()
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert auth_data["user"]["role"] in ["Principal Investigator", "PI"]

    # STEP 3: Clinical Trials Portfolio (Trial AYU-2026-0001 / ATF-001)
    step3_res = client.get("/api/v1/trials", headers=headers)
    assert step3_res.status_code == 200
    trials = step3_res.json()
    assert len(trials) >= 1
    demo_trial = next((t for t in trials if t["trialId"] == "AYU-2026-0001" or t["id"] == "trial-001"), None)
    assert demo_trial is not None
    assert demo_trial["phase"] == "Phase III"

    # STEP 4: Site Operations & Centers (3 Sites)
    step4_res = client.get("/api/v1/sites", headers=headers)
    assert step4_res.status_code == 200
    sites = step4_res.json()
    assert len(sites) >= 3
    site_codes = [s["siteCode"] for s in sites]
    assert any("AIIA" in c for c in site_codes)
    assert any("NIA" in c for c in site_codes)
    assert any("IPGT" in c or "ITRA" in c for c in site_codes)

    # STEP 5: Cohort Registry (47 Pseudonymized Participants)
    step5_res = client.get("/api/v1/participants?trialId=AYU-2026-0001", headers=headers)
    assert step5_res.status_code == 200
    participants = step5_res.json()
    assert len(participants) == 47
    assert all(p["participantId"].startswith("PT-") for p in participants)

    # STEP 6: ChangeSet Proposal Creation (CS-0001)
    cs_payload = {
        "id": "CS-0001",
        "trialId": "AYU-2026-0001",
        "trialName": "Randomized Double-Blind Evaluation of Standardized Ashwagandha Lehyam & Guduchi Ghanvati",
        "protocol": "v1.1",
        "type": "Protocol Amendment",
        "previousState": "Visit 4: Day 25–31",
        "newState": "Visit 4: Day 25–35",
        "change": "Visit 4 schedule: Day 25–31 → Day 25–35",
        "affectedEntities": ["Sites", "Participants", "Visit", "CRF", "EDC", "Ethics", "Training", "Consent"],
        "effectiveDate": "2026-03-15",
        "status": "SUBMITTED",
        "created": "Today",
    }
    # If already exists, GET returns it; if new, POST creates it
    step6_res = client.post("/api/v1/changesets", json=cs_payload, headers=headers)
    assert step6_res.status_code in [200, 201, 400]

    # STEP 7: ChangeSet Docket Retrieval
    step7_res = client.get("/api/v1/changesets", headers=headers)
    assert step7_res.status_code == 200
    changesets = step7_res.json()
    assert any(cs["id"] == "CS-0001" for cs in changesets)

    # STEP 8: Blast Radius Dependency Graph (13 Nodes)
    step8_res = client.get("/api/v1/changesets/CS-0001/impact", headers=headers)
    assert step8_res.status_code == 200
    impact = step8_res.json()
    assert impact["summary"]["sitesCount"] == 3
    assert impact["summary"]["participantsCount"] == 47
    assert len(impact["nodes"]) >= 13

    # STEP 9: Pre-flight Clinical Governance Rules Evaluation
    step9_res = client.post("/api/v1/compiler/evaluate?changeSetId=CS-0001", headers=headers)
    assert step9_res.status_code == 200
    eval_report = step9_res.json()
    assert eval_report["readinessStatus"] == "BLOCKED"
    assert eval_report["blockingCount"] == 3
    assert len(eval_report["findings"]) >= 4

    # STEP 10: First Compilation Run -> CMP-000128 FAILED
    step10_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
        headers=headers,
    )
    assert step10_res.status_code == 200
    run1 = step10_res.json()
    assert run1["runId"] == "CMP-000128"
    assert run1["status"] == "FAILED"
    assert run1["readiness"]["status"] == "BLOCKED"
    assert run1["readiness"]["blockingFindings"] == 3

    # STEP 11: Inspect Governance Findings (3 BLOCK, 1 WARNING)
    step11_res = client.get("/api/v1/compiler/findings?changeSetId=CS-0001", headers=headers)
    assert step11_res.status_code == 200
    findings = step11_res.json()
    assert len(findings) >= 4
    blocks = [f for f in findings if f["type"] == "BLOCK"]
    warnings = [f for f in findings if f["type"] == "WARNING"]
    assert len(blocks) == 3
    assert len(warnings) >= 1

    # STEP 12: Inspect Actionable Obligations
    step12_res = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001", headers=headers)
    assert step12_res.status_code == 200
    obligations = step12_res.json()
    assert len(obligations) >= 4
    owners = {o["owner"] for o in obligations}
    assert "Regulatory" in owners
    assert "Ethics" in owners
    assert "Trial Operations" in owners

    # STEP 13: Inspect Evidence Checklist
    step13_res = client.get("/api/v1/compiler/evidence?changeSetId=CS-0001", headers=headers)
    assert step13_res.status_code == 200
    evidence_items = step13_res.json()
    assert len(evidence_items) == 4
    evd_map = {e["id"]: e["status"] for e in evidence_items}
    assert evd_map["EVD-01"] == "MISSING"
    assert evd_map["EVD-02"] == "MISSING"
    assert evd_map["EVD-03"] == "MISSING"
    assert evd_map["EVD-04"] == "AVAILABLE"

    # STEP 14: Advisory AI Explanation with Statutory Citation
    step14_res = client.post(
        "/api/v1/advisory/explain-finding",
        json={"findingId": "F-001", "ruleId": "RULE-ETHICS-01", "detailLevel": "DETAILED"},
        headers=headers,
    )
    assert step14_res.status_code == 200
    ai_advice = step14_res.json()
    assert ai_advice["isAdvisory"] is True
    assert "ICMR" in ai_advice["statutoryCitation"] or "NDCT" in ai_advice["statutoryCitation"]
    assert len(ai_advice["actionableRemediation"]) > 10

    # STEP 15: Regulatory Evidence Submission
    step15_res = client.post(
        "/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "title": "IEC Notification Letter",
            "documentType": "Ethics Clearance Notice",
            "uploadedBy": "Dr. V. Sharma (Lead PI)",
            "fileName": "dossier_iec_ack.pdf",
            "checksumSha256": "0x7F9B2C1A8E3D",
        },
        headers={"Authorization": f"Bearer {token}", "X-User-Role": "PI"},
    )
    assert step15_res.status_code == 200
    assert step15_res.json()["status"] == "SUBMITTED"

    # STEP 16: Role-Based Evidence Verification (Ethics Reviewer for EVD-01, EVD-02; Monitor for EVD-03)
    v1 = client.post(
        "/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Prof. Dr. S. Namboodiri"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert v1.status_code == 200
    assert v1.json()["status"] == "VERIFIED"

    v2 = client.post(
        "/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Prof. Dr. S. Namboodiri"},
        headers={"X-User-Role": "Ethics Reviewer"},
    )
    assert v2.status_code == 200
    assert v2.json()["status"] == "VERIFIED"

    v3 = client.post(
        "/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001",
        json={"decision": "ACCEPT", "verifiedBy": "Dr. Rajesh K. CRA"},
        headers={"X-User-Role": "Monitor"},
    )
    assert v3.status_code == 200
    assert v3.json()["status"] == "VERIFIED"

    # STEP 17: Recompile Run -> CMP-000129 PASSED (0 BLOCK, Readiness READY)
    step17_res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
        headers=headers,
    )
    assert step17_res.status_code == 200
    run2 = step17_res.json()
    assert run2["runId"] == "CMP-000129"
    assert run2["status"] == "PASSED"
    assert run2["readiness"]["status"] == "READY"
    assert run2["readiness"]["blockingFindings"] == 0
    assert run2["readiness"]["evidence"] == "4 / 4"

    # Historical runs persistence check: both CMP-000128 & CMP-000129 persist independently
    runs_res = client.get("/api/v1/compiler/runs?changeSetId=CS-0001", headers=headers)
    assert runs_res.status_code == 200
    run_list = runs_res.json()
    historical_ids = [r["runId"] for r in run_list]
    assert "CMP-000128" in historical_ids
    assert "CMP-000129" in historical_ids

    # STEP 18: Immutable Cryptographic Audit Trail Verification
    step18_trail = client.get("/api/v1/audit/trail?changeSetId=CS-0001", headers=headers)
    assert step18_trail.status_code == 200
    events = step18_trail.json()
    assert len(events) >= 7

    step18_verify = client.get("/api/v1/audit/verify?changeSetId=CS-0001", headers=headers)
    assert step18_verify.status_code == 200
    verify_result = step18_verify.json()
    assert verify_result["chainValid"] is True
    assert verify_result["tamperDetected"] is False
    assert verify_result["totalRecords"] == len(events)
    assert verify_result["headHash"] is not None
    assert verify_result["genesisHash"] is not None
