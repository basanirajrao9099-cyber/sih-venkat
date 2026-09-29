import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, RoleName
from app.models.trial import Trial, Site
from app.models.protocol import ProtocolEndpoint, ScheduleOfAssessment
from app.models.participant import Participant
from app.models.governance import (
    ChangeSet,
    ImpactNode,
    CompilationRun,
    Finding,
    Obligation,
    EvidenceItem,
)
from app.models.audit import AuditTrailRecord
from app.auth.security import hash_password
from app.services.ctri_ingestion import ingest_ctri_dataset

logger = logging.getLogger("ayu_trial_fabric.seed")
logging.basicConfig(level=logging.INFO)


def seed_database():
    """
    Idempotent database seeding script.
    Populates AYU-2026-0001, 3 sites, exactly 47 synthetic subjects,
    7 RBAC accounts, and governance demo fixtures tagged with is_demo_fixture=True.
    """
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        logger.info("Starting idempotent database seeding...")

        # 1. Seed RBAC Users
        default_pwd = hash_password("AyuTrial@2026")
        users_data = [
            {
                "id": "usr-pi-01",
                "email": "pi@aiia.gov.in",
                "name": "Prof. Dr. Anandita Sharma, MD (Ayurveda)",
                "role": RoleName.PI,
                "institution": "All India Institute of Ayurveda (AIIA), New Delhi",
                "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
                "permissions": ["view_trials", "edit_protocol", "approve_amendments", "sign_case_reports", "export_data"],
            },
            {
                "id": "usr-tc-02",
                "email": "coordinator@trialfabric.org",
                "name": "Rajesh Nair, M.Pharm (ClinRes)",
                "role": RoleName.COORDINATOR,
                "institution": "Central Coordinating Office — Ayush Trials Unit",
                "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
                "permissions": ["view_trials", "manage_participants", "schedule_visits", "log_queries", "site_operations"],
            },
            {
                "id": "usr-cra-03",
                "email": "monitor@cro-partners.in",
                "name": "Sunita Deshmukh, Lead CRA",
                "role": RoleName.MONITOR,
                "institution": "Quality & Clinical Monitoring Services",
                "avatar": "https://images.unsplash.com/photo-1594824813591-49fa5226462c?auto=format&fit=crop&q=80&w=200",
                "permissions": ["view_trials", "audit_sites", "verify_source_data", "issue_deviation_notices"],
            },
            {
                "id": "usr-iec-04",
                "email": "ethics@ccras.nic.in",
                "name": "Dr. Vikramaditya Joshi, MBBS, PhD (Bioethics)",
                "role": RoleName.ETHICS_REVIEWER,
                "institution": "Institutional Ethics Committee (IEC-Central)",
                "avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
                "permissions": ["review_ethics", "vote_amendments", "inspect_icfs", "request_protocol_clarification"],
            },
            {
                "id": "usr-pv-05",
                "email": "pv@cdsco-ayush.gov.in",
                "name": "Dr. Meera Nambiar, MD (Pharmacology)",
                "role": RoleName.PV,
                "institution": "National Pharmacovigilance Centre for Ayush",
                "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
                "permissions": ["view_trials", "adverse_event_triage", "cdsco_reporting", "safety_advisory_alerts"],
            },
            {
                "id": "usr-adm-06",
                "email": "admin@trialfabric.org",
                "name": "Kavita Sundaram",
                "role": RoleName.ADMIN,
                "institution": "AYU-TRIAL FABRIC Core Platform Administration",
                "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
                "permissions": ["full_platform_access", "user_provisioning", "integration_orchestration", "audit_logs"],
            },
            {
                "id": "usr-reg-07",
                "email": "regulator@cdsco.gov.in",
                "name": "Dr. S. K. Gupta, Joint Drugs Controller",
                "role": RoleName.REGULATOR,
                "institution": "Central Drugs Standard Control Organization (CDSCO)",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                "permissions": ["view_trials", "inspect_audits", "view_compliance_reports"],
            },
        ]

        for u_data in users_data:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                user = User(
                    id=u_data["id"],
                    email=u_data["email"],
                    name=u_data["name"],
                    hashed_password=default_pwd,
                    role=u_data["role"],
                    institution=u_data["institution"],
                    avatar=u_data["avatar"],
                    permissions=u_data["permissions"],
                    is_active=True,
                )
                db.add(user)

        # 2. Seed Canonical Trial AYU-2026-0001 (with ATF-001 alias)
        trial_record = db.query(Trial).filter(Trial.trial_id == "AYU-2026-0001").first()
        if not trial_record:
            trial_record = Trial(
                id="trial-001",
                trial_id="AYU-2026-0001",
                alias="ATF-001",
                protocol_id="AYU-CT-2026-042",
                title="Randomized Double-Blind Evaluation of Standardized Ashwagandha Lehyam & Guduchi Ghanvati in Post-Viral Fatigue Syndrome",
                short_title="Ashwagandha-Guduchi PVFS Study",
                system="Ayurveda",
                phase="Phase III",
                status="recruiting",
                formulation="Ashwagandha Lehyam (6g BD) + Guduchi Ghanvati (500mg BD)",
                indication="Post-Viral Chronic Fatigue & Immune Dysregulation",
                target_enrollment=360,
                enrolled_count=284,
                active_sites=3,
                number_of_sites=3,
                number_of_participants=47,
                recruitment_percentage=72.0,
                protocol_version="v1.0 (Active) / v1.1 (Proposed)",
                start_date="2025-11-15",
                estimated_end_date="2026-12-30",
                sponsor="Central Council for Research in Ayurvedic Sciences (CCRAS)",
                ctri_number="CTRI/2020/06/025557",
                scientific_title="A randomized open label multicentric clinical trial to evaluate the safety and efficacy of AYUSH 64 in mild to moderate COVID-19",
                study_type="Interventional",
                study_design="Randomized, Parallel Group, Active Controlled, Multicentric",
                health_condition="SARS-CoV-2 infection (Mild and Moderate COVID-19)",
                intervention="AYUSH-64 (Polyherbal formulation, 500mg tablets, 2 tabs thrice daily)",
                comparator="Standard of Care (SOC) according to ICMR/National Guidelines",
                primary_sponsor="Central Council for Research in Ayurvedic Sciences (CCRAS), Ministry of AYUSH",
                secondary_sponsor="Council of Scientific and Industrial Research (CSIR)",
                recruitment_status="Completed",
                first_enrollment_date="2020-06-08",
                study_duration="12 Months",
                target_sample_size=140,
                final_enrollment=140,
                country="India",
                source_registry="CTRI",
                source_url="https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid=CTRI/2020/06/025557",
                source_fetched_at="2026-09-27T00:00:00Z",
                pi_name="Prof. Dr. Anandita Sharma",
                lead_investigator="Dr. V. Sharma, MD (Ayu), PhD",
                active_amendment="CS-0001",
                budget_allocated=14500000.0,
                budget_utilized=8200000.0,
                sae_count=1,
                description="A multicenter randomized controlled demonstration study evaluating standardized Ayurvedic formulation efficacy and dynamic visit flex windows across clinical centers.",
            )
            db.add(trial_record)

        # 3. Seed 3 Participating Sites for AYU-2026-0001
        sites_data = [
            {
                "id": "site-01",
                "trial_id": "AYU-2026-0001",
                "site_id": "SITE-001",
                "site_code": "SITE-01-AIIA",
                "name": "All India Institute of Ayurveda — Center for Integrative Medicine",
                "site_name": "All India Institute of Ayurveda — Center for Integrative Medicine",
                "address": "Gautampuri, Sarita Vihar, Mathura Road, New Delhi 110076",
                "city": "New Delhi",
                "state": "Delhi",
                "country": "India",
                "location": "New Delhi, Delhi",
                "pi_name": "Prof. Dr. Anandita Sharma",
                "investigator": "Dr. V. Sharma",
                "contact_email": "aiia.trials@gov.in",
                "ethics_committee": "Institutional Ethics Committee, All India Institute of Ayurveda",
                "ethics_approval_status": "Approved - IEC/AIIA/2020/042",
                "source_registry": "CTRI",
                "source_url": "https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid=CTRI/2020/06/025557",
                "source_fetched_at": "2026-09-27T00:00:00Z",
                "status": "active",
                "activation_status": "ACTIVE",
                "governance_status": "READY",
                "target_enrollment": 60,
                "current_enrollment": 54,
                "participants": 18,
                "training_pct": 92.0,
                "documents_pct": 100.0,
                "iec_approval_date": "2025-10-12",
                "last_monitor_visit": "2026-02-18",
                "open_queries": 3,
                "compliance_rate": 98.2,
            },
            {
                "id": "site-02",
                "trial_id": "AYU-2026-0001",
                "site_id": "SITE-002",
                "site_code": "SITE-02-NIAJ",
                "name": "National Institute of Ayurveda — Dept of Kayachikitsa",
                "site_name": "National Institute of Ayurveda — Dept of Kayachikitsa",
                "address": "Madhav Vilas Palace, Amer Road, Jaipur, Rajasthan 302002",
                "city": "Jaipur",
                "state": "Rajasthan",
                "country": "India",
                "location": "Jaipur, Rajasthan",
                "pi_name": "Prof. Sanjeev Sharma",
                "investigator": "Prof. Sanjeev Sharma",
                "contact_email": "nia.research@nia.nic.in",
                "ethics_committee": "Institutional Ethics Committee, National Institute of Ayurveda",
                "ethics_approval_status": "Approved - IEC/NIA/2020/019",
                "source_registry": "CTRI",
                "source_url": "https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid=CTRI/2020/06/025557",
                "source_fetched_at": "2026-09-27T00:00:00Z",
                "status": "recruiting",
                "activation_status": "ACTIVE",
                "governance_status": "READY",
                "target_enrollment": 50,
                "current_enrollment": 41,
                "participants": 15,
                "training_pct": 95.0,
                "documents_pct": 100.0,
                "iec_approval_date": "2025-10-28",
                "last_monitor_visit": "2026-02-25",
                "open_queries": 1,
                "compliance_rate": 95.8,
            },
            {
                "id": "site-03",
                "trial_id": "AYU-2026-0001",
                "site_id": "SITE-003",
                "site_code": "SITE-03-IPGT",
                "name": "ITRA Institute of Teaching & Research in Ayurveda",
                "site_name": "ITRA Institute of Teaching & Research in Ayurveda",
                "address": "Opposite B-Division Police Station, Gurudwara Road, Jamnagar, Gujarat 361008",
                "city": "Jamnagar",
                "state": "Gujarat",
                "country": "India",
                "location": "Jamnagar, Gujarat",
                "pi_name": "Dr. Anup Thakar",
                "investigator": "Dr. Anup Thakar",
                "contact_email": "itra.trials@ayush.edu.in",
                "ethics_committee": "Institutional Ethics Committee, ITRA Jamnagar",
                "ethics_approval_status": "Approved - IEC/ITRA/2020/033",
                "source_registry": "CTRI",
                "source_url": "https://ctri.nic.in/Clinicaltrials/pmaindet2.php?trialid=CTRI/2020/06/025557",
                "source_fetched_at": "2026-09-27T00:00:00Z",
                "status": "active",
                "activation_status": "ACTIVE",
                "governance_status": "READY",
                "target_enrollment": 50,
                "current_enrollment": 47,
                "participants": 14,
                "training_pct": 90.0,
                "documents_pct": 100.0,
                "iec_approval_date": "2025-11-04",
                "last_monitor_visit": "2026-03-01",
                "open_queries": 0,
                "compliance_rate": 99.1,
            },
        ]

        for s_data in sites_data:
            existing = db.query(Site).filter(Site.site_id == s_data["site_id"]).first()
            if not existing:
                db.add(Site(**s_data))

        # Ingest remaining 10 CTRI records into database
        ingest_ctri_dataset(db)
        db.flush()

        # 4. Seed Exactly 47 Synthetic Participants (Site 1: 18, Site 2: 15, Site 3: 14)
        prakritis = ["Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridosha", "Kapha-Vata"]
        agnis = ["Samagni", "Vishamagni", "Tikshnagni", "Mandagni"]
        arms = ["Arm A (Investigational Formulation)", "Arm B (Active Comparator)"]

        # Check existing count
        current_p_count = db.query(Participant).filter(Participant.trial_id == "AYU-2026-0001").count()
        if current_p_count < 47:
            p_index = 1
            # Site 1: 18 participants
            for i in range(1, 19):
                pid = f"PT-{p_index:03d}"
                p = Participant(
                    id=f"pt-ops-{p_index:03d}",
                    participant_id=pid,
                    subject_code=f"SUBJ-101-{i:03d}",
                    trial_id="AYU-2026-0001",
                    site_id="SITE-001",
                    site_code="SITE-01-AIIA",
                    site_name="All India Institute of Ayurveda",
                    site="All India Institute of Ayurveda (SITE-001)",
                    enrollment_date="2025-11-20",
                    visit_status="Visit 3 Complete" if i <= 10 else "Visit 2 Complete",
                    consent="Signed (e-ICF v2.1)",
                    safety="SAE Flagged" if i == 5 else ("Mild AE (Resolved)" if i % 4 == 0 else "No AE"),
                    protocol_version="Protocol v1.0",
                    cohort_arm=arms[i % 2],
                    arm=arms[i % 2],
                    age=32 + (i % 28),
                    gender="Female" if i % 2 == 0 else "Male",
                    prakriti=prakritis[i % len(prakritis)],
                    agni=agnis[i % len(agnis)],
                    status="active",
                    current_visit="Week 8 (V4)",
                    adherence_rate=95.0 + (i % 5),
                    adverse_events_count=1 if i in [4, 5, 8] else 0,
                    timeline=[
                        {"step": "Screening", "status": "completed", "date": "2025-11-15", "notes": "Eligibility verified."},
                        {"step": "Enrollment", "status": "completed", "date": "2025-11-20", "notes": "Dispensation given."},
                        {"step": "Visit 1", "status": "completed", "date": "2025-12-18", "notes": "Labs normal."},
                        {"step": "Visit 2", "status": "completed", "date": "2026-01-16", "notes": "CFS-11 score down 40%."},
                        {"step": "Visit 3", "status": "upcoming" if i > 10 else "completed", "date": "2026-02-14", "notes": "Endpoint assessment."},
                    ],
                )
                db.add(p)
                p_index += 1

            # Site 2: 15 participants
            for i in range(1, 16):
                pid = f"PT-{p_index:03d}"
                p = Participant(
                    id=f"pt-ops-{p_index:03d}",
                    participant_id=pid,
                    subject_code=f"SUBJ-102-{i:03d}",
                    trial_id="AYU-2026-0001",
                    site_id="SITE-002",
                    site_code="SITE-02-NIAJ",
                    site_name="National Institute of Ayurveda",
                    site="National Institute of Ayurveda (SITE-002)",
                    enrollment_date="2025-12-05",
                    visit_status="Visit 2 Complete" if i <= 8 else "Visit 1 Complete",
                    consent="Signed (e-ICF v2.1)",
                    safety="Mild AE (Resolved)" if i == 3 else "No AE",
                    protocol_version="Protocol v1.0",
                    cohort_arm=arms[i % 2],
                    arm=arms[i % 2],
                    age=30 + (i % 30),
                    gender="Female" if i % 2 == 1 else "Male",
                    prakriti=prakritis[(i + 1) % len(prakritis)],
                    agni=agnis[(i + 1) % len(agnis)],
                    status="active",
                    current_visit="Week 8 (V4)",
                    adherence_rate=94.0 + (i % 6),
                    adverse_events_count=1 if i == 3 else 0,
                    timeline=[
                        {"step": "Screening", "status": "completed", "date": "2025-11-28", "notes": "Criteria satisfied."},
                        {"step": "Enrollment", "status": "completed", "date": "2025-12-05", "notes": "Arm allocation done."},
                        {"step": "Visit 1", "status": "completed", "date": "2026-01-04", "notes": "Safety labs normal."},
                        {"step": "Visit 2", "status": "current" if i > 8 else "completed", "date": "2026-02-02", "notes": "Midpoint reviews."},
                        {"step": "Visit 3", "status": "upcoming", "date": "2026-03-15", "notes": "Pending."},
                    ],
                )
                db.add(p)
                p_index += 1

            # Site 3: 14 participants
            for i in range(1, 15):
                pid = f"PT-{p_index:03d}"
                p = Participant(
                    id=f"pt-ops-{p_index:03d}",
                    participant_id=pid,
                    subject_code=f"SUBJ-103-{i:03d}",
                    trial_id="AYU-2026-0001",
                    site_id="SITE-003",
                    site_code="SITE-03-IPGT",
                    site_name="ITRA Jamnagar Center",
                    site="ITRA Jamnagar Center (SITE-003)",
                    enrollment_date="2026-01-05",
                    visit_status="Visit 1 Complete",
                    consent="Signed (e-ICF v2.1)",
                    safety="No AE",
                    protocol_version="Protocol v1.0",
                    cohort_arm=arms[i % 2],
                    arm=arms[i % 2],
                    age=35 + (i % 25),
                    gender="Male" if i % 2 == 0 else "Female",
                    prakriti=prakritis[(i + 2) % len(prakritis)],
                    agni=agnis[(i + 2) % len(agnis)],
                    status="active",
                    current_visit="Week 4 (V3)",
                    adherence_rate=96.0 + (i % 4),
                    adverse_events_count=0,
                    timeline=[
                        {"step": "Screening", "status": "completed", "date": "2025-12-28", "notes": "Informed consent verified."},
                        {"step": "Enrollment", "status": "completed", "date": "2026-01-05", "notes": "Supply dispensed."},
                        {"step": "Visit 1", "status": "completed", "date": "2026-02-03", "notes": "Adherence 96%."},
                        {"step": "Visit 2", "status": "upcoming", "date": "2026-03-28", "notes": "Scheduled."},
                        {"step": "Visit 3", "status": "upcoming", "date": "2026-04-25", "notes": "Scheduled."},
                    ],
                )
                db.add(p)
                p_index += 1

        # 5. Seed Protocol Endpoints & Schedule of Assessments
        endpoints_data = [
            {"id": "ep-01", "trial_id": "AYU-2026-0001", "type": "Primary", "description": "Change in Chalder Fatigue Scale (CFS-11) score from Baseline to Week 12", "timeframe": "Baseline, Week 4, Week 8, Week 12", "measurement_tool": "Validated CFS-11 Questionnaire"},
            {"id": "ep-02", "trial_id": "AYU-2026-0001", "type": "Primary", "description": "Proportion of subjects achieving >= 50% reduction in fatigue score without relapse", "timeframe": "Week 12 and Week 16 (Follow-up)", "measurement_tool": "Responder Analysis Algorithm"},
            {"id": "ep-03", "trial_id": "AYU-2026-0001", "type": "Secondary", "description": "Serum Ojas/Immune markers (hs-CRP, IL-6, Natural Killer Cell Activity)", "timeframe": "Baseline, Week 12", "measurement_tool": "Centralized CLIA Lab Chemiluminescence"},
            {"id": "ep-04", "trial_id": "AYU-2026-0001", "type": "Secondary", "description": "Standardized Ayush Dosha Prakriti balance index and Agni score", "timeframe": "Baseline, Week 4, Week 8, Week 12", "measurement_tool": "CCRAS Validated Prakriti & Agni Assessment Inventory"},
            {"id": "ep-05", "trial_id": "AYU-2026-0001", "type": "Exploratory", "description": "Sleep quality improvement evaluated via PSQI", "timeframe": "Every 2 weeks", "measurement_tool": "Continuous Actigraphy + Digital ePRO App"},
        ]
        for ep in endpoints_data:
            if not db.query(ProtocolEndpoint).filter(ProtocolEndpoint.id == ep["id"]).first():
                db.add(ProtocolEndpoint(**ep))

        soa_data = [
            {"id": "soa-v1", "trial_id": "AYU-2026-0001", "visit_id": "V1", "visit_name": "Screening (Days -14 to 0)", "day_offset": "-14 to 0", "window_days": "±2 days", "activities": [{"name": "Informed Consent & Prakriti Assessment", "category": "Ayush Dosha/Prakriti", "required": True}, {"name": "Vital Signs & Labs", "category": "Safety", "required": True}]},
            {"id": "soa-v2", "trial_id": "AYU-2026-0001", "visit_id": "V2", "visit_name": "Baseline & Randomization (Day 1)", "day_offset": "Day 1", "window_days": "0 days", "activities": [{"name": "Arm Allocation", "category": "Investigational Product", "required": True}, {"name": "First Dispensation", "category": "Investigational Product", "required": True}]},
            {"id": "soa-v3", "trial_id": "AYU-2026-0001", "visit_id": "V3", "visit_name": "Interim Assessment (Week 4)", "day_offset": "Day 28", "window_days": "±3 days", "activities": [{"name": "CFS-11 Fatigue Battery", "category": "Efficacy", "required": True}, {"name": "Safety Blood Labs", "category": "Safety", "required": True}]},
            {"id": "soa-v4", "trial_id": "AYU-2026-0001", "visit_id": "V4", "visit_name": "Mid-Point Evaluation (Week 8)", "day_offset": "Day 56", "window_days": "±3 days", "activities": [{"name": "Full Efficacy Battery", "category": "Efficacy", "required": True}, {"name": "Adverse Event Monitoring", "category": "Safety", "required": True}, {"name": "Formulation Refill", "category": "Investigational Product", "required": True}]},
            {"id": "soa-v5", "trial_id": "AYU-2026-0001", "visit_id": "V5", "visit_name": "End of Treatment (Week 12)", "day_offset": "Day 84", "window_days": "±4 days", "activities": [{"name": "Primary Endpoint Assessment", "category": "Efficacy", "required": True}, {"name": "Comprehensive Serum Biomarkers", "category": "Biomarker", "required": True}]},
        ]
        for soa in soa_data:
            if not db.query(ScheduleOfAssessment).filter(ScheduleOfAssessment.id == soa["id"]).first():
                db.add(ScheduleOfAssessment(**soa))

        # 6. Seed ChangeSet CS-0001
        if not db.query(ChangeSet).filter(ChangeSet.id == "CS-0001").first():
            cs = ChangeSet(
                id="CS-0001",
                trial_id="AYU-2026-0001",
                trial_name="AYU-TRIAL FABRIC Demonstration Trial",
                protocol="v1.1",
                type="Protocol Amendment",
                previous_state="Day 25–31",
                new_state="Day 25–35",
                change="Visit 4 schedule: Day 25–31 → Day 25–35",
                affected_entities=["Sites (3)", "Participants (47)", "Visit 4", "CRF", "EDC Mapping", "Ethics", "Training", "Consent"],
                effective_date="2026-03-15",
                status="IN REVIEW",
                created="Today",
            )
            db.add(cs)

        # 7. Seed Impact Nodes
        impact_nodes = [
            {"id": "node-root", "changeset_id": "CS-0001", "label": "CS-0001", "entity": "ChangeSet CS-0001", "category": "Root", "severity": "HIGH", "reason": "Protocol Amendment expanding Visit 4 schedule window from Day 25–31 to Day 25–35.", "relationship_desc": "Root ChangeSet Docket", "has_children": True},
            {"id": "node-sites", "changeset_id": "CS-0001", "label": "Sites", "entity": "Investigational Sites", "category": "Sites", "severity": "MEDIUM", "reason": "3 trial centers have active subjects currently approaching Day 25.", "relationship_desc": "Impacted Trial Centers", "parent_id": "node-root", "has_children": True, "meta_info": {"count": 3}},
            {"id": "node-site-01", "changeset_id": "CS-0001", "label": "Site 01", "entity": "Site 01 (AIIA New Delhi)", "category": "Sites", "severity": "MEDIUM", "reason": "18 active participants scheduled for Visit 4.", "relationship_desc": "Site Cluster Branch", "parent_id": "node-sites", "meta_info": {"count": 18, "code": "SITE-01-AIIA"}},
            {"id": "node-site-02", "changeset_id": "CS-0001", "label": "Site 02", "entity": "Site 02 (NIA Jaipur)", "category": "Sites", "severity": "MEDIUM", "reason": "15 active participants eligible for 4-day flex window.", "relationship_desc": "Site Cluster Branch", "parent_id": "node-sites", "meta_info": {"count": 15, "code": "SITE-02-NIAJ"}},
            {"id": "node-site-03", "changeset_id": "CS-0001", "label": "Site 03", "entity": "Site 03 (ITRA Jamnagar)", "category": "Sites", "severity": "LOW", "reason": "14 active participants scheduled for clinic visits.", "relationship_desc": "Site Cluster Branch", "parent_id": "node-sites", "meta_info": {"count": 14, "code": "SITE-03-IPGT"}},
            {"id": "node-participants", "changeset_id": "CS-0001", "label": "Participants", "entity": "Participants", "category": "Participants", "severity": "HIGH", "reason": "47 enrolled subjects require re-synchronized appointment windows.", "relationship_desc": "Subject Cohort Flow", "parent_id": "node-root", "has_children": True, "meta_info": {"count": 47}},
            {"id": "node-visit-4", "changeset_id": "CS-0001", "label": "Visit 4", "entity": "Visit 4", "category": "Protocol", "severity": "HIGH", "reason": "Visit schedule changed from Day 25–31 to Day 25–35.", "relationship_desc": "Direct Schedule Amendment", "parent_id": "node-root", "meta_info": {"code": "V4 (Day 25–35)"}},
            {"id": "node-crf", "changeset_id": "CS-0001", "label": "CRF", "entity": "CRF", "category": "Systems", "severity": "MEDIUM", "reason": "CRF module for Visit 4 requires updated validation stamps.", "relationship_desc": "Data Collection Instrument", "parent_id": "node-root", "meta_info": {"code": "CRF-V4-v1.1"}},
            {"id": "node-edc", "changeset_id": "CS-0001", "label": "EDC", "entity": "EDC", "category": "Systems", "severity": "MEDIUM", "reason": "Electronic Data Capture rules must update allowable visit date logic.", "relationship_desc": "EDC Validation Matrix", "parent_id": "node-root", "meta_info": {"code": "EDC-RULE-V4"}},
            {"id": "node-ethics", "changeset_id": "CS-0001", "label": "Ethics", "entity": "Ethics", "category": "Governance", "severity": "HIGH", "reason": "Institutional Ethics Committee approval notice required.", "relationship_desc": "Regulatory & Bioethics Clearance", "parent_id": "node-root", "meta_info": {"code": "IEC-AMD-v1.1"}},
            {"id": "node-training", "changeset_id": "CS-0001", "label": "Training", "entity": "Training", "category": "Governance", "severity": "LOW", "reason": "15-minute briefing session for Site CRCs on revised scheduling.", "relationship_desc": "Site Staff Operations", "parent_id": "node-root", "meta_info": {"code": "SOP-TR-004"}},
            {"id": "node-consent", "changeset_id": "CS-0001", "label": "Consent", "entity": "Consent", "category": "Governance", "severity": "MEDIUM", "reason": "Patient Information Sheet (PIS) addendum confirming patient agreement.", "relationship_desc": "Participant Ethical Protection", "parent_id": "node-root", "meta_info": {"code": "ICF-ADD-v1.1"}},
        ]
        for node in impact_nodes:
            if not db.query(ImpactNode).filter(ImpactNode.id == node["id"]).first():
                db.add(ImpactNode(**node))

        # 8. Seed Governance Demo Fixtures (Findings, Obligations, Evidence)
        # Marked with is_demo_fixture=True, source="seed"
        findings_data = [
            {"id": "F-001", "changeset_id": "CS-0001", "type": "BLOCK", "title": "IEC notification required", "description": "Protocol amendment affects Visit 4 timing and requires ethics notification.", "severity": "HIGH", "status": "OPEN", "rule": "RULE-ETHICS-01", "affected_entity": "Ethics (IEC)", "obligation_id": "OBL-01", "is_demo_fixture": True, "source": "seed"},
            {"id": "F-002", "changeset_id": "CS-0001", "type": "BLOCK", "title": "Consent document update required", "description": "Patient Information Sheet addendum is required before implementation.", "severity": "HIGH", "status": "OPEN", "rule": "RULE-CONSENT-02", "affected_entity": "Consent", "obligation_id": "OBL-02", "is_demo_fixture": True, "source": "seed"},
            {"id": "F-003", "changeset_id": "CS-0001", "type": "BLOCK", "title": "Site training required", "description": "CRC operational briefing must be completed for affected sites.", "severity": "MEDIUM", "status": "OPEN", "rule": "RULE-OPS-03", "affected_entity": "Sites (3)", "obligation_id": "OBL-03", "is_demo_fixture": True, "source": "seed"},
            {"id": "F-004", "changeset_id": "CS-0001", "type": "WARNING", "title": "EDC mapping review", "description": "REDCap eCRF visit-window mapping should be reviewed.", "severity": "MEDIUM", "status": "OPEN", "rule": "RULE-DATA-04", "affected_entity": "EDC Mapping", "obligation_id": "OBL-04", "is_demo_fixture": True, "source": "seed"},
        ]
        for f in findings_data:
            if not db.query(Finding).filter(Finding.id == f["id"]).first():
                db.add(Finding(**f))

        obligations_data = [
            {"id": "OBL-01", "changeset_id": "CS-0001", "obligation": "IEC notification", "owner": "Regulatory", "status": "OPEN", "deadline": "2026-03-10", "severity": "HIGH", "finding_id": "F-001", "is_demo_fixture": True, "source": "seed"},
            {"id": "OBL-02", "changeset_id": "CS-0001", "obligation": "Consent addendum", "owner": "Ethics", "status": "OPEN", "deadline": "2026-03-12", "severity": "HIGH", "finding_id": "F-002", "is_demo_fixture": True, "source": "seed"},
            {"id": "OBL-03", "changeset_id": "CS-0001", "obligation": "CRC training", "owner": "Trial Operations", "status": "OPEN", "deadline": "2026-03-14", "severity": "MEDIUM", "finding_id": "F-003", "is_demo_fixture": True, "source": "seed"},
            {"id": "OBL-04", "changeset_id": "CS-0001", "obligation": "EDC mapping review", "owner": "Data Management", "status": "OPEN", "deadline": "2026-03-15", "severity": "MEDIUM", "finding_id": "F-004", "is_demo_fixture": True, "source": "seed"},
        ]
        for o in obligations_data:
            if not db.query(Obligation).filter(Obligation.id == o["id"]).first():
                db.add(Obligation(**o))

        evidence_data = [
            {"id": "EVD-01", "changeset_id": "CS-0001", "title": "IEC Notification Letter", "status": "MISSING", "button_text": "ADD EVIDENCE", "file_hint": "Dossier acknowledgement receipt from Central Ethics Board", "is_demo_fixture": True, "source": "seed"},
            {"id": "EVD-02", "changeset_id": "CS-0001", "title": "Consent Addendum", "status": "MISSING", "button_text": "ADD EVIDENCE", "file_hint": "Patient Information Sheet v1.1 addendum approved", "is_demo_fixture": True, "source": "seed"},
            {"id": "EVD-03", "changeset_id": "CS-0001", "title": "Training Completion Record", "status": "MISSING", "button_text": "ADD EVIDENCE", "file_hint": "Site CRC sign-off certificates across 3 centers", "is_demo_fixture": True, "source": "seed"},
            {"id": "EVD-04", "changeset_id": "CS-0001", "title": "EDC Mapping Verification", "status": "AVAILABLE", "button_text": "VIEW", "file_hint": "REDCap visit window schema validation hash: 0x8F9C2B", "file_url": "/evidence/edc_mapping_hash_0x8f9c2b.pdf", "verified_by": "Data Management QA", "verification_hash": "0x8F9C2B", "is_demo_fixture": True, "source": "seed"},
        ]
        for e in evidence_data:
            if not db.query(EvidenceItem).filter(EvidenceItem.id == e["id"]).first():
                db.add(EvidenceItem(**e))

        # 9. Seed Cryptographic Audit Trail Records
        from app.services.audit_service import compute_record_hash, GENESIS_HASH
        from app.models.audit import AuditChainState

        audit_events = [
            {
                "id": "EVT-001", "changeset_id": "CS-0001", "step": "STEP 1", "title": "ChangeSet Created",
                "timestamp_display": "Today, 10:14:02 IST", "actor": "Dr. V. Sharma (Lead PI)",
                "description": "ChangeSet CS-0001 drafted for Trial ATF-001 targeting Protocol v1.1 (Visit 4 Day 25–31 → Day 25–35 flex window).",
                "status": "SUBMITTED", "who": "Dr. V. Sharma (Lead PI)", "what": "CHANGESET_CREATED",
                "when_timestamp": "2026-03-04T10:14:02Z",
                "why": "ChangeSet CS-0001 drafted for Trial ATF-001 targeting Protocol v1.1 (Visit 4 Day 25–31 → Day 25–35 flex window).",
                "evidence_ref": "N/A - Initial Proposal", "outcome": "SUBMITTED"
            },
            {
                "id": "EVT-002", "changeset_id": "CS-0001", "step": "STEP 2", "title": "Impact Analysis Completed",
                "timestamp_display": "Today, 10:14:28 IST", "actor": "Automated Dependency Engine v2.4",
                "description": "Traversed trial data schema and resolved blast radius: 3 Sites, 47 Participants, 1 Visit Window, 1 CRF, 1 EDC Mapping, Ethics, Training, and Consent.",
                "status": "PASSED", "who": "Automated Dependency Engine v2.4", "what": "IMPACT_ANALYSIS",
                "when_timestamp": "2026-03-04T10:14:28Z",
                "why": "Traversed trial data schema and resolved blast radius: 3 Sites, 47 Participants, 1 Visit Window, 1 CRF, 1 EDC Mapping, Ethics, Training, and Consent.",
                "evidence_ref": "Schema Dependency Graph v2.4", "outcome": "PASSED"
            },
            {
                "id": "EVT-003", "changeset_id": "CS-0001", "step": "STEP 3", "title": "Compilation Failed",
                "timestamp_display": "Today, 10:15:05 IST", "actor": "Fabric Governance Compiler",
                "description": "Pre-flight gate check triggered BUILD FAILED due to unfulfilled procedural and regulatory prerequisites.",
                "status": "FAILED", "who": "Fabric Governance Compiler", "what": "COMPILATION_FAILED",
                "when_timestamp": "2026-03-04T10:15:05Z",
                "why": "Pre-flight gate check triggered BUILD FAILED due to unfulfilled procedural and regulatory prerequisites.",
                "evidence_ref": "CMP-000128", "outcome": "FAILED"
            },
            {
                "id": "EVT-004", "changeset_id": "CS-0001", "step": "STEP 4", "title": "Findings Generated",
                "timestamp_display": "Today, 10:15:06 IST", "actor": "Rules Synthesizer",
                "description": "Formally logged 3 Blocking Findings (F-001: IEC Notification, F-002: Consent Addendum, F-003: Site Training) and 1 Warning (F-004: EDC Mapping).",
                "status": "WARNING", "who": "Rules Synthesizer", "what": "FINDINGS_GENERATED",
                "when_timestamp": "2026-03-04T10:15:06Z",
                "why": "Formally logged 3 Blocking Findings (F-001: IEC Notification, F-002: Consent Addendum, F-003: Site Training) and 1 Warning (F-004: EDC Mapping).",
                "evidence_ref": "Rule Registry v1.0 (10 Rules)", "outcome": "WARNING"
            },
            {
                "id": "EVT-005", "changeset_id": "CS-0001", "step": "STEP 5", "title": "Evidence Added",
                "timestamp_display": "Today, 10:16:42 IST", "actor": "Clinical Operations & Regulatory QA",
                "description": "Uploaded verified regulatory dossier acknowledgement, Patient Information Sheet addendum, and CRC training sign-offs. Verified 4 / 4 evidence artifacts.",
                "status": "PASSED", "who": "Clinical Operations & Regulatory QA", "what": "EVIDENCE_SUBMITTED",
                "when_timestamp": "2026-03-04T10:16:42Z",
                "why": "Uploaded verified regulatory dossier acknowledgement, Patient Information Sheet addendum, and CRC training sign-offs. Verified 4 / 4 evidence artifacts.",
                "evidence_ref": "EVD-01, EVD-02, EVD-03, EVD-04", "outcome": "PASSED"
            },
            {
                "id": "EVT-006", "changeset_id": "CS-0001", "step": "STEP 6", "title": "Compilation Passed",
                "timestamp_display": "Today, 10:17:15 IST", "actor": "Fabric Governance Compiler",
                "description": "Re-evaluated all 9 governance pipeline checkpoints. Zero blocking findings detected. All rule constraints satisfied.",
                "status": "PASSED", "who": "Fabric Governance Compiler", "what": "RECOMPILATION_PASSED",
                "when_timestamp": "2026-03-04T10:17:15Z",
                "why": "Re-evaluated all 9 governance pipeline checkpoints. Zero blocking findings detected. All rule constraints satisfied.",
                "evidence_ref": "CMP-000129", "outcome": "PASSED"
            },
            {
                "id": "EVT-007", "changeset_id": "CS-0001", "step": "STEP 7", "title": "Implementation Ready",
                "timestamp_display": "Today, 10:17:18 IST", "actor": "Trial Governance Board",
                "description": "ChangeSet CS-0001 certified for immediate, synchronized operational rollout across Sites 01, 02, and 03.",
                "status": "READY", "who": "Trial Governance Board", "what": "READINESS_CERTIFIED",
                "when_timestamp": "2026-03-04T10:17:18Z",
                "why": "ChangeSet CS-0001 certified for immediate, synchronized operational rollout across Sites 01, 02, and 03.",
                "evidence_ref": "Governance Board Certification Dossier", "outcome": "READY"
            }
        ]

        parent = GENESIS_HASH
        for evt in audit_events:
            evt["parent_hash"] = parent
            h = compute_record_hash(
                parent_hash=parent,
                changeset_id=evt["changeset_id"],
                who=evt["who"],
                what=evt["what"],
                when_timestamp=evt["when_timestamp"],
                why=evt["why"],
                evidence_ref=evt["evidence_ref"],
                outcome=evt["outcome"],
            )
            evt["hash"] = h
            parent = h
            if not db.query(AuditTrailRecord).filter(AuditTrailRecord.id == evt["id"]).first():
                db.add(AuditTrailRecord(**evt))

        if not db.query(AuditChainState).filter(AuditChainState.changeset_id == "CS-0001").first():
            db.add(AuditChainState(changeset_id="CS-0001", last_hash=parent, sequence=len(audit_events)))

        db.commit()
        logger.info("Database seeding completed successfully and idempotently!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
