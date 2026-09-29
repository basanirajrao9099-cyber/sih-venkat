"""
CTRI Integration Package for Ayu-Trial Fabric.
Provides read-only access, HTML parsing, normalization, and change detection for Indian clinical trials.
"""

from app.integrations.ctri.client import (
    CTRIConnector,
    CTRIConnectorException,
    ctri_connector,
)
from app.integrations.ctri.models import (
    NormalizedCTRITrial,
    CTRIChangeReport,
    CTRITrialResponse,
    CTRIValidationError,
)

__all__ = [
    "CTRIConnector",
    "CTRIConnectorException",
    "ctri_connector",
    "NormalizedCTRITrial",
    "CTRIChangeReport",
    "CTRITrialResponse",
    "CTRIValidationError",
]
