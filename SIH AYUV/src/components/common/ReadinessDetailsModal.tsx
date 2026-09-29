import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, ArrowRight, X, Check } from 'lucide-react';
import { Modal } from './Modal';
import { EvidenceItem, Finding, ReadinessSummary } from '../../services/compilerService';

interface ReadinessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  readiness: ReadinessSummary;
  evidenceList: EvidenceItem[];
  findings: Finding[];
}

export const ReadinessDetailsModal: React.FC<ReadinessDetailsModalProps> = ({
  isOpen,
  onClose,
  readiness,
  evidenceList,
  findings,
}) => {
  const navigate = useNavigate();

  const isDossierApproved =
    readiness.isEthicsApproved ??
    (evidenceList.find((e) => e.id === 'EVD-01')?.status === 'VERIFIED');

  const isConsentApproved =
    evidenceList.find((e) => e.id === 'EVD-02')?.status === 'VERIFIED';

  const isTrainingApproved =
    readiness.isTrainingCompleted ??
    (evidenceList.find((e) => e.id === 'EVD-03')?.status === 'VERIFIED');

  const isEvidenceAllVerified =
    readiness.isEvidenceVerified ??
    evidenceList.filter((e) => e.id !== 'EVD-04').every((e) => e.status === 'VERIFIED');

  const openBlockers = findings.filter((f) => f.type === 'BLOCK' && f.status === 'OPEN');
  const isComplianceComplete =
    readiness.isComplianceResolved ?? (openBlockers.length === 0 && isConsentApproved);

  const isCertifiedReady = readiness.status === 'READY' || readiness.readinessStage === 'READY';
  const isAllChecksComplete = isDossierApproved && isConsentApproved && isTrainingApproved && isComplianceComplete;

  // Use authoritative remaining requirements from backend if provided, else derive
  let remainingList: string[] = readiness.remainingRequirements || [];
  if (remainingList.length === 0 && !isCertifiedReady && !isAllChecksComplete) {
    if (!isDossierApproved) remainingList.push('IEC approval');
    if (!isTrainingApproved) remainingList.push('Site retraining');
    if (!isConsentApproved) remainingList.push('Participant re-consent addendum');
  }

  const remainingCount = remainingList.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Readiness details"
      description={`Authoritative clinical governance status for ${readiness.changeSet || 'CS-0001'}`}
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Status Header Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isCertifiedReady
              ? 'bg-[#EAF4EF] border-[#C5DFD2]'
              : isAllChecksComplete
              ? 'bg-[#FAF9F4] border-[#1E4D38] ring-1 ring-[#1E4D38]'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCertifiedReady ? (
              <CheckCircle2 className="w-5 h-5 text-[#1E4D38] shrink-0" />
            ) : isAllChecksComplete ? (
              <ShieldCheck className="w-5 h-5 text-[#1E4D38] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            )}
            <div>
              <span
                className={`text-xs font-bold block ${
                  isCertifiedReady || isAllChecksComplete ? 'text-[#1E4D38]' : 'text-amber-900'
                }`}
              >
                {isCertifiedReady
                  ? 'READY'
                  : isAllChecksComplete
                  ? 'READY FOR IMPLEMENTATION'
                  : 'NOT READY'}
              </span>
              <p className="text-[11px] text-[#5C6B62] mt-0.5">
                {isCertifiedReady
                  ? 'Amendment certified and validated for trial rollout.'
                  : isAllChecksComplete
                  ? 'All required governance checks have been completed.'
                  : `${remainingCount} requirement${remainingCount === 1 ? '' : 's'} remain.`}
              </p>
            </div>
          </div>
        </div>

        {/* 5 Core Readiness Dimensions Checklist */}
        <div className="space-y-2 border border-[#E8E5DC] rounded-xl p-4 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block mb-2">
            Governance Dimensions
          </span>

          <div className="divide-y divide-[#E8E5DC]">
            {/* 1. Impact */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1E2922]">Impact</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38]">
                <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
              </span>
            </div>

            {/* 2. Evidence */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1E2922]">Evidence</span>
              {isEvidenceAllVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38]">
                  <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> In progress
                </span>
              )}
            </div>

            {/* 3. Ethics review */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1E2922]">Ethics review</span>
              {isDossierApproved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38]">
                  <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> Pending approval
                </span>
              )}
            </div>

            {/* 4. Training */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1E2922]">Training</span>
              {isTrainingApproved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38]">
                  <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> Pending logs
                </span>
              )}
            </div>

            {/* 5. Compliance */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1E2922]">Compliance</span>
              {isComplianceComplete ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38]">
                  <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> Pending resolution
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Exact Remaining Requirements List (When Incomplete) */}
        {!isCertifiedReady && !isAllChecksComplete && remainingList.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E5DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
              {remainingCount} requirement{remainingCount === 1 ? '' : 's'} remain:
            </span>
            <ul className="text-xs space-y-1.5 text-[#1E2922]">
              {remainingList.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#8C9B91] font-mono text-sm leading-none">○</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E8E5DC] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/compiler');
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>
              {isCertifiedReady
                ? 'Prepare implementation →'
                : isAllChecksComplete
                ? 'Validate amendment →'
                : 'Resolve requirements →'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
