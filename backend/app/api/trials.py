from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.trial import Trial, Site
from app.models.protocol import ProtocolEndpoint, ScheduleOfAssessment
from app.schemas.trial import (
    ClinicalTrialSchema,
    FullTrialDetailSchema,
    TrialSiteSchema,
    ProtocolEndpointSchema,
    ScheduleOfAssessmentSchema,
)

router = APIRouter(prefix="/api/v1/trials", tags=["Trials"])


def map_trial_to_schema(t: Trial) -> ClinicalTrialSchema:
    return ClinicalTrialSchema(
        id=t.id,
        trialId=t.trial_id,
        protocolId=t.protocol_id,
        title=t.title,
        shortTitle=t.short_title,
        scientificTitle=getattr(t, "scientific_title", None) or t.title,
        system=t.system,
        phase=t.phase,
        status=t.status,
        studyType=getattr(t, "study_type", None) or "Interventional",
        studyDesign=getattr(t, "study_design", None) or "Randomized, Parallel Group, Active Controlled",
        healthCondition=getattr(t, "health_condition", None) or t.indication,
        intervention=getattr(t, "intervention", None) or t.formulation,
        comparator=getattr(t, "comparator", None) or "Standard of Care",
        primarySponsor=getattr(t, "primary_sponsor", None) or t.sponsor,
        secondarySponsor=getattr(t, "secondary_sponsor", None),
        recruitmentStatus=getattr(t, "recruitment_status", None) or t.status,
        firstEnrollmentDate=getattr(t, "first_enrollment_date", None) or t.start_date,
        studyDuration=getattr(t, "study_duration", None) or "12 Months",
        targetSampleSize=getattr(t, "target_sample_size", None) or t.target_enrollment,
        finalEnrollment=getattr(t, "final_enrollment", None) or t.enrolled_count,
        country=getattr(t, "country", None) or "India",
        sourceRegistry=getattr(t, "source_registry", None) or "CTRI",
        sourceUrl=getattr(t, "source_url", None) or f"https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid={t.ctri_number}",
        sourceFetchedAt=getattr(t, "source_fetched_at", None) or "2026-09-27T00:00:00Z",
        formulation=t.formulation,
        indication=t.indication,
        targetEnrollment=t.target_enrollment,
        enrolledCount=t.enrolled_count,
        activeSites=t.active_sites,
        numberOfSites=t.number_of_sites,
        numberOfParticipants=t.number_of_participants,
        recruitmentPercentage=t.recruitment_percentage,
        protocolVersion=t.protocol_version,
        startDate=t.start_date,
        estimatedEndDate=t.estimated_end_date,
        sponsor=t.sponsor,
        ctriNumber=t.ctri_number,
        piName=t.pi_name,
        leadInvestigator=t.lead_investigator,
        activeAmendment=t.active_amendment,
        budgetAllocated=t.budget_allocated,
        budgetUtilized=t.budget_utilized,
        saeCount=t.sae_count,
        description=t.description,
    )


