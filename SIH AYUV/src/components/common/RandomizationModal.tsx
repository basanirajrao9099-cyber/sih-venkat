import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Dna, CheckCircle2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { RandomizationResult } from '../../types/trialOps';
import { useToast } from '../../hooks/useToast';

interface RandomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultParticipantId?: string;
  onRandomized?: (result: RandomizationResult) => void;
}

export const RandomizationModal: React.FC<RandomizationModalProps> = ({
  isOpen,
  onClose,
  defaultParticipantId = 'PT-008',
  onRandomized,
}) => {
  const { showToast } = useToast();
  const [participantId, setParticipantId] = useState(defaultParticipantId);
  const [site, setSite] = useState('SITE-001 (Hyderabad Clinical Centre)');
  const [isEligible, setIsEligible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RandomizationResult | null>(null);

  const handleRunRandomization = () => {
    if (!participantId.trim()) {
      showToast('Validation Error', 'Please enter a pseudonymized Participant ID', 'warning');
      return;
    }
    if (!isEligible) {
      showToast('Eligibility Incomplete', 'Participant must be confirmed eligible prior to allocation', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const charCode = participantId.charCodeAt(participantId.length - 1) || 0;
      const isArmA = charCode % 2 === 0;

      const randomResult: RandomizationResult = {
        participantId: participantId.toUpperCase().trim(),
        eligible: true,
        treatmentArm: isArmA 
          ? 'Arm A — Standardized Ashwagandha Lehyam + Guduchi' 
          : 'Arm B — Active Botanical Comparator',
        allocationCode: `RND-2026-${(1000 + (charCode * 37) % 9000)}`,
        blockId: `BLK-${((charCode % 4) + 1).toString().padStart(2, '0')}`,
        stratification: `${site.split(' ')[0]} | Adult Tier 1`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        formulationDetails: isArmA
          ? 'Bottle Kit #A-2026-09 | 6g BD post-meal with warm water'
          : 'Bottle Kit #B-2026-14 | Active comparator formulation 500mg BD',
      };

      setResult(randomResult);
      setIsProcessing(false);
      showToast('Randomization Success', `${randomResult.participantId} assigned to ${isArmA ? 'Arm A' : 'Arm B'}`, 'success');
      if (onRandomized) {
        onRandomized(randomResult);
      }
    }, 450);
  };

  const handleReset = () => {
    setResult(null);
    setIsProcessing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Dna className="w-5 h-5 text-[#2E7D5B]" />
          <span>Interactive Randomization Demo</span>
        </div>
      }
      description="Simulate deterministic treatment arm assignment in double-blind clinical operations."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-[#66736B] font-mono">Simulated Clinical Trial Allocation</span>
          <div className="flex items-center gap-2">
            {result && (
              <Button size="sm" variant="outline" onClick={handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Reset
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Step Flow Indicators */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[10px] text-[#66736B] uppercase font-bold block">1. Participant</span>
            <span className="font-semibold text-[#26352D] truncate block mt-0.5">{participantId || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[10px] text-[#66736B] uppercase font-bold block">2. Eligibility</span>
            <span className="font-semibold text-[#2E7D5B] block mt-0.5">Verified</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[10px] text-[#66736B] uppercase font-bold block">3. Randomization</span>
            <span className="font-semibold text-[#2E7D5B] block mt-0.5">{result ? 'Completed' : 'Pending'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[10px] text-[#66736B] uppercase font-bold block">4. Treatment Arm</span>
            <span className="font-semibold text-[#C9A227] truncate block mt-0.5">
              {result ? result.treatmentArm.split('—')[0] : 'Awaiting Run'}
            </span>
          </div>
        </div>

        {/* Configuration Box */}
        {!result ? (
          <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#26352D] font-medium mb-1">
                  Pseudonymized Participant ID *
                </label>
                <input
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="e.g. PT-008"
                  className="w-full bg-white border border-[#E8E4D9] rounded-lg p-2 font-mono text-[#26352D] focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#26352D] font-medium mb-1">Study Site Center</label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full bg-white border border-[#E8E4D9] rounded-lg p-2 text-[#26352D] focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] outline-hidden"
                >
                  <option value="SITE-001 (Hyderabad Clinical Centre)">SITE-001 (Hyderabad Clinical Centre)</option>
                  <option value="SITE-002 (Delhi Apex AIIA)">SITE-002 (Delhi Apex AIIA)</option>
                  <option value="SITE-003 (Jaipur NIA)">SITE-003 (Jaipur NIA)</option>
                  <option value="SITE-004 (Jamnagar ITRA)">SITE-004 (Jamnagar ITRA)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                <span className="text-[#26352D] font-medium">Pre-Randomization Eligibility Criteria Passed</span>
              </div>
              <input
                type="checkbox"
                checked={isEligible}
                onChange={(e) => setIsEligible(e.target.checked)}
                className="w-4 h-4 rounded text-[#2E7D5B] focus:ring-[#2E7D5B]"
              />
            </div>

            <div className="pt-2 text-center">
              <Button
                size="md"
                className="w-full py-2.5"
                isLoading={isProcessing}
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleRunRandomization}
              >
                Run Demo Randomization
              </Button>
            </div>
          </div>
        ) : (
          /* Result Card */
          <div className="p-5 rounded-2xl bg-white border border-[#7FAF91]/50 shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="success" size="sm" className="mb-1.5" dot>
                  ALLOCATION DETERMINED
                </Badge>
                <h3 className="text-base font-bold text-[#26352D]">
                  {result.treatmentArm}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-1 rounded-md border border-[#7FAF91]/40">
                {result.allocationCode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] text-[11px]">
              <div>
                <span className="text-[#66736B]">Subject ID</span>
                <p className="font-mono font-bold text-[#26352D] mt-0.5">{result.participantId}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Block ID</span>
                <p className="font-mono text-[#26352D] font-semibold mt-0.5">{result.blockId}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Stratum</span>
                <p className="text-[#26352D] font-medium truncate mt-0.5">{result.stratification}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Timestamp</span>
                <p className="text-[#2E7D5B] font-mono font-semibold mt-0.5">{result.timestamp}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] text-[11px] space-y-1">
              <span className="text-[#66736B] font-medium">Investigational Product Kit Assignment:</span>
              <p className="text-[#26352D] font-mono font-semibold">{result.formulationDetails}</p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#2E7D5B] font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Double-blind allocation code securely logged into clinical trial audit trail.</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
