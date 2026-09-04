from typing import List, Optional
from app.rules.base import BaseRule
from app.rules.models import RuleDomain, FindingLevel, RuleFinding, RuleContext


class IECNotificationRule(BaseRule):
    code = "RULE-ETHICS-01"
    title = "IEC Notification Required"
    domain = RuleDomain.ETHICS
    default_level = FindingLevel.BLOCK
    description = "Protocol amendment affecting participant visit schedule or clinical assessments requires formal Institutional Ethics Committee notification."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if "Protocol Amendment" in ctx.type and not ctx.hasIecEvidence:
            return RuleFinding(
                findingId="F-001",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="IEC notification required",
                reason=f"Protocol amendment shifts {ctx.changeDescription} and requires ethics committee clearance before site rollout.",
                affectedEntity="Ethics (IEC)",
                severity="HIGH",
                suggestedRemediation="Upload approved IEC notification or review acknowledgement letter to resolve block.",
                obligationId="OBL-01",
            )
        return None


class ConsentAddendumRule(BaseRule):
    code = "RULE-CONSENT-01"
    title = "Consent Document Update Required"
    domain = RuleDomain.PARTICIPANT
    default_level = FindingLevel.BLOCK
    description = "Modifications affecting active participant appointment schedules or procedures require an approved Patient Information Sheet addendum."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.affectedParticipantsCount > 0 and not ctx.hasConsentAddendum:
            return RuleFinding(
                findingId="F-002",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Consent document update required",
                reason=f"{ctx.affectedParticipantsCount} active participants require informed consent addendum (e-ICF v1.1) reflecting the expanded {ctx.newState} window.",
                affectedEntity="Consent",
                severity="HIGH",
                suggestedRemediation="Submit approved Patient Information Sheet addendum for participant signature re-affirmation.",
                obligationId="OBL-02",
            )
        return None


class SiteTrainingRule(BaseRule):
    code = "RULE-OPS-01"
    title = "Site Operational Training Required"
    domain = RuleDomain.OPERATIONS
    default_level = FindingLevel.BLOCK
    description = "Clinical research coordinators and investigators across impacted sites must receive operational briefings on protocol adjustments."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.affectedSitesCount > 0 and not ctx.hasSiteTraining:
            return RuleFinding(
                findingId="F-003",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Site training required",
                reason=f"{ctx.affectedSitesCount} participating trial centers require CRC operational training on the new window rules before enrolling or scheduling visits.",
                affectedEntity=f"Sites ({ctx.affectedSitesCount})",
                severity="MEDIUM",
                suggestedRemediation="Log site training sign-off logs from All India Institute of Ayurveda, NIA Jaipur, and ITRA Jamnagar.",
                obligationId="OBL-03",
            )
        return None


class EDCMappingRule(BaseRule):
    code = "RULE-DATA-01"
    title = "EDC / CRF Schema Review"
    domain = RuleDomain.DATA
    default_level = FindingLevel.WARNING
    description = "Electronic Data Capture visit-window validation rules must be reconciled to prevent false-positive out-of-window queries."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        # Always flags as review warning until formally verified
        if not ctx.hasEdcMapping:
            return RuleFinding(
                findingId="F-004",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="EDC mapping review",
                reason=f"REDCap / OpenClinica visit date validation rule for Visit 4 must be updated to accept up to Day 35 without query generation.",
                affectedEntity="EDC Mapping",
                severity="MEDIUM",
                suggestedRemediation="Verify REDCap eCRF data entry validation schema hash: 0x8F9C2B.",
                obligationId="OBL-04",
            )
        return None


class CrossTrialRippleRule(BaseRule):
    code = "RULE-RIPPLE-01"
    title = "Cross-Trial Ripple Effect Detected"
    domain = RuleDomain.OPERATIONS
    default_level = FindingLevel.WARNING
    description = "Identifies potential collateral impact on other studies sharing formulation batches or clinical investigational sites."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.isSharedFormulation and ctx.sharedTrialIds:
            shared_list = ", ".join(ctx.sharedTrialIds)
            return RuleFinding(
                findingId="F-005",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Cross-Trial Ripple Alert",
                reason=f"Investigational formulation batch B12 is co-utilized by concurrent trial(s): {shared_list}. Human review recommended.",
                affectedEntity=f"Cross-Trial ({shared_list})",
                severity="MEDIUM",
                suggestedRemediation="Notify PIs of co-utilizing trials regarding formulation schedule modifications.",
                obligationId="OBL-05",
            )
        return None