def map_site_to_schema(s: Site, db: Optional[Session] = None, change_set_id: str = "CS-0001") -> TrialSiteSchema:
    associated_title = s.trial.title if s.trial else "AYUSH Multicenter Clinical Trial"
    ctri_no = s.trial.ctri_number if s.trial else "CTRI/2020/06/025557"
    source_link = getattr(s, "source_url", None) or (s.trial.source_url if s.trial else None) or f"https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid={ctri_no}"

    # Determine dynamic impact of active amendment on this site
    is_affected = True
    if db is not None:
        from app.services.training_service import is_site_impacted_by_changeset
        is_affected = is_site_impacted_by_changeset(s, change_set_id, db)

    impact_status = "AFFECTED" if is_affected else "NOT_AFFECTED"
    amendment_impact = "Affected" if is_affected else "Not affected"

    training_status = "REQUIRED" if is_affected else "NOT_REQUIRED"
    training_req = f"REQ-TRN-01: Protocol Amendment {change_set_id} Site Staff Retraining" if is_affected else "Not required for this amendment"
    completed_at = None
    completed_by = None
    verified_at = None
    verified_by = None
    verification_note = None

    if db is not None and is_affected:
        from app.models.trial import SiteTrainingRecord
        rec = db.query(SiteTrainingRecord).filter(
            SiteTrainingRecord.site_id == s.id,
            SiteTrainingRecord.change_set_id == change_set_id
        ).first()
        if rec:
            training_status = rec.status
            completed_at = rec.completed_at.isoformat() if rec.completed_at else None
            completed_by = rec.completed_by
            verified_at = rec.verified_at.isoformat() if rec.verified_at else None
            verified_by = rec.verified_by
            verification_note = rec.verification_note

    if not is_affected:
        training_pct = 100.0
        gov_status = "READY"
        evidence_status = "NOT_REQUIRED"
        verification_status = "NOT_REQUIRED"
        rejection_reason = None
    else:
        if training_status == "VERIFIED":
            training_pct = 100.0
            gov_status = "READY"
            evidence_status = "VERIFIED"
            verification_status = "VERIFIED"
            rejection_reason = None
        elif training_status == "COMPLETED":
            training_pct = 75.0
            gov_status = "PENDING"
            evidence_status = "AWAITING_REVIEW"
            verification_status = "PENDING"
            rejection_reason = None
        elif training_status in ["CHANGES_REQUESTED", "REJECTED"]:
            training_pct = 25.0
            gov_status = "PENDING"
            evidence_status = "CHANGES_REQUESTED"
            verification_status = "CHANGES_REQUESTED"
            rejection_reason = verification_note or "Training log requires revision."
        elif training_status == "IN_PROGRESS":
            training_pct = 40.0
            gov_status = "PENDING"
            evidence_status = "REQUIRED"
            verification_status = "PENDING"
            rejection_reason = None
        else: # REQUIRED
            training_pct = 0.0
            gov_status = "PENDING"
            evidence_status = "REQUIRED"
            verification_status = "PENDING"
            rejection_reason = None

    return TrialSiteSchema(
        id=s.id,
        siteId=s.site_id,
        siteCode=s.site_code,
        name=s.name,
        siteName=s.site_name or s.name,
        address=getattr(s, "address", None) or s.location or f"{s.city}, {s.state}",
        city=s.city,
        state=s.state,
        country=getattr(s, "country", None) or "India",
        location=s.location or f"{s.city}, {s.state}",
        piName=s.pi_name,
        investigator=s.investigator or s.pi_name,
        contactEmail=s.contact_email,
        ethicsCommittee=getattr(s, "ethics_committee", None) or f"Institutional Ethics Committee ({s.name})",
        ethicsApprovalStatus=getattr(s, "ethics_approval_status", None) or "Approved",
        recruitmentStatus=getattr(s, "recruitment_status", None) or ("Open" if s.status in ["active", "recruiting", "ACTIVE", "RECRUITING"] else "Completed"),
        associatedTrialTitle=associated_title,
        trialCtriNumber=ctri_no,
        sourceRegistry=getattr(s, "source_registry", None) or "CTRI",
        sourceUrl=source_link,
        sourceFetchedAt=getattr(s, "source_fetched_at", None) or "2026-09-27T00:00:00Z",
        status=s.status,
        activationStatus=s.activation_status,
        governanceStatus=gov_status,
        targetEnrollment=s.target_enrollment,
        currentEnrollment=s.current_enrollment,
        participants=s.participants,
        trainingPct=training_pct,
        documentsPct=s.documents_pct,
        iecApprovalDate=s.iec_approval_date,
        lastMonitorVisit=s.last_monitor_visit,
        openQueries=s.open_queries,
        complianceRate=s.compliance_rate,
        trainingStatus=training_status,
        activeAmendment=change_set_id,
        impactStatus=impact_status,
        amendmentImpact=amendment_impact,
        trainingRequirement=training_req,
        trainingCompletedAt=completed_at,
        trainingCompletedBy=completed_by,
        trainingVerifiedAt=verified_at,
        trainingVerifiedBy=verified_by,
        trainingVerificationNote=verification_note,
        evidenceStatus=evidence_status,
        verificationStatus=verification_status,
        rejectionReason=rejection_reason,
    )


@router.get("", response_model=List[ClinicalTrialSchema])
def list_trials(db: Session = Depends(get_db)):
    """List all clinical trials in the portfolio."""
    trials = db.query(Trial).all()
    return [map_trial_to_schema(t) for t in trials]


@router.get("/stats")
def get_trial_stats(db: Session = Depends(get_db)):
    """Portfolio aggregate metrics matching Part A TrialStats."""
    trials = db.query(Trial).all()
    total_trials = len(trials)
    active_trials = sum(1 for t in trials if t.status in ["active", "recruiting", "ACTIVE", "RECRUITING"])
    total_enrolled = sum(t.enrolled_count for t in trials)
    total_target = sum(t.target_enrollment for t in trials)
    active_sites = sum(t.active_sites for t in trials)
    total_sae = sum(t.sae_count for t in trials)
    rate = (total_enrolled / (total_target or 1)) * 100.0

    return {
        "totalTrials": total_trials,
        "activeTrials": active_trials,
        "totalParticipantsEnrolled": total_enrolled,
        "totalParticipantsTarget": total_target,
        "activeSites": active_sites,
        "totalSaeCount": total_sae,
        "overallRecruitmentRate": round(rate, 1),
    }


@router.get("/{identifier}", response_model=FullTrialDetailSchema)
def get_trial_by_id(identifier: str, db: Session = Depends(get_db)):
    """
    Get full trial detail by primary trial_id (e.g. 'AYU-2026-0001'),
    alias ('ATF-001'), or system id ('trial-001').
    Returns the complete nested structure Part A's dashboard expects.
    """
    trial = db.query(Trial).filter(
        or_(
            Trial.trial_id == identifier,
            Trial.alias == identifier,
            Trial.id == identifier,
        )
    ).first()

    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical Trial '{identifier}' not found",
        )

    # Fetch nested sites, endpoints, and assessments
    sites = db.query(Site).filter(Site.trial_id == trial.trial_id).all()
    endpoints = db.query(ProtocolEndpoint).filter(ProtocolEndpoint.trial_id == trial.trial_id).all()
    assessments = db.query(ScheduleOfAssessment).filter(ScheduleOfAssessment.trial_id == trial.trial_id).all()

    base_schema = map_trial_to_schema(trial)

    return FullTrialDetailSchema(
        **base_schema.model_dump(),
        sites=[map_site_to_schema(s) for s in sites],
        endpoints=[
            ProtocolEndpointSchema(
                id=ep.id,
                type=ep.type,
                description=ep.description,
                timeframe=ep.timeframe,
                measurementTool=ep.measurement_tool,
            )
            for ep in endpoints
        ],
        scheduleOfAssessments=[
            ScheduleOfAssessmentSchema(
                visitId=soa.visit_id,
                visitName=soa.visit_name,
                dayOffset=soa.day_offset,
                windowDays=soa.window_days,
                activities=soa.activities or [],
            )
            for soa in assessments
        ],
    )
