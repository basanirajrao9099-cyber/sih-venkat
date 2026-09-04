from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.rules.models import RuleFinding, FindingLevel
from app.models.governance import Obligation, EvidenceItem
from app.schemas.governance import ObligationSchema, EvidenceItemSchema


class ObligationGenerator:
    """
    Generates actionable governance obligations and required evidence items
    from rule evaluation findings.
    Flow: Finding -> Obligation -> Owner -> Deadline -> Evidence Item
    """

    OBLIGATION_BLUEPRINTS: Dict[str, Dict[str, str]] = {
        "F-001": {
            "obligation": "IEC notification",
            "owner": "Regulatory",
            "deadline": "2026-03-10",
            "severity": "HIGH",
            "evidence_id": "EVD-01",
            "evidence_title": "IEC Notification Letter",
            "button_text": "ADD EVIDENCE",
            "file_hint": "Dossier acknowledgement receipt from Central Ethics Board",
        },
        "F-002": {
            "obligation": "Consent addendum",
            "owner": "Ethics",
            "deadline": "2026-03-12",
            "severity": "HIGH",
            "evidence_id": "EVD-02",
            "evidence_title": "Consent Addendum",
            "button_text": "ADD EVIDENCE",
            "file_hint": "Patient Information Sheet v1.1 addendum approved",
        },
        "F-003": {
            "obligation": "CRC training",
            "owner": "Trial Operations",
            "deadline": "2026-03-14",
            "severity": "MEDIUM",
            "evidence_id": "EVD-03",
            "evidence_title": "Training Completion Record",
            "button_text": "ADD EVIDENCE",
            "file_hint": "Site CRC sign-off certificates across 3 centers",
        },
        "F-004": {
            "obligation": "EDC mapping review",
            "owner": "Data Management",
            "deadline": "2026-03-15",
            "severity": "MEDIUM",
            "evidence_id": "EVD-04",
            "evidence_title": "EDC Mapping Verification",
            "button_text": "VIEW",
            "file_hint": "REDCap visit window schema validation hash: 0x8F9C2B",
            "status": "AVAILABLE",
        },
    }

    def generate_for_findings(
        self,
        findings: List[RuleFinding],
        changeset_id: str,
        db: Session,
    ) -> Tuple[List[ObligationSchema], List[EvidenceItemSchema]]:
        generated_obligations: List[ObligationSchema] = []
        generated_evidence: List[EvidenceItemSchema] = []

        for finding in findings:
            fid = finding.findingId
            blueprint = self.OBLIGATION_BLUEPRINTS.get(fid)
            if not blueprint:
                continue

            obl_id = f"OBL-{int(fid.split('-')[-1]):02d}" if changeset_id == "CS-0001" else f"{changeset_id}-OBL-{int(fid.split('-')[-1]):02d}"
            evd_id = blueprint["evidence_id"] if changeset_id == "CS-0001" else f"{changeset_id}-{blueprint['evidence_id']}"

            # 1. Synchronize Obligation
            db_obl = db.query(Obligation).filter(
                Obligation.id == obl_id,
                Obligation.changeset_id == changeset_id,
            ).first()

            if not db_obl:
                db_obl = Obligation(
                    id=obl_id,
                    changeset_id=changeset_id,
                    obligation=blueprint["obligation"],
                    owner=blueprint["owner"],
                    status="OPEN",
                    deadline=blueprint["deadline"],
                    severity=blueprint["severity"],
                    finding_id=fid,
                    is_demo_fixture=False,
                    source="engine",
                )
                db.add(db_obl)

            generated_obligations.append(
                ObligationSchema(
                    id=db_obl.id,
                    obligation=db_obl.obligation,
                    owner=db_obl.owner,
                    status=db_obl.status,
                    deadline=db_obl.deadline,
                    severity=db_obl.severity,
                    findingId=db_obl.finding_id,
                    isDemoFixture=db_obl.is_demo_fixture,
                    source=db_obl.source,
                )
            )

            # 2. Synchronize Evidence Requirement
            db_evd = db.query(EvidenceItem).filter(
                EvidenceItem.id == evd_id,
                EvidenceItem.changeset_id == changeset_id,
            ).first()

            initial_status = blueprint.get("status", "MISSING")
            if not db_evd:
                db_evd = EvidenceItem(
                    id=evd_id,
                    changeset_id=changeset_id,
                    title=blueprint["evidence_title"],
                    status=initial_status,
                    button_text=blueprint["button_text"],
                    file_hint=blueprint["file_hint"],
                    is_demo_fixture=False,
                    source="engine",
                )
                db.add(db_evd)

            generated_evidence.append(
                EvidenceItemSchema(
                    id=db_evd.id,
                    title=db_evd.title,
                    status=db_evd.status,
                    buttonText=db_evd.button_text,
                    fileHint=db_evd.file_hint,
                    fileUrl=db_evd.file_url,
                    verifiedBy=db_evd.verified_by,
                    verificationHash=db_evd.verification_hash,
                    isDemoFixture=db_evd.is_demo_fixture,
                    source=db_evd.source,
                )
            )

        db.commit()
        return generated_obligations, generated_evidence


obligation_generator = ObligationGenerator()
