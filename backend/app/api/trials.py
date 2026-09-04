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
        system=t.system,
        phase=t.phase,
        status=t.status,
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


def map_site_to_schema(s: Site) -> TrialSiteSchema:
    return TrialSiteSchema(
        id=s.id,
        siteId=s.site_id,
        siteCode=s.site_code,
        name=s.name,
        siteName=s.site_name or s.name,
        city=s.city,
        state=s.state,
        location=s.location or f"{s.city}, {s.state}",
        piName=s.pi_name,
        investigator=s.investigator or s.pi_name,
        contactEmail=s.contact_email,
        status=s.status,
        activationStatus=s.activation_status,
        governanceStatus=s.governance_status,
        targetEnrollment=s.target_enrollment,
        currentEnrollment=s.current_enrollment,
        participants=s.participants,
        trainingPct=s.training_pct,
        documentsPct=s.documents_pct,
        iecApprovalDate=s.iec_approval_date,
        lastMonitorVisit=s.last_monitor_visit,
        openQueries=s.open_queries,
        complianceRate=s.compliance_rate,
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
