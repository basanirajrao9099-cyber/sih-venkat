# Ayu-Trial Fabric: Shared Data & API Contract
**Between Part A (Product Experience & Trial Operations) & Part B (Core Intelligence & Governance)**

---

## 1. Executive Summary & Goal
**Goal:** Zero surprises, zero breaking changes, and zero schema mismatches when Part A UI connects to the Part B Governance Backend.

Every field name, type, casing convention, identifier prefix, timestamp, and error envelope documented here has been **reverse-engineered and locked** directly against the existing Part A TypeScript code (`src/types/`, `src/data/`, `src/services/`, and `src/pages/`).

---

## 2. Global Conventions & Canonical Rules

### 2.1 Casing Rules
- **Object Properties / JSON Keys:** Strictly `camelCase` (e.g. `trialId`, `targetEnrollment`, `affectedSitesCount`).
- **Enums & State Literals:**
  - **Compiler & Governance Enums:** Strictly **UPPERCASE**
    - Finding Types: `"BLOCK"`, `"WARNING"`
    - Finding Status: `"OPEN"`, `"RESOLVED"`
    - Finding & Node Severity: `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`
    - Obligation Status: `"OPEN"`, `"IN PROGRESS"`, `"COMPLETED"`
    - Evidence Status: `"MISSING"`, `"AVAILABLE"`, `"VERIFIED"`
    - Compilation Status: `"PASSED"`, `"FAILED"`, `"RUNNING"`, `"PENDING"`
    - Implementation Readiness: `"BLOCKED"`, `"READY"`
    - Pipeline Step Status: `"PENDING"`, `"RUNNING"`, `"PASSED"`, `"FAILED"`
    - Pipeline Step Names: `"CHANGESET"`, `"IMPACT"`, `"COMPILE"`, `"RULES"`, `"FINDINGS"`, `"OBLIGATIONS"`, `"EVIDENCE"`, `"VERIFICATION"`, `"READY"`
  - **Clinical / Operational Status Enums:**
    - Trial Status: `'active' | 'recruiting' | 'completed' | 'suspended' | 'draft'`
    - Site Status: `'active' | 'recruiting' | 'pending' | 'suspended'`
    - Ethics Approval Status: `'approved' | 'pending' | 'under_review'`
    - Adverse Event Status: `'open' | 'under_investigation' | 'closed' | 'escalated'`
- **ID Formats & Prefixes:**
  - Trials: `ATF-001`, `trial-001`, or `AYU-CT-2026-042`
  - Sites: `SITE-01-AIIA`, `SITE-001`, or `site-01`
  - Participants: `PT-001`, `SUBJ-101-004` (strictly pseudonymized)
  - ChangeSets: `CS-0001`
  - Compilation Runs: `CMP-000128` (immutable sequential IDs)
  - Findings: `F-001`, `chk-01`
  - Obligations: `OBL-01`
  - Evidence: `EVD-01`
  - Adverse Events: `SAE-2026-003`
  - Audit Trail Events: `EVT-001`, `STEP 1`
