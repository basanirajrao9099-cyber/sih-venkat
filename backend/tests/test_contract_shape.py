def test_health_check(client):
    """Assert server health check responds with 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data


def test_get_trial_canonical_shape(client):
    """
    Assert GET /api/v1/trials/AYU-2026-0001 returns 200 and matches the full nested structure
    locked in shared_contract.md.
    """
    response = client.get("/api/v1/trials/AYU-2026-0001")
    assert response.status_code == 200
    data = response.json()

    # Core identification fields
    assert data["trialId"] == "AYU-2026-0001"
    assert data["protocolId"] == "AYU-CT-2026-042"
    assert data["title"] == "Randomized Double-Blind Evaluation of Standardized Ashwagandha Lehyam & Guduchi Ghanvati in Post-Viral Fatigue Syndrome"
    assert data["system"] == "Ayurveda"
    assert data["phase"] == "Phase III"
    assert data["status"] in ["recruiting", "active"]

    # Metrics
    assert data["targetEnrollment"] == 360
    assert data["enrolledCount"] == 284
    assert data["activeSites"] == 3
    assert data["numberOfParticipants"] == 47
    assert data["recruitmentPercentage"] == 72.0

    # Nested components expected by Part A
    assert "sites" in data
    assert len(data["sites"]) == 3
    site_codes = {s["siteCode"] for s in data["sites"]}
    assert site_codes == {"SITE-01-AIIA", "SITE-02-NIAJ", "SITE-03-IPGT"}

    assert "endpoints" in data
    assert len(data["endpoints"]) == 5

    assert "scheduleOfAssessments" in data
    assert len(data["scheduleOfAssessments"]) == 5
    visit_ids = [v["visitId"] for v in data["scheduleOfAssessments"]]
    assert "V1" in visit_ids
    assert "V4" in visit_ids


def test_get_trial_alias_resolution(client):
    """Assert GET /api/v1/trials/ATF-001 resolves to the same canonical record."""
    response = client.get("/api/v1/trials/ATF-001")
    assert response.status_code == 200
    data = response.json()
    assert data["trialId"] == "AYU-2026-0001"
    assert data["numberOfParticipants"] == 47


def test_participants_count_locked_to_47(client):
    """
    Assert exactly 47 participants exist for AYU-2026-0001,
    partitioned across 3 sites (18, 15, 14).
    """
    response = client.get("/api/v1/participants?trialId=AYU-2026-0001")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 47

    # Verify site partitions
    site_1_pts = [p for p in data if p["siteId"] == "SITE-001"]
    site_2_pts = [p for p in data if p["siteId"] == "SITE-002"]
    site_3_pts = [p for p in data if p["siteId"] == "SITE-003"]

    assert len(site_1_pts) == 18
    assert len(site_2_pts) == 15
    assert len(site_3_pts) == 14

    # Verify Ayurveda phenotypes are present
    assert data[0]["prakriti"] is not None
    assert data[0]["consent"] == "Signed (e-ICF v2.1)"


def test_governance_demo_fixtures_tagged(client):
    """Assert seeded governance records have isDemoFixture=True and source='seed'."""
    findings_resp = client.get("/api/v1/compiler/findings?changeSetId=CS-0001")
    assert findings_resp.status_code == 200
    findings = findings_resp.json()
    assert len(findings) == 4
    for f in findings:
        assert f["isDemoFixture"] is True
        assert f["source"] == "seed"

    obligations_resp = client.get("/api/v1/compiler/obligations?changeSetId=CS-0001")
    assert obligations_resp.status_code == 200
    obligations = obligations_resp.json()
    assert len(obligations) == 4


def test_rbac_login_and_token(client):
    """Assert login produces a 24-hour token with proper claims."""
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "pi@aiia.gov.in", "password": "AyuTrial@2026"}
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_minutes"] == 1440
    assert data["user"]["role"] == "Principal Investigator"

    # Test /auth/me with bearer token
    token = data["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "pi@aiia.gov.in"
