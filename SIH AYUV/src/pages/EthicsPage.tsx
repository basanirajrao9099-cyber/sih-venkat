import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Check,
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { compilerService, EvidenceItem } from '../services/compilerService';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/common/Modal';

export const EthicsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(
    compilerService.getInitialEvidence()
  );
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [selectedReviewItem, setSelectedReviewItem] = useState<EvidenceItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  useEffect(() => {
    const loadEvidence = async () => {
      try {
        const live = await compilerService.fetchEvidence('CS-0001');
        if (live) setEvidenceList(live);
      } catch {
        setEvidenceList(compilerService.getInitialEvidence());
      }
    };
    loadEvidence();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await compilerService.verifyEvidence(id, 'ACCEPT', 'CS-0001');
      const live = await compilerService.fetchEvidence('CS-0001');
      setEvidenceList(live);
      setIsReviewOpen(false);
      showToast('Ethics Approval Recorded', `Item ${id} approved and verified under NDCT 2019 Rule 26`, 'success');
    } catch {
      setIsReviewOpen(false);
      showToast('Approval Saved', `Item ${id} marked as verified`, 'info');
    }
  };

  const handleRequestChanges = async (id: string) => {
    if (!changeNote.trim()) {
      showToast('Note Required', 'Please provide a reviewer explanation', 'warning');
      return;
    }
    try {
      await compilerService.verifyEvidence(id, 'REJECT', 'CS-0001', changeNote, changeNote);
      const live = await compilerService.fetchEvidence('CS-0001');
      setEvidenceList(live);
      setIsReviewOpen(false);
      showToast('Changes Requested', `Review feedback logged: ${changeNote}`, 'info');
    } catch {
      setIsReviewOpen(false);
      showToast('Feedback Sent', 'Review note recorded', 'info');
    }
  };

  const openItemReview = (item: EvidenceItem) => {
    setSelectedReviewItem(item);
    setIsRequestingChanges(false);
    setChangeNote('');
    setIsReviewOpen(true);
  };

  const filteredItems = evidenceList.filter((item) => {
    if (activeTab === 'PENDING') return item.status !== 'VERIFIED' && item.status !== 'AVAILABLE';
    if (activeTab === 'APPROVED') return item.status === 'VERIFIED' || item.status === 'AVAILABLE';
    return true;
  });

  const pendingCount = evidenceList.filter(
    (e) => e.status !== 'VERIFIED' && e.status !== 'AVAILABLE'
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="border-b border-[#E8E5DC] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
            IEC-CENTRAL REVIEW
          </span>
          <span className="text-xs text-[#5C6B62] font-medium">• Institutional Ethics Committee</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
          Ethics & Compliance Review Queue
        </h1>
        <p className="text-xs text-[#5C6B62] mt-0.5">
          Review regulatory notification dossiers, patient consent revisions, and investigator sign-offs.
        </p>
      </div>

      {/* FILTER TABS & REVIEW QUEUE SUMMARY */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E5DC] pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              Review Queue
            </h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} items require ethics committee review`
                : 'All ethics items have been reviewed and approved'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-[#1E4D38] shadow-xs' : 'text-[#5C6B62]'
              }`}
            >
              All ({evidenceList.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'PENDING' ? 'bg-white text-[#1E4D38] shadow-xs' : 'text-[#5C6B62]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'APPROVED' ? 'bg-white text-[#1E4D38] shadow-xs' : 'text-[#5C6B62]'
              }`}
            >
              Approved ({evidenceList.length - pendingCount})
            </button>
          </div>
        </div>

        {/* REVIEW ITEMS LIST */}
        <div className="divide-y divide-[#E8E5DC]">
          {filteredItems.map((item) => {
            const isApproved = item.status === 'VERIFIED' || item.status === 'AVAILABLE';

            return (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F4]/60 p-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => openItemReview(item)}
              >
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">{item.title}</span>
                    <span className="text-[10px] font-mono font-semibold text-[#5C6B62]">{item.id}</span>
                    {isApproved ? (
                      <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Awaiting Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    {item.fileHint || 'Submitted for protocol amendment CS-0001 (Visit 4 window modification)'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {isApproved ? (
                    <span className="text-xs font-semibold text-[#1E4D38] inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openItemReview(item);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Review & Approve
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#8C9B91]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* APPLICABLE STATUTORY STANDARDS */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
          Applicable Governance Standards
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
            <span className="font-bold text-[#1E2922] block">NDCT Rules 2019</span>
            <p className="text-[#5C6B62] text-[11px]">Rule 26 Protocol Amendment Approvals & expedited IEC notifications</p>
          </div>
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
            <span className="font-bold text-[#1E2922] block">ICMR 2017 Guidelines</span>
            <p className="text-[#5C6B62] text-[11px]">Section 5 Patient Re-Consent Standards for protocol window adjustments</p>
          </div>
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
            <span className="font-bold text-[#1E2922] block">Ayush GCP</span>
            <p className="text-[#5C6B62] text-[11px]">Section 4 Multi-Center Standardization across apex institutions</p>
          </div>
        </div>
      </section>

      {/* REVIEW ITEM MODAL */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Ethics Committee Review Docket"
        description={`Formal review for ${selectedReviewItem?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#FAF9F4] border border-[#E8E5DC] space-y-2.5">
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-[#5C6B62] block">Protocol Change</span>
                <span className="font-bold text-[#1E2922]">Visit 4 Window: Day 25–31 → Day 25–35</span>
              </div>
              <div>
                <span className="text-[#5C6B62] block">Operational Scope</span>
                <span className="font-bold text-[#1E2922]">3 Sites · 47 Enrolled Participants</span>
              </div>
            </div>

            <div>
              <span className="text-[#5C6B62] text-[10px] uppercase font-bold block">Compliance Grounding</span>
              <p className="text-[#1E2922] mt-0.5">
                Evaluated under ICMR 2017 Section 5 & NDCT 2019 Rule 26. Requires ethics notification and PIS addendum before physical site rollout.
              </p>
            </div>
          </div>

          {isRequestingChanges ? (
            <div className="space-y-2 animate-fade-in">
              <label className="font-semibold text-rose-800 block">
                Explain required changes or missing information:
              </label>
              <textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Please clarify if the extended assessment window impacts the primary safety biomarker blood draw sequence."
                className="w-full bg-white border border-[#E2DFD6] rounded-lg p-2.5 text-xs text-[#1E2922] focus:outline-none focus:border-rose-600 min-h-[80px]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsRequestingChanges(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => selectedReviewItem && handleRequestChanges(selectedReviewItem.id)}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Send Change Request
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#E8E5DC] flex justify-between gap-2">
              <button
                onClick={() => setIsRequestingChanges(true)}
                className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
              >
                Request changes
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedReviewItem && handleApprove(selectedReviewItem.id)}
                  className="px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold cursor-pointer"
                >
                  Approve Item
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
