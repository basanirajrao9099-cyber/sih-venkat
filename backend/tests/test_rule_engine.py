import pytest
from app.rules.models import RuleDomain, FindingLevel, RuleContext
from app.rules.registry import ALL_RULES
from app.rules.evaluator import RuleEvaluator


def test_rule_registry_contains_10_rules_across_6_domains():
    """Assert all 10 concrete rules are registered and span all 6 domains."""
    assert len(ALL_RULES) == 10
    domains = {r.domain for r in ALL_RULES}
    expected_domains = {
        RuleDomain.ETHICS,
        RuleDomain.SAFETY,
        RuleDomain.REGULATORY,
        RuleDomain.DATA,
        RuleDomain.OPERATIONS,
        RuleDomain.PARTICIPANT,
    }
    assert domains == expected_domains


def test_evaluate_initial_changeset_returns_3_blocks_and_warnings():
    """
    Assert evaluating CS-0001 with default unverified evidence produces:
    - 3 BLOCK findings: F-001 (IEC), F-002 (Consent), F-003 (Site Training)
    - 1 WARNING finding: F-004 (EDC Mapping)
    Readiness status: BLOCKED.
    """
    evaluator = RuleEvaluator()
    ctx = RuleContext(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
        type="Protocol Amendment",
        previousState="Day 25–31",
        newState="Day 25–35",
        changeDescription="Visit 4 schedule: Day 25–31 → Day 25–35",
        affectedSitesCount=3,
        affectedParticipantsCount=47,
        hasIecEvidence=False,
        hasConsentAddendum=False,
        hasSiteTraining=False,
        hasEdcMapping=False,
    )

    report = evaluator.evaluate(ctx)

    assert report.readinessStatus == "BLOCKED"
    assert report.blockingCount == 3
    assert report.warningCount >= 1

    finding_ids = {f.findingId for f in report.findings}
    assert "F-001" in finding_ids
    assert "F-002" in finding_ids
    assert "F-003" in finding_ids
    assert "F-004" in finding_ids


def test_every_finding_is_explainable_and_non_black_box():
    """Assert every finding includes rule code, human-readable reason, and remediation."""
    evaluator = RuleEvaluator()
    ctx = RuleContext(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
        type="Protocol Amendment",
        changeDescription="Visit 4 schedule: Day 25–31 → Day 25–35",
        affectedSitesCount=3,
        affectedParticipantsCount=47,
        hasIecEvidence=False,
        hasConsentAddendum=False,
        hasSiteTraining=False,
        hasEdcMapping=False,
    )
    report = evaluator.evaluate(ctx)

    for f in report.findings:
        assert f.ruleCode.startswith("RULE-")
        assert len(f.title) > 0
        assert len(f.reason) > 10
        assert len(f.affectedEntity) > 0
        assert len(f.suggestedRemediation) > 10


def test_cross_trial_ripple_rule_produces_warning():
    """Assert RULE-RIPPLE-01 triggers WARNING when formulation is shared across trials."""
    evaluator = RuleEvaluator()
    ctx = RuleContext(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
        type="Protocol Amendment",
        changeDescription="Visit 4 schedule: Day 25–31 → Day 25–35",
        isSharedFormulation=True,
        sharedTrialIds=["AYU-2026-0002", "AYU-2026-0088"],
    )
    report = evaluator.evaluate(ctx)
    ripple_finding = next((f for f in report.findings if f.ruleCode == "RULE-RIPPLE-01"), None)
    assert ripple_finding is not None
    assert ripple_finding.level == FindingLevel.WARNING
    assert "AYU-2026-0002" in ripple_finding.reason


def test_sae_reporting_deadline_rule_produces_critical_block():
    """Assert RULE-SAFETY-01 triggers BLOCK when SAE reporting window is exceeded."""
    evaluator = RuleEvaluator()
    ctx = RuleContext(
        changeSetId="CS-0001",
        trialId="AYU-2026-0001",
        type="Protocol Amendment",
        changeDescription="Visit 4 schedule",
        hasOpenSae=True,
        saeDaysPending=3,
    )
    report = evaluator.evaluate(ctx)
    sae_finding = next((f for f in report.findings if f.ruleCode == "RULE-SAFETY-01"), None)
    assert sae_finding is not None
    assert sae_finding.level == FindingLevel.BLOCK
    assert sae_finding.severity == "CRITICAL"


def test_http_evaluate_endpoint(client):
    """Assert POST /api/v1/compiler/evaluate returns explainable evaluation report."""
    client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    response = client.post("/api/v1/compiler/evaluate?changeSetId=CS-0001")
    assert response.status_code == 200
    data = response.json()
    assert data["changeSetId"] == "CS-0001"
    assert data["readinessStatus"] in ["BLOCKED", "READY"]
    assert len(data["findings"]) >= 3
    assert data["evaluatedRulesCount"] == 10


def test_http_rules_catalog_endpoint(client):
    """Assert GET /api/v1/rules returns the 10 registered rules."""
    response = client.get("/api/v1/rules")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    rule_codes = [r["code"] for r in data]
    assert "RULE-ETHICS-01" in rule_codes
    assert "RULE-CONSENT-01" in rule_codes
    assert "RULE-OPS-01" in rule_codes
    assert "RULE-DATA-01" in rule_codes
    assert "RULE-RIPPLE-01" in rule_codes
    assert "RULE-SAFETY-01" in rule_codes
