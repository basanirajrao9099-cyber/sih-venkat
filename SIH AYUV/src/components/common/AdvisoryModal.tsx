import React from 'react';
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';

export interface AdvisoryFindingExplanation {
  findingId: string;
  ruleCode: string;
  ruleTitle: string;
  severity: string;
  plainEnglishExplanation: string;
  clinicalSafetyContext?: string;
  statutoryCitation: string;
  secondaryCitation?: string;
  regulatoryBody: string;
  bindingLevel: string;
  actionableRemediation: string;
  requiredEvidenceDocument?: string;
  isAdvisory: boolean;
  disclaimer?: string;
}

interface AdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AdvisoryFindingExplanation | null;
  loading?: boolean;
}

export const AdvisoryModal: React.FC<AdvisoryModalProps> = ({
  isOpen,
  onClose,
  data,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#EAF4EF] text-[#2E7D5B] border border-[#A7D7C1] shadow-sm">
            <Sparkles className="w-5 h-5 text-[#2E7D5B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#26352D]">AI Regulatory Advisory</span>
              <Badge variant="info" size="sm">
                NON-BINDING ASSISTIVE
              </Badge>
            </div>
            <p className="text-xs text-[#66736B] font-normal mt-0.5">
              Statutory grounding & clinical remediation guidance from verified rule catalog
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono font-bold text-[#66736B]">
            Rule Engine • Read-Only Advisory Session
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close Advisory
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#2E7D5B] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#26352D]">
            Consulting Indian Clinical Trial Statutory Knowledge Base...
          </p>
          <p className="text-xs text-[#66736B]">
            Fetching statutory citations (ICMR 2017 & NDCT Rules 2019)
          </p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Top metadata row */}
          <div className="p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E4D9] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-1 rounded-lg border border-[#A7D7C1]">
                {data.findingId}
              </span>
              <span className="font-mono text-xs font-bold text-[#26352D]">
                {data.ruleCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.severity === 'HIGH' ? 'danger' : 'warning'} size="sm">
                {data.severity} SEVERITY
              </Badge>
              <Badge variant="success" size="sm">
                {data.bindingLevel || 'STATUTORY_BINDING'}
              </Badge>
            </div>
          </div>

          {/* Statutory Citation Box */}
          <div className="p-4 rounded-2xl bg-[#EAF4EF] border border-[#A7D7C1] space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#2E7D5B]">
              <BookOpen className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Statutory Regulatory Citation
              </h4>
            </div>
            <p className="text-sm font-bold text-[#26352D]">
              {data.statutoryCitation}
            </p>
            {data.secondaryCitation && (
              <p className="text-xs text-[#66736B]">
                Secondary authority: {data.secondaryCitation}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono font-semibold text-[#2E7D5B]">
                Jurisdiction Body: {data.regulatoryBody}
              </span>
            </div>
          </div>

          {/* Plain English Explanation */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#2E7D5B]" />
              Plain-English Explanation
            </h4>
            <div className="p-4 rounded-xl bg-white border border-[#E8E4D9] text-xs text-[#26352D] leading-relaxed shadow-2xs">
              {data.plainEnglishExplanation}
            </div>
          </div>

          {/* Clinical Safety Context */}
          {data.clinicalSafetyContext && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                Clinical Safety & Protocol Impact
              </h4>
              <div className="p-4 rounded-xl bg-white border border-[#E8E4D9] text-xs text-[#26352D] leading-relaxed shadow-2xs">
                {data.clinicalSafetyContext}
              </div>
            </div>
          )}

          {/* Actionable Remediation & Required Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Remediation Guidance
              </h5>
              <p className="text-xs text-[#26352D] leading-relaxed font-medium">
                {data.actionableRemediation}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B] font-mono flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                Required Evidence
              </h5>
              <p className="text-xs text-[#26352D] leading-relaxed font-medium">
                {data.requiredEvidenceDocument || 'Signed approval addendum with immutable hash.'}
              </p>
            </div>
          </div>

          {/* Hard Guardrail Advisory Legal Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#FEF9C3] border border-[#FDE68A] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#92400E] leading-relaxed font-medium">
              <strong>ADVISORY ONLY (NON-BINDING):</strong> This regulatory advisory was synthesized from the statutory catalog in a read-only transaction. Under system guardrails, AI advice cannot mutate readiness states, close findings, or override governance gates. Implementation decisions require human PI approval.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-[#66736B] text-xs">
          No advisory data loaded.
        </div>
      )}
    </Modal>
  );
};