class SAEReportingDeadlineRule(BaseRule):
    code = "RULE-SAFETY-01"
    title = "SAE Regulatory Reporting Window Expiration"
    domain = RuleDomain.SAFETY
    default_level = FindingLevel.BLOCK
    description = "ICH-GCP and NDCT 2019 mandate initial SAE reporting to Ethics Committee and Licensing Authority within strict statutory windows."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.hasOpenSae and ctx.saeDaysPending > 1:
            return RuleFinding(
                findingId="F-006",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="SAE Regulatory Deadline Critical",
                reason=f"Serious Adverse Event SAE-2026-003 pending CDSCO / Ethics submission for {ctx.saeDaysPending} days.",
                affectedEntity="Safety (SAE-2026-003)",
                severity="CRITICAL",
                suggestedRemediation="Transmit SAE expedited safety report through CDSCO SUGAM / PvPI portal.",
                obligationId="OBL-06",
            )
        return None


class SafetySignalRule(BaseRule):
    code = "RULE-SAFETY-02"
    title = "Aggregate Safety Signal Threshold"
    domain = RuleDomain.SAFETY
    default_level = FindingLevel.WARNING
    description = "Monitors recurring adverse events or MedDRA preferred terms across trials for ASU formulation safety profiling."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.hasOpenSae:
            return RuleFinding(
                findingId="F-007",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Aggregate safety signal monitoring",
                reason="Transient hepatic transaminase elevation logged across multi-center cohort requires DSMB aggregate signal review.",
                affectedEntity="Pharmacovigilance (DSMB)",
                severity="HIGH",
                suggestedRemediation="Convene DSMB safety review committee for ASU polyherbal cohort.",
                obligationId="OBL-07",
            )
        return None


class CTRIFilingRule(BaseRule):
    code = "RULE-REGULATORY-01"
    title = "CTRI Prospective Update Filing"
    domain = RuleDomain.REGULATORY
    default_level = FindingLevel.WARNING
    description = "Substantial amendments must be synchronized with the Clinical Trials Registry - India (CTRI) within 30 days of implementation."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if "Substantial" in ctx.type or "Amendment" in ctx.type:
            return RuleFinding(
                findingId="F-008",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="CTRI registration update pending",
                reason="CTRI registration CTRI/2025/11/059341 record must reflect amended visit windows.",
                affectedEntity="Regulatory (CTRI)",
                severity="MEDIUM",
                suggestedRemediation="Prepare CTRI online amendment filing dossier with revised protocol version.",
                obligationId="OBL-08",
            )
        return None


class VisitWindowBoundaryRule(BaseRule):
    code = "RULE-PARTICIPANT-01"
    title = "GCP-ASU Visit Schedule Boundary Limit"
    domain = RuleDomain.PARTICIPANT
    default_level = FindingLevel.WARNING
    description = "Checks that flexible visit windows remain within pharmacokinetic and clinical endpoint tolerance."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.proposedFlexDays > ctx.maxAllowableFlexDays:
            return RuleFinding(
                findingId="F-009",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Visit flex window exceeds standard boundary",
                reason=f"Proposed flex of +{ctx.proposedFlexDays} days exceeds recommended GCP-ASU boundary (+{ctx.maxAllowableFlexDays} days).",
                affectedEntity="Protocol (SOA)",
                severity="LOW",
                suggestedRemediation="Add statistical sensitivity analysis for out-of-window visits.",
            )
        return None


class DataQueryRateRule(BaseRule):
    code = "RULE-DATA-02"
    title = "Site Data Quality Query Rate Threshold"
    domain = RuleDomain.DATA
    default_level = FindingLevel.WARNING
    description = "Checks if unresolved data queries at affected clinical sites exceed 10% tolerance."

    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        if ctx.unresolvedQueryRate > 10.0:
            return RuleFinding(
                findingId="F-010",
                ruleCode=self.code,
                ruleTitle=self.title,
                domain=self.domain,
                level=self.default_level,
                title="Unresolved site query threshold exceeded",
                reason=f"Unresolved eCRF data queries currently at {ctx.unresolvedQueryRate}%, exceeding the 10% quality threshold.",
                affectedEntity="Data Management (Queries)",
                severity="LOW",
                suggestedRemediation="Conduct CRC data cleaning sprint prior to protocol change lock.",
            )
        return None


ALL_RULES: List[BaseRule] = [
    IECNotificationRule(),
    ConsentAddendumRule(),
    SiteTrainingRule(),
    EDCMappingRule(),
    CrossTrialRippleRule(),
    SAEReportingDeadlineRule(),
    SafetySignalRule(),
    CTRIFilingRule(),
    VisitWindowBoundaryRule(),
    DataQueryRateRule(),
]
