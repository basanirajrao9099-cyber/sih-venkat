"""
Pydantic and data models for CTRI integration in Ayu-Trial Fabric.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class CTRISiteInfo(BaseModel):
    site_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    pi_name: Optional[str] = None
    ethics_committee: Optional[str] = None
    ethics_approval_status: Optional[str] = None
    target_enrollment: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class NormalizedCTRITrial(BaseModel):
    registration_number: str
    public_title: str
    scientific_title: Optional[str] = None
    study_type: Optional[str] = None
    intervention: Optional[str] = None
    condition: Optional[str] = None
    primary_objective: Optional[str] = None
    secondary_objectives: Optional[str] = None
    study_design: Optional[str] = None
    phase: Optional[str] = None
    sample_size: Optional[int] = None
    inclusion_criteria: Optional[str] = None
    exclusion_criteria: Optional[str] = None
    primary_outcomes: Optional[str] = None
    secondary_outcomes: Optional[str] = None
    sites: List[Dict[str, Any]] = Field(default_factory=list)
    sponsor: Optional[str] = None
    principal_investigator: Optional[str] = None
    status: Optional[str] = None
    registration_date: Optional[str] = None
    last_updated: Optional[str] = None
    source_url: str
    source_system: str = "CTRI"
    retrieved_at: str
    source_hash: str
    source_mode: str = "LIVE"  # "LIVE" | "FIXTURE"

    model_config = ConfigDict(from_attributes=True)


class CTRIChangeReport(BaseModel):
    changed: bool
    changed_fields: List[str] = Field(default_factory=list)
    previous_hash: Optional[str] = None
    new_hash: str
    diff: Dict[str, Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CTRITrialResponse(BaseModel):
    source: str = "CTRI"
    source_mode: str = "LIVE"  # "LIVE" | "FIXTURE"
    registration_number: str
    source_url: str
    retrieved_at: str
    trial: NormalizedCTRITrial
    version: CTRIChangeReport
    audit_event_id: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CTRIValidationError(BaseModel):
    success: bool = False
    error_code: str
    detail: str
    registration_number: Optional[str] = None
    source_system: str = "CTRI"
