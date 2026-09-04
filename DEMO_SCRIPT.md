# Ayu-Trial Fabric — 5-Minute Live Judge Pitch & Demo Script
### SIH Problem Statement ID 26046 (Ministry of Ayush / AIIA)

---

## ⏱️ Pitch Timeline Overview (5 Minutes Total)

```
00:00 - 00:45 | The Clinical Problem (Protocol Amendments in Ayush Trials)
00:45 - 01:30 | Solution Architecture: The "Clinical Governance Compiler"
01:30 - 03:30 | LIVE DEMO: The 18-Step Amendment Journey (Fail → Resolve → Pass)
03:30 - 04:15 | Cryptographic Audit Trail & Safe AI Advisory Layer
04:15 - 05:00 | Impact, Scalability & Devil's Advocate Q&A Wrap-up
```

---

## 🎙️ Step-by-Step Speaker Notes & Screen Actions

### 00:00 - 00:45 | The Clinical Problem
- **Speaker**:
  > *"Respected Judges, in multi-center clinical trials in India—especially in Ayurveda under the Ministry of Ayush and AIIA—a simple protocol amendment, like extending a patient follow-up window from 31 to 35 days, is a regulatory nightmare. A single change ripples across multiple hospitals, hundreds of enrolled patients, CRFs, REDCap databases, and ethics committees. When sites implement changes out of sync, the trial suffers protocol deviations, data invalidation, or CDSCO regulatory halts. Today, we present **Ayu-Trial Fabric**: the world's first Clinical Governance Compiler that treats trial protocols like software code."*
- **Action**: Display Slide 1 or start on Dashboard (`http://localhost:5173/dashboard`).

---

### 00:45 - 01:30 | Solution Architecture
- **Speaker**:
  > *"Just like a modern software compiler compiles source code, validates syntax, checks dependencies, and catches breaking bugs before production, Ayu-Trial Fabric takes an atomic protocol ChangeSet, computes its blast radius across patients and centers, checks Indian statutory rules, and halts implementation with a `BUILD FAILED` until every legal obligation has cryptographic evidence."*
- **Action**: Navigate to `http://localhost:5173/demo` (Live Demo Page).

---

### 01:30 - 03:30 | The Live Demo (Climax Flow)

#### 1. Baseline Trial State (01:30)
- **Speaker**:
  > *"Here is our active Phase III trial: Trial ATF-001 for Ashwagandha Lehyam & Guduchi Ghanvati across 3 centers: AIIA New Delhi, NIA Jaipur, and IPGT Jamnagar, with exactly 47 participants enrolled in the Visit 4 window."*
- **Action**: Point to Active Presentation Trajectory banner on Demo page.

#### 2. The Protocol Amendment ChangeSet (01:45)
- **Speaker**:
  > *"The Lead PI drafts ChangeSet CS-0001: extending Visit 4 from Day 25–31 to Day 25–35 due to regional harvesting logistics. We submit this change."*
- **Action**: Click **"View ChangeSet & Blast Radius"** (navigates to Impact Graph).

#### 3. The 13-Node Blast Radius Graph (02:00)
- **Speaker**:
  > *"Instantly, our Dependency Resolver maps the blast radius across 13 nodes: 3 investigational sites, 47 patient schedules, Visit 4 CRF, REDCap EDC schema, and the Central Ethics Committee."*
- **Action**: Hover over the Site and Participant nodes showing patient counts (18 at AIIA, 15 at NIA, 14 at IPGT).

#### 4. The First Compilation Run: BUILD FAILED (02:20)
- **Speaker**:
  > *"Now, the Lead PI clicks Compile. The engine runs 10 rules across 6 clinical domains. Notice what happens: **BUILD FAILED** (Compilation CMP-000128). Readiness is BLOCKED with 3 Critical Blockers: lack of IEC ethics notification, missing patient consent addendum, and uncompleted CRC training."*
- **Action**: Navigate to Compiler (`/compiler`), click **"Run Governance Compile"**. Watch the 7-step pipeline animate and halt on FAILED.

#### 5. Safe AI Advisory Consultation (02:45)
- **Speaker**:
  > *"The PI wants to understand the regulatory backing for Finding F-001. They click 'Explain via Advisory AI'. Our safe advisory layer immediately provides plain-English regulatory citations: ICMR 2017 Chapter 3 and NDCT 2019 Rule 22. Notice the yellow banner: by architectural design, AI is strictly advisory and cannot mutate trial state or approve gates."*
- **Action**: Click **"Explain via Advisory AI"** on Finding F-001 card. The sleek Advisory Modal opens with statutory citations. Close modal.

#### 6. Evidence Resolution & Role-Based Verification (03:05)
- **Speaker**:
  > *"The team uploads the required evidence: IEC notification receipt with SHA-256 hash. The Ethics Reviewer verifies the ethics addendum. The Clinical Monitor verifies CRC site training logs."*
- **Action**: Click **"ADD EVIDENCE"** on EVD-01, EVD-02, and EVD-03. The buttons turn green to **VERIFIED** and obligations complete.

#### 7. The Climax: Recompile $\rightarrow$ BUILD PASSED (03:20)
- **Speaker**:
  > *"With all evidence verified, the PI clicks Recompile. In under 90 milliseconds, the compiler re-evaluates all gates: **BUILD PASSED** (Compilation CMP-000129). Readiness is certified as READY. And critically: CMP-000128 was never overwritten—both runs remain independently queryable in the immutable history."*
- **Action**: Click **"Recompile Package"**. The screen flashes green: `BUILD PASSED`, `READY`, `0 Blockers`.

---

### 03:30 - 04:15 | Cryptographic Audit Trail & Verification
- **Speaker**:
  > *"How do regulators verify that no one tampered with this decision? We click 'View Audit Trail'. Every action—drafting, compilation failure, AI inquiry, evidence upload, reviewer approval, and recompilation—is cryptographically hashed into an append-only SHA-256 Merkle chain. Notice our live tamper verifier: it walks from Genesis to Head, confirming 100% cryptographic integrity."*
- **Action**: Click **"View Audit Trail"**. Show the sequence of events (`EVT-001` through `EVT-014`), green **"MERKLE CHAIN VERIFIED"** badge, and root hash (`0x...`).

---

### 04:15 - 05:00 | Impact & Conclusion
- **Speaker**:
  > *"Ayu-Trial Fabric replaces weeks of fragmented email approvals and spreadsheet tracking with a deterministic, mathematically verifiable, and legally grounded clinical governance compiler. All 48 backend tests pass, the frontend is built on pure standard web technologies, and the entire architecture is fully functional today. Thank you, and we welcome your questions."*

---

## 🎯 Quick Reference for Boundary Questions

| Question | Winning Response |
| :--- | :--- |
| **"What if someone bypasses the UI and posts 'READY' directly to your API?"** | *"Our backend strictly ignores client-supplied readiness. Line 76 of `compiler_pipeline.py` computes readiness directly from `COUNT(findings WHERE status='OPEN' AND type='BLOCK')`. If blockers exist, the server forces BLOCKED."* |
| **"Can the AI hallucinate or approve a finding?"** | *"No. Our AI layer has a 3-layer guardrail: it runs in an advisory context where a SQLAlchemy `before_flush` hook physically throws a fatal error if any write is attempted, and database connections are opened in read-only transaction mode."* |
| **"What if someone edits the SQLite/Postgres database directly to forge an approval?"** | *"The Merkle chain detects it immediately. Each record stores a hash of its predecessor. When `/api/v1/audit/verify` runs, any altered field will cause a hash mismatch, flag `tamperDetected: true`, and identify the exact modified record."* |
