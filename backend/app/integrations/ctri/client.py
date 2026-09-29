"""
Production-grade, read-only CTRI Connector for Ayu-Trial Fabric.
Retrieves public clinical trial metadata from the Clinical Trials Registry - India (CTRI).
Includes strict SSRF defenses, timeouts, normalization, deterministic hashing, and change detection.
"""

import re
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
import urllib.request
import urllib.error

from app.integrations.ctri.models import (
    NormalizedCTRITrial,
    CTRIChangeReport,
    CTRITrialResponse,
)
from app.integrations.ctri.parser import parse_ctri_html
from app.services.ctri_ingestion import CTRI_DATASET

logger = logging.getLogger("ayu_trial_fabric.ctri_client")

# Strict regex matching official CTRI registration numbers (e.g., CTRI/2020/06/025557)
CTRI_REG_PATTERN = re.compile(r"^CTRI[/_-](\d{4})[/_-](\d{2,3})[/_-](\d{5,7})$", re.IGNORECASE)

# Allowed public base URL for CTRI queries (Strict SSRF prevention)
CTRI_BASE_HOST = "ctri.nic.in"
CTRI_DETAILS_URL_TEMPLATE = "https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid={reg_number}"


class CTRIConnectorException(Exception):
    """Base exception for CTRI connector errors."""
    def __init__(self, error_code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.status_code = status_code


class CTRIConnector:
    """
    Read-only public integration connector for Clinical Trials Registry - India.
    """

    def __init__(self, timeout_seconds: float = 8.0, max_retries: int = 2):
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    @staticmethod
    def validate_registration_number(registration_number: str) -> str:
        """
        Validate and canonicalize CTRI registration number.
        Returns standard format: CTRI/YYYY/MM/XXXXXX or raises CTRIConnectorException.
        """
        if not registration_number or not isinstance(registration_number, str):
            raise CTRIConnectorException(
                error_code="INVALID_REGISTRATION_NUMBER",
                message="CTRI registration number cannot be empty.",
                status_code=400,
            )

        cleaned = registration_number.strip().upper()
        match = CTRI_REG_PATTERN.match(cleaned)
        if not match:
            raise CTRIConnectorException(
                error_code="INVALID_REGISTRATION_NUMBER",
                message=(
                    f"'{registration_number}' is not a valid CTRI registration number format. "
                    "Expected format: CTRI/YYYY/MM/XXXXXX (e.g. CTRI/2020/06/025557)."
                ),
                status_code=400,
            )

        year, month, seq = match.groups()
        return f"CTRI/{year}/{month}/{seq}"

    @staticmethod
    def compute_source_hash(trial_dict: Dict[str, Any]) -> str:
        """
        Compute deterministic SHA-256 hash over canonical normalized trial fields.
        Excludes volatile timestamps (retrieved_at, source_fetched_at).
        """
        hashable_fields = {
            "registration_number": trial_dict.get("registration_number"),
            "public_title": trial_dict.get("public_title"),
            "scientific_title": trial_dict.get("scientific_title"),
            "study_type": trial_dict.get("study_type"),
            "intervention": trial_dict.get("intervention"),
            "condition": trial_dict.get("condition"),
            "primary_objective": trial_dict.get("primary_objective"),
            "secondary_objectives": trial_dict.get("secondary_objectives"),
            "study_design": trial_dict.get("study_design"),
            "phase": trial_dict.get("phase"),
            "sample_size": trial_dict.get("sample_size"),
            "inclusion_criteria": trial_dict.get("inclusion_criteria"),
            "exclusion_criteria": trial_dict.get("exclusion_criteria"),
            "primary_outcomes": trial_dict.get("primary_outcomes"),
            "secondary_outcomes": trial_dict.get("secondary_outcomes"),
            "sponsor": trial_dict.get("sponsor"),
            "principal_investigator": trial_dict.get("principal_investigator"),
            "status": trial_dict.get("status"),
            "registration_date": trial_dict.get("registration_date"),
        }
        canonical_json = json.dumps(hashable_fields, sort_keys=True, default=str)
        digest = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        return f"0x{digest.upper()}"

    def fetch_live_trial(self, canonical_reg_num: str) -> Optional[NormalizedCTRITrial]:
        """
        Fetch public trial page via HTTP GET with timeout, retries, and SSRF restrictions.
        """
        target_url = CTRI_DETAILS_URL_TEMPLATE.format(reg_number=canonical_reg_num)

        # Explicit SSRF security check: Ensure URL host matches ctri.nic.in
        from urllib.parse import urlparse
        parsed = urlparse(target_url)
        if parsed.hostname != CTRI_BASE_HOST:
            raise CTRIConnectorException(
                error_code="SSRF_SECURITY_VIOLATION",
                message="Target URL is outside authorized CTRI domain.",
                status_code=403,
            )

        headers = {
            "User-Agent": "AyuTrialFabric-GovernanceCompiler/1.0 (+https://aiia.gov.in)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        req = urllib.request.Request(target_url, headers=headers, method="GET")

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=self.timeout_seconds) as response:
                    if response.status != 200:
                        raise CTRIConnectorException(
                            error_code="CTRI_HTTP_ERROR",
                            message=f"CTRI returned HTTP status {response.status}",
                            status_code=502,
                        )
                    html_bytes = response.read()
                    html_text = html_bytes.decode("utf-8", errors="replace")

                    # Check for "Trial Not Found" indicators in CTRI response
                    if "No Record Found" in html_text or "Trial Details Not Found" in html_text:
                        return None

                    parsed_fields = parse_ctri_html(html_text, canonical_reg_num)
                    
                    # If HTML did not yield a title, it's either an empty query or blocked
                    if not parsed_fields.get("public_title"):
                        return None

                    now_iso = datetime.now(timezone.utc).isoformat()
                    parsed_fields["source_url"] = target_url
                    parsed_fields["source_system"] = "CTRI"
                    parsed_fields["retrieved_at"] = now_iso
                    parsed_fields["source_mode"] = "LIVE"
                    parsed_fields["source_hash"] = self.compute_source_hash(parsed_fields)

                    return NormalizedCTRITrial(**parsed_fields)

            except urllib.error.HTTPError as he:
                last_error = he
                if he.code == 404:
                    return None
            except urllib.error.URLError as ue:
                last_error = ue
                logger.warning(f"CTRI connection attempt {attempt} failed: {ue}")
            except Exception as e:
                last_error = e
                logger.warning(f"Unexpected error during CTRI fetch attempt {attempt}: {e}")

        logger.info(f"Live CTRI query for {canonical_reg_num} failed or unreachable: {last_error}")
        return None

    def fetch_curated_fixture(self, canonical_reg_num: str) -> Optional[NormalizedCTRITrial]:
        """
        Retrieve trial from curated dataset fixture (offline development/fallback mode).
        """
        for item in CTRI_DATASET:
            item_num = item.get("ctri_number") or item.get("trial_id") or item.get("alias")
            if item_num and item_num.upper() == canonical_reg_num.upper():
                now_iso = item.get("source_fetched_at") or datetime.now(timezone.utc).isoformat()
                
                normalized = {
                    "registration_number": canonical_reg_num,
                    "public_title": item.get("title") or item.get("short_title") or "Clinical Trial",
                    "scientific_title": item.get("scientific_title") or item.get("title"),
                    "study_type": item.get("study_type") or "Interventional",
                    "intervention": item.get("intervention") or item.get("formulation"),
                    "condition": item.get("health_condition") or item.get("indication"),
                    "primary_objective": item.get("description"),
                    "secondary_objectives": None,
                    "study_design": item.get("study_design"),
                    "phase": item.get("phase"),
                    "sample_size": item.get("target_sample_size") or item.get("target_enrollment"),
                    "inclusion_criteria": None,
                    "exclusion_criteria": None,
                    "primary_outcomes": None,
                    "secondary_outcomes": None,
                    "sites": item.get("sites") or [],
                    "sponsor": item.get("sponsor") or item.get("primary_sponsor"),
                    "principal_investigator": item.get("lead_investigator") or item.get("pi_name"),
                    "status": item.get("status") or item.get("recruitment_status"),
                    "registration_date": item.get("start_date") or item.get("first_enrollment_date"),
                    "last_updated": item.get("estimated_end_date"),
                    "source_url": item.get("source_url") or CTRI_DETAILS_URL_TEMPLATE.format(reg_number=canonical_reg_num),
                    "source_system": "CTRI",
                    "retrieved_at": now_iso,
                    "source_mode": "FIXTURE",
                }
                normalized["source_hash"] = self.compute_source_hash(normalized)
                return NormalizedCTRITrial(**normalized)
        return None

    def detect_changes(
        self,
        previous_trial: Optional[Dict[str, Any]],
        new_trial: NormalizedCTRITrial,
    ) -> CTRIChangeReport:
        """
        Deterministic, rule-based change detection between previous stored version and new trial.
        """
        new_hash = new_trial.source_hash
        if not previous_trial:
            return CTRIChangeReport(
                changed=True,
                changed_fields=["*INITIAL_IMPORT*"],
                previous_hash=None,
                new_hash=new_hash,
                diff={"initial_import": {"previous": None, "new": new_trial.registration_number}},
            )

        prev_hash = previous_trial.get("source_hash")
        if not prev_hash:
            prev_hash = self.compute_source_hash(previous_trial)

        if prev_hash == new_hash:
            return CTRIChangeReport(
                changed=False,
                changed_fields=[],
                previous_hash=prev_hash,
                new_hash=new_hash,
                diff={},
            )

        # Field-by-field comparison
        fields_to_compare = [
            ("public_title", "title"),
            ("scientific_title", "scientific_title"),
            ("intervention", "intervention"),
            ("condition", "condition"),
            ("phase", "phase"),
            ("sample_size", "target_sample_size"),
            ("study_type", "study_type"),
            ("study_design", "study_design"),
            ("status", "status"),
            ("sponsor", "sponsor"),
            ("principal_investigator", "pi_name"),
        ]

        changed_fields = []
        diff_dict = {}

        for norm_field, alt_field in fields_to_compare:
            new_val = getattr(new_trial, norm_field, None)
            prev_val = previous_trial.get(norm_field)
            if prev_val is None and alt_field:
                prev_val = previous_trial.get(alt_field)

            if str(new_val).strip() != str(prev_val).strip():
                changed_fields.append(norm_field)
                diff_dict[norm_field] = {
                    "previous": prev_val,
                    "new": new_val,
                }

        return CTRIChangeReport(
            changed=len(changed_fields) > 0,
            changed_fields=changed_fields,
            previous_hash=prev_hash,
            new_hash=new_hash,
            diff=diff_dict,
        )

    def fetch_trial(
        self,
        registration_number: str,
        allow_fixture_fallback: bool = True,
    ) -> Tuple[NormalizedCTRITrial, str]:
        """
        Main retrieval method:
        1. Validates registration number.
        2. Tries live public fetch.
        3. If live unreachable and fallback enabled, returns curated fixture.
        4. Otherwise raises structured CTRIConnectorException.
        Returns: (NormalizedCTRITrial, source_mode ["LIVE" | "FIXTURE"])
        """
        canonical_reg_num = self.validate_registration_number(registration_number)

        # Attempt live retrieval
        live_trial = self.fetch_live_trial(canonical_reg_num)
        if live_trial:
            return live_trial, "LIVE"

        # If live fetch unavailable, check curated fallback
        if allow_fixture_fallback:
            fixture_trial = self.fetch_curated_fixture(canonical_reg_num)
            if fixture_trial:
                return fixture_trial, "FIXTURE"

        raise CTRIConnectorException(
            error_code="TRIAL_NOT_FOUND_OR_UNAVAILABLE",
            message=(
                f"CTRI trial '{canonical_reg_num}' could not be retrieved from live public registry "
                "and was not found in local curated dataset."
            ),
            status_code=404,
        )


# Global singleton instance
ctri_connector = CTRIConnector()
