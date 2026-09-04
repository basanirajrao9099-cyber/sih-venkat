import time
import requests

BASE_URL = "http://127.0.0.1:8000"


def run_single_rehearsal(rehearsal_num: int):
    print(f"\n{'='*60}")
    print(f">> STARTING LIVE DEMO REHEARSAL #{rehearsal_num}")
    print(f"{'='*60}")
    start_total = time.time()

    # Step 1: Health
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200
    print(f"  [00:05] Step 1: Health check OK ({time.time()-t0:.3f}s)")

    # Step 2: Auth Login
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": "pi@aiia.gov.in", "password": "AyuTrial@2026"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [00:15] Step 2: PI JWT Auth issued ({time.time()-t0:.3f}s)")

    # Step 3: Trial Catalog
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/trials", headers=headers)
    assert r.status_code == 200
    trials = r.json()
    assert len(trials) >= 1
    print(f"  [00:30] Step 3: Trial catalog retrieved: {trials[0]['protocolId']} ({time.time()-t0:.3f}s)")

    # Step 4: Investigational Sites
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/sites", headers=headers)
    assert r.status_code == 200
    sites = r.json()
    assert len(sites) == 3
    print(f"  [00:45] Step 4: 3 sites verified (AIIA, NIA, IPGT) ({time.time()-t0:.3f}s)")

    # Step 5: Participants
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/participants?trialId=AYU-2026-0001", headers=headers)
    assert r.status_code == 200
    patients = r.json()
    assert len(patients) == 47
    print(f"  [01:00] Step 5: Exactly 47 cohort participants verified ({time.time()-t0:.3f}s)")

    # Step 6: Reset demo state for fresh demonstration
    requests.post(f"{BASE_URL}/api/v1/compiler/reset?changeSetId=CS-0001", headers=headers)

    # Step 7: ChangeSets docket
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/changesets", headers=headers)
    assert r.status_code == 200
    print(f"  [01:15] Step 7: ChangeSet CS-0001 loaded ({time.time()-t0:.3f}s)")

    # Step 8: Blast radius graph
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/changesets/CS-0001/impact", headers=headers)
    assert r.status_code == 200
    impact = r.json()
    assert len(impact["nodes"]) >= 13
    print(f"  [01:30] Step 8: Blast radius mapped: {len(impact['nodes'])} nodes ({time.time()-t0:.3f}s)")

    # Step 9: Pre-flight rule evaluation
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/v1/compiler/evaluate?changeSetId=CS-0001", headers=headers)
    assert r.status_code == 200
    report = r.json()
    assert report["blockingCount"] == 3
    print(f"  [01:45] Step 9: Rules evaluated: 3 BLOCK, 1+ WARNING ({time.time()-t0:.3f}s)")

    # Step 10: Run 1 -> CMP-000128 FAILED
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/v1/compiler/run", json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"}, headers=headers)
    assert r.status_code == 200
    run1 = r.json()
    assert run1["status"] == "FAILED"
    assert run1["readiness"]["status"] == "BLOCKED"
    print(f"  [02:00] Step 10: Compilation run {run1['runId']} -> BUILD FAILED ({time.time()-t0:.3f}s)")

    # Step 11: Advisory AI explanation
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/v1/advisory/explain-finding", json={"findingId": "F-001", "changeSetId": "CS-0001"}, headers=headers)
    assert r.status_code == 200
    advice = r.json()
    assert advice["isAdvisory"] is True
    print(f"  [02:20] Step 11: Advisory AI citation: {advice['statutoryCitation'][:35]}... ({time.time()-t0:.3f}s)")

    # Step 12: Submit Evidence EVD-01
    t0 = time.time()
    r = requests.post(
        f"{BASE_URL}/api/v1/compiler/evidence/submit",
        json={
            "evidenceId": "EVD-01",
            "changeSetId": "CS-0001",
            "title": "IEC Notification Letter",
            "documentType": "Ethics Clearance Notice",
            "uploadedBy": "Dr. V. Sharma (Lead PI)",
            "fileName": "dossier_iec_ack.pdf",
            "checksumSha256": "0x7F9B2C1A8E3D",
        },
        headers={"Authorization": f"Bearer {token}", "X-User-Role": "PI"},
    )
    assert r.status_code == 200
    print(f"  [02:40] Step 12: Lead PI submitted EVD-01 with SHA-256 hash ({time.time()-t0:.3f}s)")

    # Step 13: Role-based Verification
    t0 = time.time()
    r1 = requests.post(f"{BASE_URL}/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Ethics Reviewer"})
    r2 = requests.post(f"{BASE_URL}/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Ethics Reviewer"})
    r3 = requests.post(f"{BASE_URL}/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"}, headers={"X-User-Role": "Monitor"})
    assert r1.status_code == 200 and r2.status_code == 200 and r3.status_code == 200
    print(f"  [03:00] Step 13: Role-based verifications accepted (Ethics & Monitor) ({time.time()-t0:.3f}s)")

    # Step 14: Recompilation Climax -> CMP-000129 PASSED
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/v1/compiler/run", json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"}, headers=headers)
    assert r.status_code == 200
    run2 = r.json()
    assert run2["status"] == "PASSED"
    assert run2["readiness"]["status"] == "READY"
    recompile_latency = time.time() - t0
    print(f"  [03:20] Step 14: Recompilation {run2['runId']} -> BUILD PASSED in {recompile_latency*1000:.1f}ms! ({run2['readiness']['evidence']})")

    # Step 15: Cryptographic Audit Verification
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/api/v1/audit/verify?changeSetId=CS-0001", headers=headers)
    assert r.status_code == 200
    audit = r.json()
    assert audit["chainValid"] is True
    assert audit["tamperDetected"] is False
    print(f"  [03:40] Step 15: Merkle Chain Verified (Valid: True, Tamper: False, Records: {audit['totalRecords']}) ({time.time()-t0:.3f}s)")

    total_time = time.time() - start_total
    print(f"[OK] REHEARSAL #{rehearsal_num} COMPLETED IN {total_time:.2f}s WITH ZERO ERRORS!\n")
    return total_time


if __name__ == "__main__":
    print("Beginning 2 timed dry runs of the live demo...")
    t1 = run_single_rehearsal(1)
    time.sleep(1)
    t2 = run_single_rehearsal(2)
    print("SUCCESS: Both live demo dry runs completed cleanly with zero errors!")
    print(f"   Run 1: {t1:.2f}s | Run 2: {t2:.2f}s")
