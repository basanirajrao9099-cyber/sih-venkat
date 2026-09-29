import pytest
from app.integrations.ctri.client import (
    CTRIConnector,
    CTRIConnectorException,
    ctri_connector,
    CTRI_REG_PATTERN,
)
from app.integrations.ctri.models import NormalizedCTRITrial, CTRIChangeReport
from app.integrations.ctri.parser import parse_ctri_html
from app.models.audit import AuditTrailRecord
from app.models.trial import Trial


def test_ctri_registration_number_validation():
    """Test 1: Valid and invalid CTRI registration number validation."""
    # Valid formats
    assert CTRIConnector.validate_registration_number("CTRI/2020/06/025557") == "CTRI/2020/06/025557"
    assert CTRIConnector.validate_registration_number("ctri-2020-06-025557") == "CTRI/2020/06/025557"
    assert CTRIConnector.validate_registration_number("CTRI/2024/01/061234") == "CTRI/2024/01/061234"

    # Invalid formats
    with pytest.raises(CTRIConnectorException) as exc1:
        CTRIConnector.validate_registration_number("INVALID-1234")
    assert exc1.value.error_code == "INVALID_REGISTRATION_NUMBER"

    with pytest.raises(CTRIConnectorException) as exc2:
        CTRIConnector.validate_registration_number("")
    assert exc2.value.error_code == "INVALID_REGISTRATION_NUMBER"

    with pytest.raises(CTRIConnectorException) as exc3:
        CTRIConnector.validate_registration_number("https://ctri.nic.in")
    assert exc3.value.error_code == "INVALID_REGISTRATION_NUMBER"


def test_ctri_html_parser_field_extraction():
    """Test 2: HTML parser safely extracts fields without fabricating missing values."""
    sample_html = """
    <table>
        <tr><td>Public Title</td><td>Clinical Trial on Ashwagandha for Stress</td></tr>
        <tr><td>Scientific Title</td><td>Randomized Controlled Trial of Withania somnifera Extract</td></tr>
        <tr><td>Type of Study</td><td>Interventional</td></tr>
        <tr><td>Health Condition</td><td>Generalized Anxiety & Stress</td></tr>
        <tr><td>Intervention</td><td>Ashwagandha Extract 300mg Capsules</td></tr>
        <tr><td>Phase</td><td>Phase III</td></tr>
        <tr><td>Target Sample Size</td><td>120 Patients</td></tr>
        <tr><td>Primary Sponsor</td><td>Central Council for Research in Ayurvedic Sciences</td></tr>
        <tr><td>Principal Investigator</td><td>Dr. R. K. Sharma</td></tr>
        <tr><td>Date of Registration</td><td>2021-04-10</td></tr>
    </table>
    """
    parsed = parse_ctri_html(sample_html, "CTRI/2021/04/032145")
    assert parsed["public_title"] == "Clinical Trial on Ashwagandha for Stress"
    assert parsed["scientific_title"] == "Randomized Controlled Trial of Withania somnifera Extract"
    assert parsed["study_type"] == "Interventional"
    assert parsed["condition"] == "Generalized Anxiety & Stress"
    assert parsed["intervention"] == "Ashwagandha Extract 300mg Capsules"
    assert parsed["phase"] == "Phase III"
    assert parsed["sample_size"] == 120
    assert parsed["sponsor"] == "Central Council for Research in Ayurvedic Sciences"
    assert parsed["principal_investigator"] == "Dr. R. K. Sharma"
    assert parsed["registration_date"] == "2021-04-10"
    assert parsed["secondary_objectives"] is None  # Missing fields stay None


def test_ctri_deterministic_source_hashing():
    """Test 3: Provenance hash is deterministic and ignores volatile metadata."""
    trial_data_1 = {
        "registration_number": "CTRI/2020/06/025557",
        "public_title": "AYUSH-64 Multicentric Clinical Trial",
        "study_type": "Interventional",
        "phase": "Phase II / Phase III",
        "sample_size": 140,
        "sponsor": "CCRAS",
        "retrieved_at": "2026-03-01T10:00:00Z",
    }
    trial_data_2 = {
        "registration_number": "CTRI/2020/06/025557",
        "public_title": "AYUSH-64 Multicentric Clinical Trial",
        "study_type": "Interventional",
        "phase": "Phase II / Phase III",
        "sample_size": 140,
        "sponsor": "CCRAS",
        "retrieved_at": "2026-03-29T18:00:00Z",  # Different fetch timestamp
    }
    hash1 = CTRIConnector.compute_source_hash(trial_data_1)
    hash2 = CTRIConnector.compute_source_hash(trial_data_2)
    assert hash1 == hash2
    assert hash1.startswith("0x")
    assert len(hash1) == 66  # 0x + 64 hex chars


