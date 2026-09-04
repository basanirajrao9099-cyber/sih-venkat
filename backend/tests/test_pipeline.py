import pytest
from app.pipeline.dependency_resolver import dependency_resolver
from app.pipeline.obligation_generator import obligation_generator
from app.pipeline.compiler_pipeline import compiler_pipeline
from app.schemas.governance import CompilationRunRequest
from app.models.governance import Finding, Obligation, EvidenceItem, CompilationRun
from app.models.audit import AuditTrailRecord


def test_dependency_resolver_resolves_all_entities(client, db_session):
    """
    Test Step 2 of pipeline: Dependency Resolution.
    ChangeSet CS-0001 -> Blast radius resolution across:
    - 3 clinical trial sites (Site 01, Site 02, Site 03)
    - 47 total enrolled participants (18 + 15 + 14)
    - Protocol Visit 4 (Day 25-31 -> Day 25-35)
    - CRF & EDC form mapping
    - Governance entities (IEC, SOP, ICF)
    """
    impact = dependency_resolver.resolve("CS-0001", db_session)

    # Validate Summary counts matching Part A lock
    assert impact.summary.sitesCount == 3
    assert impact.summary.participantsCount == 47
    assert impact.summary.visitsCount == 1
    assert impact.summary.crfCount == 1
    assert impact.summary.edcCount == 1

    # Validate Node Graph structure
    assert len(impact.nodes) == 13
    node_ids = {n.id for n in impact.nodes}
    assert "node-visit-4" in node_ids
    assert "node-site-01" in node_ids
    assert "node-site-02" in node_ids
    assert "node-site-03" in node_ids
    assert "node-crf" in node_ids
    assert "node-edc" in node_ids
    assert "node-ethics" in node_ids
    assert "node-training" in node_ids
    assert "node-consent" in node_ids

    # Validate participant breakdown per site
    site1 = next(n for n in impact.nodes if n.id == "node-site-01")
    site2 = next(n for n in impact.nodes if n.id == "node-site-02")
    site3 = next(n for n in impact.nodes if n.id == "node-site-03")
    assert site1.meta.get("count") == 18
    assert site2.meta.get("count") == 15
    assert site3.meta.get("count") == 14


def test_obligation_generator_maps_findings_to_obligations(client, db_session):
    """
    Test Step 5 & 6 of pipeline: Obligation & Evidence Generation.
    Evaluates mapping: Finding -> Obligation -> Owner -> Deadline -> Evidence requirement.
    """
    # Ensure clean state for test isolation
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    from app.rules.models import RuleFinding, FindingLevel, RuleDomain

    test_findings = [
        RuleFinding(
            findingId="F-001",
            ruleCode="RULE-ETHICS-01",
            ruleTitle="Ethics Committee Approval Required",
            domain=RuleDomain.ETHICS,
            level=FindingLevel.BLOCK,
            title="IEC notification required",
            reason="Protocol amendment affects Visit 4 timing and requires ethics notification.",
            affectedEntity="Visit 4 Schedule",
            suggestedRemediation="Submit Amendment Notification dossier to Central Ethics Committee.",
        ),
        RuleFinding(
            findingId="F-002",
            ruleCode="RULE-ETHICS-02",
            ruleTitle="Informed Consent Amendment Required",
            domain=RuleDomain.ETHICS,
            level=FindingLevel.BLOCK,
            title="Consent document update required",
            reason="Patient Information Sheet addendum is required before implementation.",
            affectedEntity="Informed Consent Form",
            suggestedRemediation="Submit PIS/ICF v1.1 addendum reflecting extended visit window.",
        ),
    ]

    obligations, evidence = obligation_generator.generate_for_findings(
        test_findings, "CS-0001", db_session
    )

    assert len(obligations) >= 2
    assert len(evidence) >= 2

    obl_ids = {o.id for o in obligations}
    assert "OBL-01" in obl_ids
    assert "OBL-02" in obl_ids

    obl1 = next(o for o in obligations if o.id == "OBL-01")
    assert obl1.owner == "Regulatory"
    assert obl1.status == "OPEN"

    evd1 = next(e for e in evidence if e.id == "EVD-01")
    assert evd1.title == "IEC Notification Letter"
    assert evd1.status == "MISSING"


def test_compiler_pipeline_initial_execution_is_blocked(client, db_session):
    """
    Test Full Pipeline Execution (Initial Run):
    ChangeSet -> Validate -> Dependencies -> Load Rules -> Evaluate
    -> Findings -> Obligations -> Readiness.
    Since blocking findings are open, status must be FAILED / BLOCKED.
    """
    # Reset first
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")

    payload = CompilationRunRequest(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
    )
    result = compiler_pipeline.compile(payload, db_session)

    assert result.status == "FAILED"
    assert result.readiness.status == "BLOCKED"
    assert result.readiness.blockingFindings == 3
    assert result.readiness.sites == 3
    assert result.readiness.participants == 47

    # Validate pipeline steps statuses
    step_map = {s.name: s.status for s in result.pipelineSteps}
    assert step_map["CHANGESET"] == "PASSED"
    assert step_map["IMPACT"] == "PASSED"
    assert step_map["COMPILE"] == "PASSED"
    assert step_map["RULES"] == "PASSED"
    assert step_map["FINDINGS"] == "FAILED"
    assert step_map["READY"] == "PENDING"

    # Verify audit record created
    audit = db_session.query(AuditTrailRecord).filter(
        AuditTrailRecord.changeset_id == "CS-0001",
        AuditTrailRecord.status == "FAILED",
    ).first()
    assert audit is not None


def test_compiler_pipeline_execution_ready_after_evidence_resolved(client, db_session):
    """
    Test Full Pipeline Execution (Recompile after Evidence Verification):
    When all BLOCK findings are resolved (EVD-01, EVD-02, EVD-03 verified),
    the Readiness calculator must return IMPLEMENTATION READY.
    """
    # Verify all 3 blocking evidence items
    for evd_id in ["EVD-01", "EVD-02", "EVD-03"]:
        res = client.post(f"/api/v1/compiler/evidence/{evd_id}/verify?changeSetId=CS-0001")
        assert res.status_code == 200
        assert res.json()["status"] == "VERIFIED"

    # Re-run compiler
    payload = CompilationRunRequest(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
    )
    result = compiler_pipeline.compile(payload, db_session)

    assert result.status == "PASSED"
    assert result.readiness.status == "READY"
    assert result.readiness.blockingFindings == 0
    assert result.runId == "CMP-000129"
    assert result.auditHash == "0x3D7E8B1A2C4F"

    # All pipeline steps must be PASSED
    for step in result.pipelineSteps:
        assert step.status == "PASSED"

    # Reset state to leave DB clean for subsequent tests
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")



def test_changeset_impact_api_endpoint(client):
    """
    Integration checkpoint test:
    GET /api/v1/changesets/CS-0001/impact returns Part A's exact schema.
    """
    res = client.get("/api/v1/changesets/CS-0001/impact")
    assert res.status_code == 200
    data = res.json()

    assert "summary" in data
    assert "nodes" in data
    assert data["summary"]["sitesCount"] == 3
    assert data["summary"]["participantsCount"] == 47
    assert len(data["nodes"]) == 13



def test_compiler_run_api_endpoint(client):
    """
    Integration checkpoint test:
    POST /api/v1/compiler/run executes pipeline via HTTP.
    """
    res = client.post(
        "/api/v1/compiler/run",
        json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["changeSetId"] == "CS-0001"
    assert "readiness" in data
    assert "pipelineSteps" in data