- **Timestamps:**
  - Standard API responses use ISO 8601 UTC: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2026-03-04T10:14:02Z`).
  - Friendly display fields formatted as `"Today, 10:14:02 IST"` or `"2026-03-15"` where explicitly required by legacy UI widgets.

---

## 3. Standard API Envelope & Error Response

### 3.1 Standard Success Envelope (`ApiResponse<T>`)
Every successful JSON response follows this structure:
```json
{
  "success": true,
  "data": { ... },
  "total": 47,
  "message": "Operation completed successfully",
  "timestamp": "2026-03-04T10:15:00Z"
}
```

### 3.2 Standard Error Envelope (`ApiErrorResponse`)
Ensures Part A toast notifications and error banners render without crashing:
```json
{
  "success": false,
  "error": {
    "code": "COMPILATION_BLOCKED",
    "message": "Build Failed: 3 Blockers, 1 Warning found",
    "details": [
      "F-001: IEC notification required",
      "F-002: Consent document update required",
      "F-003: Site training required"
    ],
    "timestamp": "2026-03-04T10:15:05Z"
  }
}
```

Standard HTTP Error Codes:
- `400 Bad Request`: Validation failure on ChangeSet or missing payload fields.
- `401 Unauthorized`: Missing or invalid bearer token.
- `403 Forbidden`: Role does not have permission (e.g. Monitor attempting to certify Readiness).
- `404 Not Found`: Resource ID not found.
- `409 Conflict`: Recompilation attempted while another run is active or immutable conflict.
- `422 Unprocessable Entity`: Governance Rule execution failure.
- `500 Internal Server Error`: Unhandled server exception.

---

## 4. Locked Data Schemas & Exact JSON Contracts

### 4.1 Trial (`ClinicalTrial` & `TrialOpsItem`)
Endpoint: `GET /api/v1/trials`, `GET /api/v1/trials/{trialId}`

```json
{
  "id": "trial-001",
  "trialId": "ATF-001",
  "protocolId": "AYU-CT-2026-042",
  "title": "Randomized Double-Blind Evaluation of Standardized Ashwagandha Lehyam & Guduchi Ghanvati in Post-Viral Fatigue Syndrome",
  "shortTitle": "Ashwagandha-Guduchi PVFS Study",
  "system": "Ayurveda",
  "phase": "Phase III",
  "status": "recruiting",
  "formulation": "Ashwagandha Lehyam (6g BD) + Guduchi Ghanvati (500mg BD)",
  "indication": "Post-Viral Chronic Fatigue & Immune Dysregulation",
  "targetEnrollment": 360,
  "enrolledCount": 284,
  "activeSites": 8,
  "numberOfSites": 3,
  "numberOfParticipants": 47,
  "recruitmentPercentage": 72,
  "protocolVersion": "v1.0 (Active) / v1.1 (Proposed)",
  "startDate": "2025-11-15",
  "estimatedEndDate": "2026-12-30",
  "sponsor": "Central Council for Research in Ayurvedic Sciences (CCRAS)",
  "ctriNumber": "CTRI/2025/11/059341",
  "piName": "Prof. Dr. Anandita Sharma",
  "leadInvestigator": "Dr. V. Sharma, MD (Ayu), PhD",
  "activeAmendment": "CS-0001",
  "budgetAllocated": 14500000,
  "budgetUtilized": 8200000,
  "saeCount": 1,
  "description": "A multicenter randomized controlled demonstration study evaluating standardized Ayurvedic formulation efficacy and dynamic visit flex windows across clinical centers."
}
```

---

### 4.2 Site (`TrialSite` & `SiteOpsItem`)
Endpoint: `GET /api/v1/trials/{trialId}/sites`, `GET /api/v1/sites/{siteId}`

```json
{
  "id": "site-01",
  "siteId": "SITE-001",
  "siteCode": "SITE-01-AIIA",
  "name": "All India Institute of Ayurveda — Center for Integrative Medicine",
  "siteName": "All India Institute of Ayurveda (SITE-001)",
  "city": "New Delhi",
  "state": "Delhi",
  "location": "New Delhi, Delhi",
  "piName": "Prof. Dr. Anandita Sharma",
  "investigator": "Dr. V. Sharma",
  "contactEmail": "aiia.trials@gov.in",
  "status": "active",
  "activationStatus": "ACTIVE",
  "governanceStatus": "READY",
  "targetEnrollment": 60,
  "currentEnrollment": 54,
  "participants": 18,
  "trainingPct": 92,
  "documentsPct": 100,
  "iecApprovalDate": "2025-10-12",
  "lastMonitorVisit": "2026-02-18",
  "openQueries": 3,
  "complianceRate": 98.2
}
```

---

### 4.3 Participant (`ParticipantOpsItem`)
Endpoint: `GET /api/v1/trials/{trialId}/participants`, `GET /api/v1/participants/{participantId}`

```json
{
  "id": "pt-ops-001",
  "participantId": "PT-001",
  "subjectCode": "SUBJ-101-004",
  "trialId": "ATF-001",
  "site": "Hyderabad Clinical Centre (SITE-001)",
  "siteId": "SITE-001",
  "siteCode": "SITE-01-AIIA",
  "siteName": "All India Institute of Ayurveda",
  "enrollmentDate": "2025-11-20",
  "visitStatus": "Visit 3 Complete",
  "consent": "Signed (e-ICF v2.1)",
  "safety": "No AE",
  "protocolVersion": "Protocol v1.0",
  "cohortArm": "Arm A (Investigational Formulation)",
  "arm": "Arm A (Ayurveda + Standard Care)",
  "age": 42,
  "gender": "Female",
  "prakriti": "Vata-Pitta",
  "status": "active",
  "currentVisit": "Week 8 (V4)",
  "adherenceRate": 96.5,
  "adverseEventsCount": 0,
  "timeline": [
    { "step": "Screening", "status": "completed", "date": "2025-11-15", "notes": "Prakriti: Vata-Pitta. Eligibility verified." },
    { "step": "Enrollment", "status": "completed", "date": "2025-11-20", "notes": "Randomized to Arm A. First supply dispensed." },
    { "step": "Visit 1", "status": "completed", "date": "2025-12-18", "notes": "Week 4 check. Labs normal." },
    { "step": "Visit 2", "status": "completed", "date": "2026-01-16", "notes": "Week 8 interim review." },
    { "step": "Visit 3", "status": "completed", "date": "2026-02-14", "notes": "Week 12 primary endpoint completed." }
  ]
}
```

---

### 4.4 ChangeSet (`ChangeSetRecord`)
Endpoint: `GET /api/v1/changesets`, `POST /api/v1/changesets`, `GET /api/v1/changesets/{id}`

```json
{
  "id": "CS-0001",
  "trialId": "ATF-001",
  "trialName": "AYU-TRIAL FABRIC Demonstration Trial",
  "protocol": "v1.1",
  "type": "Protocol Amendment",
  "previousState": "Day 25–31",
  "newState": "Day 25–35",
  "change": "Visit 4 schedule: Day 25–31 → Day 25–35",
  "affectedEntities": [
    "Sites (3)",
    "Participants (47)",
    "Visit 4",
    "CRF",
    "EDC Mapping",
    "Ethics",
    "Training",
    "Consent"
  ],
  "effectiveDate": "2026-03-15",
  "status": "IN REVIEW",
  "created": "Today"
}
```

---

### 4.5 ImpactReport & Visual Impact Graph (`ImpactSummaryMetrics` & `ImpactNode[]`)
Endpoint: `GET /api/v1/changesets/{id}/impact`

```json
{
  "changeSetId": "CS-0001",
  "trialId": "ATF-001",
  "summary": {
    "sitesCount": 3,
    "participantsCount": 47,
    "visitsCount": 1,
    "crfsCount": 1,
    "edcMappingsCount": 1,
    "ethicsAffected": true,
    "trainingAffected": true,
    "consentAffected": true
  },
  "nodes": [
    {
      "id": "node-root",
      "label": "CS-0001",
      "entity": "ChangeSet CS-0001",
      "category": "Root",
      "severity": "HIGH",
      "reason": "Protocol Amendment expanding Visit 4 schedule window from Day 25–31 to Day 25–35.",
      "relationship": "Root ChangeSet Docket",
      "relatedChangeSet": "CS-0001",
      "hasChildren": true
    },
    {
      "id": "node-sites",
      "label": "Sites",
      "entity": "Investigational Sites",
      "category": "Sites",
      "severity": "MEDIUM",
      "reason": "3 trial centers have active subjects currently approaching the Day 25 milestone.",
      "relationship": "Impacted Trial Centers",
      "relatedChangeSet": "CS-0001",
      "parentId": "node-root",
      "hasChildren": true,
      "meta": { "count": 3 }
    },
    {
      "id": "node-site-01",
      "label": "Site 01",
      "entity": "Site 01 (AIIA New Delhi)",
      "category": "Sites",
      "severity": "MEDIUM",
      "reason": "18 active participants scheduled for Visit 4 within next 10 calendar days.",
      "relationship": "Site Cluster Branch",
      "relatedChangeSet": "CS-0001",
      "parentId": "node-sites",
      "meta": { "count": 18, "code": "SITE-01-AIIA" }
    }
  ]
}
```

---

### 4.6 Findings (`Finding`)
Part A Expectation: Array of `Finding` items.
Endpoint: `GET /api/v1/compiler/findings?changeSetId=CS-0001`

```json
[
  {
    "id": "F-001",
    "type": "BLOCK",
    "title": "IEC notification required",
    "description": "Protocol amendment affects Visit 4 timing and requires ethics notification.",
    "severity": "HIGH",
    "status": "OPEN",
    "rule": "RULE-ETHICS-01",
    "affectedEntity": "Ethics (IEC)",
    "obligationId": "OBL-01"
  },
  {
    "id": "F-002",
    "type": "BLOCK",
    "title": "Consent document update required",
    "description": "Patient Information Sheet addendum is required before implementation.",
    "severity": "HIGH",
    "status": "OPEN",
    "rule": "RULE-CONSENT-02",
    "affectedEntity": "Consent",
    "obligationId": "OBL-02"
  },
  {
    "id": "F-003",
    "type": "BLOCK",
    "title": "Site training required",
    "description": "CRC operational briefing must be completed for affected sites.",
    "severity": "MEDIUM",
    "status": "OPEN",
    "rule": "RULE-OPS-03",
    "affectedEntity": "Sites (3)",
    "obligationId": "OBL-03"
  },
  {
    "id": "F-004",
    "type": "WARNING",
    "title": "EDC mapping review",
    "description": "REDCap eCRF visit-window mapping should be reviewed.",
    "severity": "MEDIUM",
    "status": "OPEN",
    "rule": "RULE-DATA-04",
    "affectedEntity": "EDC Mapping",
    "obligationId": "OBL-04"
  }
]
```

---

### 4.7 Obligations (`Obligation`)
Part A Expectation: Array of `Obligation` items.
Endpoint: `GET /api/v1/compiler/obligations?changeSetId=CS-0001`

```json
[
  {
    "id": "OBL-01",
    "obligation": "IEC notification",
    "owner": "Regulatory",
    "status": "OPEN",
    "deadline": "2026-03-10",
    "severity": "HIGH",
    "findingId": "F-001"
  },
  {
    "id": "OBL-02",
    "obligation": "Consent addendum",
    "owner": "Ethics",
    "status": "OPEN",
    "deadline": "2026-03-12",
    "severity": "HIGH",
    "findingId": "F-002"
  },
  {
    "id": "OBL-03",
    "obligation": "CRC training",
    "owner": "Trial Operations",
    "status": "OPEN",
    "deadline": "2026-03-14",
    "severity": "MEDIUM",
    "findingId": "F-003"
  },
  {
    "id": "OBL-04",
    "obligation": "EDC mapping review",
    "owner": "Data Management",
    "status": "OPEN",
    "deadline": "2026-03-15",
    "severity": "MEDIUM",
    "findingId": "F-004"
  }
]
```

---

### 4.8 Evidence (`EvidenceItem`)
Part A Expectation: Array of `EvidenceItem` items with upload & verification support.
Endpoint: `GET /api/v1/compiler/evidence?changeSetId=CS-0001`, `POST /api/v1/evidence/upload`

```json
[
  {
    "id": "EVD-01",
    "title": "IEC Notification Letter",
    "status": "MISSING",
    "buttonText": "ADD EVIDENCE",
    "fileHint": "Dossier acknowledgement receipt from Central Ethics Board",
    "fileUrl": null,
    "verifiedBy": null,
    "verificationHash": null
  },
  {
    "id": "EVD-02",
    "title": "Consent Addendum",
    "status": "MISSING",
    "buttonText": "ADD EVIDENCE",
    "fileHint": "Patient Information Sheet v1.1 addendum approved",
    "fileUrl": null,
    "verifiedBy": null,
    "verificationHash": null
  },
  {
    "id": "EVD-03",
    "title": "Training Completion Record",
    "status": "MISSING",
    "buttonText": "ADD EVIDENCE",
    "fileHint": "Site CRC sign-off certificates across 3 centers",
    "fileUrl": null,
    "verifiedBy": null,
    "verificationHash": null
  },
  {
    "id": "EVD-04",
    "title": "EDC Mapping Verification",
    "status": "AVAILABLE",
    "buttonText": "VIEW",
    "fileHint": "REDCap visit window schema validation hash: 0x8F9C2B",
    "fileUrl": "/evidence/edc_mapping_hash_0x8f9c2b.pdf",
    "verifiedBy": "Data Management QA",
    "verificationHash": "0x8F9C2B"
  }
]
```

---

### 4.9 CompilationRun & Implementation Readiness
Endpoint: `POST /api/v1/compiler/run`, `GET /api/v1/compiler/status`, `GET /api/v1/compiler/readiness`

#### Request Payload:
```json
{
  "changeSetId": "CS-0001",
  "trialId": "ATF-001",
  "triggeredBy": "usr-pi-01",
  "pipeline": "FULL_VALIDATION"
}
```

#### Response (Initial Run #1 `CMP-000128` — FAILED):
```json
{
  "success": true,
  "data": {
    "runId": "CMP-000128",
    "changeSetId": "CS-0001",
    "trialId": "ATF-001",
    "protocol": "v1.1",
    "timestamp": "2026-03-04T10:15:05Z",
    "status": "FAILED",
    "readiness": {
      "protocol": "v1.1",
      "changeSet": "CS-0001",
      "sites": 3,
      "participants": 47,
      "blockingFindings": 3,
      "warnings": 1,
      "evidence": "1 / 4",
      "status": "BLOCKED"
    },
    "pipelineSteps": [
      { "name": "CHANGESET", "status": "PASSED" },
      { "name": "IMPACT", "status": "PASSED" },
      { "name": "COMPILE", "status": "PASSED" },
      { "name": "RULES", "status": "PASSED" },
      { "name": "FINDINGS", "status": "FAILED" },
      { "name": "OBLIGATIONS", "status": "FAILED" },
      { "name": "EVIDENCE", "status": "FAILED" },
      { "name": "VERIFICATION", "status": "FAILED" },
      { "name": "READY", "status": "PENDING" }
    ],
    "auditHash": "0x9F4C2A7B8E3D"
  }
}
```

#### Response (Second Recompile Run #2 `CMP-000129` — PASSED):
```json
{
  "success": true,
  "data": {
    "runId": "CMP-000129",
    "changeSetId": "CS-0001",
    "trialId": "ATF-001",
    "protocol": "v1.1",
    "timestamp": "2026-03-04T10:17:15Z",
    "status": "PASSED",
    "readiness": {
      "protocol": "v1.1",
      "changeSet": "CS-0001",
      "sites": 3,
      "participants": 47,
      "blockingFindings": 0,
      "warnings": 1,
      "evidence": "4 / 4",
      "status": "READY"
    },
    "pipelineSteps": [
      { "name": "CHANGESET", "status": "PASSED" },
      { "name": "IMPACT", "status": "PASSED" },
      { "name": "COMPILE", "status": "PASSED" },
      { "name": "RULES", "status": "PASSED" },
      { "name": "FINDINGS", "status": "PASSED" },
      { "name": "OBLIGATIONS", "status": "PASSED" },
      { "name": "EVIDENCE", "status": "PASSED" },
      { "name": "VERIFICATION", "status": "PASSED" },
      { "name": "READY", "status": "PASSED" }
    ],
    "auditHash": "0x3D7E8B1A2C4F"
  }
}
```

---

### 4.10 Audit Record (`AuditTimelineEvent`)
Endpoint: `GET /api/v1/audit/trail?changeSetId=CS-0001`

```json
[
  {
    "id": "EVT-001",
    "step": "STEP 1",
    "title": "ChangeSet Created",
    "timestamp": "Today, 10:14:02 IST",
    "actor": "Dr. V. Sharma (Lead PI)",
    "description": "ChangeSet CS-0001 drafted for Trial ATF-001 targeting Protocol v1.1 (Visit 4 Day 25–31 → Day 25–35 flex window).",
    "status": "SUBMITTED",
    "hash": "0x1A2B3C..."
  },
  {
    "id": "EVT-002",
    "step": "STEP 2",
    "title": "Impact Analysis Completed",
    "timestamp": "Today, 10:14:28 IST",
    "actor": "Automated Dependency Engine v2.4",
    "description": "Traversed trial data schema and resolved blast radius: 3 Sites, 47 Participants, 1 Visit Window, 1 CRF, 1 EDC Mapping, Ethics, Training, and Consent.",
    "status": "PASSED",
    "hash": "0x2B3C4D..."
  },
  {
    "id": "EVT-003",
    "step": "STEP 3",
    "title": "Compilation Failed",
    "timestamp": "Today, 10:15:05 IST",
    "actor": "Fabric Governance Compiler",
    "description": "Pre-flight gate check triggered BUILD FAILED due to unfulfilled procedural and regulatory prerequisites.",
    "status": "FAILED",
    "hash": "0x3C4D5E..."
  },
  {
    "id": "EVT-004",
    "step": "STEP 4",
    "title": "Findings Generated",
    "timestamp": "Today, 10:15:06 IST",
    "actor": "Rules Synthesizer",
    "description": "Formally logged 3 Blocking Findings (F-001: IEC Notification, F-002: Consent Addendum, F-003: Site Training) and 1 Warning (F-004: EDC Mapping).",
    "status": "WARNING",
    "hash": "0x4D5E6F..."
  },
  {
    "id": "EVT-005",
    "step": "STEP 5",
    "title": "Evidence Added",
    "timestamp": "Today, 10:16:42 IST",
    "actor": "Clinical Operations & Regulatory QA",
    "description": "Uploaded verified regulatory dossier acknowledgement, Patient Information Sheet addendum, and CRC training sign-offs. Verified 4 / 4 evidence artifacts.",
    "status": "PASSED",
    "hash": "0x5E6F7A..."
  },
  {
    "id": "EVT-006",
    "step": "STEP 6",
    "title": "Compilation Passed",
    "timestamp": "Today, 10:17:15 IST",
    "actor": "Fabric Governance Compiler",
    "description": "Re-evaluated all 9 governance pipeline checkpoints. Zero blocking findings detected. All rule constraints satisfied.",
    "status": "PASSED",
    "hash": "0x6F7A8B..."
  },
  {
    "id": "EVT-007",
    "step": "STEP 7",
    "title": "Implementation Ready",
    "timestamp": "Today, 10:17:18 IST",
    "actor": "Trial Governance Board",
    "description": "ChangeSet CS-0001 certified for immediate, synchronized operational rollout across Sites 01, 02, and 03.",
    "status": "READY",
    "hash": "0x9F4C2A7B8E3D"
  }
]
```

---

## 5. Hosting, Deployment & Runtime Architecture

### 5.1 Local Pair-Programming Mode
- **Frontend (Part A):** Runs on Vite at `http://localhost:5173`.
- **Backend (Part B):** Python FastAPI running with Uvicorn at `http://localhost:8000`.
- **CORS Configuration:** Backend explicitly permits `http://localhost:5173`, `http://127.0.0.1:5173`, and `*` in development mode with `allow_credentials=True`.
- **Vite Proxy Config:**
  ```typescript
  // vite.config.ts proxy
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
  ```

### 5.2 Production & Demo Deployment Architecture
- **Option 1 (Unified Container):** FastAPI serves both the REST API at `/api/v1/*` and the compiled Vite React production bundle (`dist/`) at `/`. Zero CORS issues, single URL for judges and evaluators.
- **Option 2 (Cloud PaaS):**
  - Frontend deployed on Vercel / Netlify.
  - Backend deployed on Render / Railway / AWS EC2 with environment variable `VITE_API_BASE_URL` pointing to the backend.
  - Database: Managed PostgreSQL (or portable SQLite with WAL mode for local zero-config testing).
  - Storage: MinIO or local filesystem mock with S3 interface for evidence document uploads.

---

## 6. Verification Checklist
- [x] All 11 core data objects fully aligned with Part A TypeScript definitions.
- [x] Enums and status casing locked (`BLOCK`, `WARNING`, `OPEN`, `RESOLVED`, `READY`, `BLOCKED`).
- [x] Standard `ApiResponse<T>` and `ApiErrorResponse` structures agreed upon.
- [x] Immutable compilation execution flow confirmed (`CMP-000128` FAILED $\rightarrow$ `CMP-000129` PASSED).
- [x] Local and cloud deployment paths defined with proxy compatibility.