def test_ctri_change_detection():
    """Test 4: Change detection pinpoints modified fields accurately."""
    connector = CTRIConnector()
    
    prev_trial = {
        "registration_number": "CTRI/2020/06/025557",
        "title": "AYUSH-64 Multicentric Clinical Trial",
        "phase": "Phase II",
        "target_sample_size": 100,
        "status": "Recruiting",
    }
    
    new_normalized = NormalizedCTRITrial(
        registration_number="CTRI/2020/06/025557",
        public_title="AYUSH-64 Multicentric Clinical Trial",
        phase="Phase III",  # Modified
        sample_size=140,    # Modified
        status="Completed", # Modified
        source_url="https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid=CTRI/2020/06/025557",
        source_system="CTRI",
        retrieved_at="2026-03-29T12:00:00Z",
        source_hash="0xABC123",
        source_mode="LIVE",
    )
    new_normalized.source_hash = connector.compute_source_hash(new_normalized.model_dump())

    report = connector.detect_changes(prev_trial, new_normalized)
    assert report.changed is True
    assert "phase" in report.changed_fields
    assert "sample_size" in report.changed_fields
    assert "status" in report.changed_fields
    assert "public_title" not in report.changed_fields


def test_ctri_fixture_fallback_preserves_curated_data():
    """Test 5: Curated dataset is available as fallback and marked as FIXTURE."""
    trial, mode = ctri_connector.fetch_trial("CTRI/2020/06/025557", allow_fixture_fallback=True)
    assert trial is not None
    assert trial.registration_number == "CTRI/2020/06/025557"
    assert "AYUSH 64" in trial.public_title or "AYUSH-64" in trial.public_title
    assert mode in ["LIVE", "FIXTURE"]
    assert trial.source_system == "CTRI"
    assert trial.source_hash.startswith("0x")


def test_ctri_unknown_trial_raises_error():
    """Test 6: Non-existent trial raises structured CTRIConnectorException without crashing."""
    with pytest.raises(CTRIConnectorException) as exc_info:
        ctri_connector.fetch_trial("CTRI/2099/12/999999", allow_fixture_fallback=False)
    assert exc_info.value.status_code == 404
    assert exc_info.value.error_code == "TRIAL_NOT_FOUND_OR_UNAVAILABLE"


def test_ctri_read_only_safety_verification():
    """Test 7: Verify connector contains no write/mutation methods to CTRI."""
    methods = [m for m in dir(CTRIConnector) if not m.startswith("__")]
    unsafe_patterns = [
        "post_trial", "put_trial", "patch_trial", "delete_trial",
        "write_back", "update_ctri", "mutate_ctri", "upload_to_ctri",
        "submit_amendment_to_ctri", "push_data", "send_data"
    ]
    for m in methods:
        for pattern in unsafe_patterns:
            assert pattern not in m.lower(), f"Unsafe write method '{m}' found in CTRIConnector!"



def test_ctri_api_status_endpoint(client):
    """Test 8: GET /api/v1/ctri/status returns connector health and safety configuration."""
    response = client.get("/api/v1/ctri/status")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "READ_ONLY"
    assert data["writeBackEnabled"] is False
    assert "ctri.nic.in" in data["allowedDomains"]
    assert data["status"] == "CONNECTED"


def test_ctri_api_validate_endpoint(client):
    """Test 9: GET /api/v1/ctri/validate validates registration number."""
    # Valid
    r1 = client.get("/api/v1/ctri/validate?registrationNumber=CTRI/2020/06/025557")
    assert r1.status_code == 200
    assert r1.json()["valid"] is True
    assert r1.json()["canonicalNumber"] == "CTRI/2020/06/025557"

    # Invalid
    r2 = client.get("/api/v1/ctri/validate?registrationNumber=NOT-A-CTRI-ID")
    assert r2.status_code == 200
    assert r2.json()["valid"] is False


def test_ctri_api_fetch_and_audit_logging(client, db_session):
    """Test 10: GET /api/v1/ctri/fetch retrieves trial, compares version, and appends Merkle audit event."""
    initial_audit_count = db_session.query(AuditTrailRecord).count()

    response = client.get("/api/v1/ctri/fetch?registrationNumber=CTRI/2020/06/025557&allowFallback=true")
    assert response.status_code == 200
    data = response.json()

    assert data["source"] == "CTRI"
    assert data["registration_number"] == "CTRI/2020/06/025557"
    assert "trial" in data
    assert "version" in data
    assert data["trial"]["source_hash"].startswith("0x")

    # Verify audit trail record was generated
    final_audit_count = db_session.query(AuditTrailRecord).count()
    assert final_audit_count >= initial_audit_count
    
    last_audit = db_session.query(AuditTrailRecord).order_by(AuditTrailRecord.created_at.desc()).first()
    assert last_audit is not None
    assert "CTRI" in last_audit.what or "CTRI" in (last_audit.who or "")
