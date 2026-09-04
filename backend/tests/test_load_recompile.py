import time
import concurrent.futures
import pytest
from fastapi.testclient import TestClient


def test_load_recompile_concurrency_and_performance(client: TestClient):
    """
    Stress & Load Test: Recompilation Flow.
    The demo's climax is the recompile step: BUILD FAILED -> resolve -> BUILD PASSED.
    It must not lag, deadlock, duplicate run IDs, or return HTTP 500 under concurrent or rapid invocations.
    """
    payload = {
        "changeSetId": "CS-0001",
        "trialId": "AYU-2026-0001",
        "triggeredBy": "usr-pi-01",
        "pipeline": "FULL_VALIDATION",
    }

    num_concurrent = 20
    results = []

    def single_recompile():
        response = client.post("/api/v1/compiler/run", json=payload)
        return response.status_code, response.json()

    # Execute concurrent compilation runs across 4 worker threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(single_recompile) for _ in range(num_concurrent)]
        for f in concurrent.futures.as_completed(futures):
            status_code, data = f.result()
            results.append((status_code, data))

    # 1. Zero 500s / Zero HTTP failures
    status_codes = [r[0] for r in results]
    assert all(code == 200 for code in status_codes), f"Expected all 200, got: {set(status_codes)}"

    # 2. Unique Run IDs with atomic incrementation (no race conditions / collisions)
    run_ids = [r[1]["runId"] for r in results]
    assert len(set(run_ids)) == len(run_ids), f"Duplicate run IDs detected: {len(run_ids)} total vs {len(set(run_ids))} unique"

    # 3. Dedicated Latency Benchmark: 10 rapid sequential requests to measure real user response time
    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        res = client.post("/api/v1/compiler/run", json=payload)
        lat = (time.perf_counter() - t0) * 1000.0
        assert res.status_code == 200
        latencies.append(lat)

    avg_latency = sum(latencies) / len(latencies)
    max_latency = max(latencies)
    print(f"\n[BENCHMARK RECOMPILE] 10 sequential recompiles: avg={avg_latency:.2f}ms, max={max_latency:.2f}ms")
    assert avg_latency < 100.0, f"Average latency exceeds 100ms: {avg_latency:.2f}ms"

    # 4. Merkle Audit Chain Integrity after all concurrent writes
    verify_res = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["chainValid"] is True, f"Audit chain broken: {v_data}"
    assert v_data["tamperDetected"] is False


def test_climax_fail_to_pass_recompile_cycle(client: TestClient):
    """
    Demonstration Climax Cycle:
    1. Reset state -> Run 1 Fails (CMP-000128, 3 BLOCK)
    2. Rapid evidence upload & verification
    3. Run 2 Passes (CMP-000129, 0 BLOCK, READY)
    4. Both runs persist independently with zero state drift
    """
    # 1. Reset state
    reset_res = client.post("/api/v1/compiler/reset?changeSetId=CS-0001")
    assert reset_res.status_code == 200

    # 2. Initial Run (CMP-000128) - Must be FAILED
    run1 = client.post("/api/v1/compiler/run", json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"})
    assert run1.status_code == 200
    r1 = run1.json()
    assert r1["runId"] == "CMP-000128"
    assert r1["status"] == "FAILED"
    assert r1["readiness"]["status"] == "BLOCKED"
    assert r1["readiness"]["blockingFindings"] == 3

    # 3. Upload & Verify Evidence items
    client.post("/api/v1/compiler/evidence/EVD-01/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"})
    client.post("/api/v1/compiler/evidence/EVD-02/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"})
    client.post("/api/v1/compiler/evidence/EVD-03/verify?changeSetId=CS-0001", json={"decision": "ACCEPT"})

    # 4. Second Run (CMP-000129) - Must be PASSED
    start = time.perf_counter()
    run2 = client.post("/api/v1/compiler/run", json={"changeSetId": "CS-0001", "trialId": "AYU-2026-0001"})
    recompile_ms = (time.perf_counter() - start) * 1000.0
    assert run2.status_code == 200
    r2 = run2.json()
    assert r2["runId"] == "CMP-000129"
    assert r2["status"] == "PASSED"
    assert r2["readiness"]["status"] == "READY"
    assert r2["readiness"]["blockingFindings"] == 0
    assert r2["readiness"]["evidence"] == "4 / 4"
    assert recompile_ms < 100.0, f"Recompile took too long: {recompile_ms:.2f}ms"

    # 5. Verify both runs persist independently in historical runs query
    runs_res = client.get("/api/v1/compiler/runs?changeSetId=CS-0001")
    assert runs_res.status_code == 200
    runs = runs_res.json()
    run_ids = [x["runId"] for x in runs]
    assert "CMP-000128" in run_ids
    assert "CMP-000129" in run_ids

    # 6. Verify audit chain
    audit_verify = client.get("/api/v1/audit/verify?changeSetId=CS-0001")
    assert audit_verify.status_code == 200
    assert audit_verify.json()["chainValid"] is True
    assert audit_verify.json()["tamperDetected"] is False
