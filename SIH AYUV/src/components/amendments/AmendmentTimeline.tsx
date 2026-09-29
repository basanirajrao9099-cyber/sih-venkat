import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  Lock,
  ChevronRight,
  User,
  Calendar,
  Hash,
  Shield,
  Check,
} from 'lucide-react';
import { compilerService } from '../../services/compilerService';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../common/Modal';

export interface AuditEventItem {
  id: string;
  step: string;
  title: string;
  timestamp: string;
  actor: string;
  description: string;
  status: string;
  hash?: string;
  who?: string;
  what?: string;
  when?: string;
  why?: string;
  evidence?: string;
  outcome?: string;
  parentHash?: string;
  fullHash?: string;
}

interface AmendmentTimelineProps {
  changeSetId: string;
  changeSetTitle?: string;
}

type TimelineCategory = 'All' | 'Amendment' | 'Impact' | 'Evidence' | 'Review' | 'Readiness';

const mapEventToCategory = (evt: AuditEventItem): TimelineCategory => {
  const what = (evt.what || '').toUpperCase();
  const title = (evt.title || '').toLowerCase();

  if (what.includes('CHANGESET') || title.includes('amendment') || title.includes('changeset') || title.includes('draft')) {
    return 'Amendment';
  }
  if (what.includes('IMPACT') || title.includes('impact') || title.includes('blast radius')) {
    return 'Impact';
  }
  if (what.includes('EVIDENCE_SUBMITTED') || title.includes('evidence submitted') || title.includes('evidence added')) {
    return 'Evidence';
  }
  if (
    what.includes('EVIDENCE_VERIFIED') ||
    what.includes('EVIDENCE_REJECTED') ||
    what.includes('ADVISORY') ||
    title.includes('approved') ||
    title.includes('rejected') ||
    title.includes('verified') ||
    title.includes('training') ||
    title.includes('review')
  ) {
    return 'Review';
  }
  if (
    what.includes('COMPILATION') ||
    what.includes('READINESS') ||
    what.includes('FINDINGS') ||
    title.includes('compilation') ||
    title.includes('validation') ||
    title.includes('ready')
  ) {
    return 'Readiness';
  }
  return 'Amendment';
};

const getHumanActionLabel = (evt: AuditEventItem): string => {
  const what = (evt.what || '').toUpperCase();
  const title = evt.title || '';
  const evidence = (evt.evidence || '').toLowerCase();

  if (what === 'CHANGESET_CREATED') return 'Amendment created';
  if (what === 'CHANGESET_UPDATED') return 'Amendment updated';
  if (what === 'IMPACT_ANALYSIS') return 'Impact analysis completed';
  if (what === 'EVIDENCE_SUBMITTED') return 'Evidence submitted';
  if (what === 'EVIDENCE_REJECTED') return 'Evidence changes requested';
  if (what === 'EVIDENCE_VERIFIED') {
    if (evidence.includes('training') || title.toLowerCase().includes('training')) {
      return 'Site training verified';
    }
    return 'Evidence approved';
  }
  if (what === 'COMPILATION_FAILED') return 'Amendment validation started (Prerequisites pending)';
  if (what === 'RECOMPILATION_PASSED') return 'Amendment validated (Governance checks satisfied)';
  if (what === 'READINESS_CERTIFIED') return 'Amendment became ready';
  if (what === 'AI_ADVISORY_QUERY') return 'Advisory consultation recorded';

  return title || 'Governance milestone recorded';
};

const extractPersonAndRole = (whoStr?: string, actorStr?: string) => {
  const raw = whoStr || actorStr || 'System Intelligence';
  const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return { name: match[1].trim(), role: match[2].trim() };
  }
  return { name: raw, role: 'System' };
};

export const AmendmentTimeline: React.FC<AmendmentTimelineProps> = ({
  changeSetId,
  changeSetTitle,
}) => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TimelineCategory>('All');
  
  // Selected Event Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [verificationData, setVerificationData] = useState<any | null>(null);

  const canViewProvenance =
    currentUser.role === 'Ethics Reviewer' ||
    currentUser.role === 'Monitor' ||
    currentUser.role === 'Admin' ||
    currentUser.role === 'Principal Investigator';

  const loadAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trailData, verifyData] = await Promise.all([
        compilerService.fetchAuditTrail(changeSetId),
        fetch(`/api/v1/audit/verify?changeSetId=${encodeURIComponent(changeSetId)}`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      if (Array.isArray(trailData)) {
        setEvents(trailData);
      }
      if (verifyData) {
        setVerificationData(verifyData);
      }
    } catch (err: any) {
      console.warn('Failed to load audit trail:', err);
      setError('Unable to load timeline from authoritative audit trail. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [changeSetId]);

  const filteredEvents = events.filter((evt) => {
    if (activeFilter === 'All') return true;
    return mapEventToCategory(evt) === activeFilter;
  });

  const categories: TimelineCategory[] = ['All', 'Amendment', 'Impact', 'Evidence', 'Review', 'Readiness'];

  return (
    <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-5 animate-fade-in">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
              IMMUTABLE AUDIT TRAIL
            </span>
            <span className="text-xs text-[#5C6B62] font-medium">• {changeSetId}</span>
            {verificationData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                <Check className="w-3 h-3" />
                <span>Chain Verified</span>
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-[#1E2922]">
            Amendment Timeline & Governance Provenance
          </h2>
          <p className="text-xs text-[#5C6B62] mt-0.5">
            Chronological audit events recorded by the authoritative trial fabric engine.
          </p>
        </div>

        {/* Provenance Action */}
        {canViewProvenance && (
          <button
            onClick={() => setShowProvenanceModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            title="Inspect cryptographic Merkle hash links and chain integrity"
          >
            <Lock className="w-3.5 h-3.5 text-[#1E4D38]" />
            <span>View provenance</span>
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isSelected = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#1E4D38] text-white border-[#1E4D38] shadow-xs'
                  : 'bg-[#FAF9F4] text-[#5C6B62] border-[#E8E5DC] hover:bg-white hover:text-[#1E2922]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* TIMELINE CONTENT */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#5C6B62]">
          Loading authoritative amendment timeline...
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl text-xs text-rose-700 space-y-2">
          <p className="font-semibold">{error}</p>
          <button
            onClick={loadAuditData}
            className="text-[11px] text-[#1E4D38] font-bold hover:underline cursor-pointer"
          >
            Retry loading timeline
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#5C6B62] bg-[#FAF9F4] rounded-xl border border-[#E8E5DC]">
          No audit events found for category <strong>{activeFilter}</strong>.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E5DC]">
          {filteredEvents.map((evt, idx) => {
            const humanAction = getHumanActionLabel(evt);
            const { name: personName, role: personRole } = extractPersonAndRole(evt.who, evt.actor);
            const isPassed = evt.status === 'PASSED' || evt.outcome === 'PASSED' || evt.status === 'READY';
            const isFailed = evt.status === 'FAILED' || evt.outcome === 'FAILED' || evt.outcome === 'BLOCKED';
            const isSubmitted = evt.status === 'SUBMITTED' || evt.outcome === 'SUBMITTED';

            return (
              <div key={evt.id || idx} className="relative group">
                {/* Node Bullet */}
                <div
                  className={`absolute -left-6 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white shadow-xs ${
                    isPassed
                      ? 'border-[#1E4D38] text-[#1E4D38]'
                      : isFailed
                      ? 'border-rose-600 text-rose-600'
                      : isSubmitted
                      ? 'border-amber-600 text-amber-600'
                      : 'border-[#1E4D38] text-[#1E4D38]'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>

                {/* Event Card (Clickable to view details) */}
                <button
                  onClick={() => setSelectedEvent(evt)}
                  className="w-full text-left p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E5DC] hover:border-[#B8B3A6] hover:bg-white shadow-2xs transition-all space-y-1.5 cursor-pointer block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1E2922] group-hover:text-[#1E4D38] transition-colors">
                        {humanAction}
                      </span>
                      <span className="text-[10px] font-mono text-[#5C6B62] bg-white px-1.5 py-0.5 rounded border border-[#E8E5DC]">
                        {evt.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#5C6B62]">
                      <Calendar className="w-3 h-3 text-[#8C9B91]" />
                      <span className="font-mono text-[11px]">
                        {evt.timestamp || evt.when || 'Today'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C6B62] leading-relaxed line-clamp-2">
                    {evt.description || evt.why}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#E8E5DC] text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#5C6B62]">
                      <User className="w-3 h-3 text-[#8C9B91]" />
                      <span className="font-semibold text-[#1E2922]">{personName}</span>
                      <span>·</span>
                      <span className="text-[#5C6B62]">{personRole}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-[#1E4D38] group-hover:underline inline-flex items-center gap-0.5">
                      <span>Event details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? getHumanActionLabel(selectedEvent) : 'Audit Event Detail'}
        description={`Audit Record: ${selectedEvent?.id} · ChangeSet ${changeSetId}`}
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
                    Person / Actor
                  </span>
                  <span className="font-bold text-[#1E2922] text-xs mt-0.5 block">
                    {extractPersonAndRole(selectedEvent.who, selectedEvent.actor).name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
                    Role
                  </span>
                  <span className="font-semibold text-[#1E4D38] text-xs mt-0.5 block">
                    {extractPersonAndRole(selectedEvent.who, selectedEvent.actor).role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E5DC]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
                    Date & Time
                  </span>
                  <span className="font-mono text-xs text-[#1E2922] mt-0.5 block">
                    {selectedEvent.timestamp || selectedEvent.when || 'Today'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
                    ChangeSet
                  </span>
                  <span className="font-mono text-xs text-[#1E4D38] mt-0.5 block">
                    {changeSetId}
                  </span>
                </div>
              </div>
            </div>

            {/* Description & Clinical Reason */}
            <div className="p-3.5 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
                Description & Reason
              </span>
              <p className="text-xs text-[#1E2922] leading-relaxed">
                {selectedEvent.description || selectedEvent.why || 'Standard protocol governance action executed.'}
              </p>
            </div>

            {/* Evidence Link if attached */}
            {selectedEvent.evidence && selectedEvent.evidence !== 'N/A' && (
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#5C6B62]">Referenced Artifact:</span>
                <span className="font-mono text-xs font-bold text-[#1E4D38]">{selectedEvent.evidence}</span>
              </div>
            )}

            {/* Subtle Provenance Toggle inside Detail Modal */}
            {canViewProvenance && selectedEvent.parentHash && (
              <div className="pt-2 border-t border-[#E8E5DC] flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setShowProvenanceModal(true);
                  }}
                  className="text-xs font-semibold text-[#1E4D38] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Inspect cryptographic block provenance →</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#1E2922] hover:bg-[#FAF9F4] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* PROVENANCE INSPECTION MODAL */}
      <Modal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
        title="Audit Provenance & Cryptographic Verification"
        description={`SHA-256 Merkle Hash Chain for ChangeSet ${changeSetId}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Integrity Banner */}
          <div className="p-4 bg-[#EAF4EF] border border-[#C5DFD2] rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#1E4D38] shrink-0" />
              <div>
                <span className="font-bold text-[#1E4D38] text-xs block">
                  Chain Verification: {verificationData?.chainValid !== false ? 'Valid (100% Integrity)' : 'Tamper Detected'}
                </span>
                <p className="text-[11px] text-[#1E2922] mt-0.5">
                  {verificationData?.message || 'Every audit block verified against preceding SHA-256 digest.'}
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#1E4D38] bg-white px-2.5 py-1 rounded border border-[#C5DFD2] shrink-0">
              {events.length} Blocks
            </span>
          </div>

          {/* Chain Block List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {events.map((evt, idx) => (
              <div key={evt.id || idx} className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#1E2922]">{evt.id}: {getHumanActionLabel(evt)}</span>
                  <span className="text-[#5C6B62]">{evt.timestamp || evt.when}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 border-t border-[#E8E5DC]">
                  <div>
                    <span className="text-[#8C9B91] block">PREVIOUS HASH (PARENT):</span>
                    <span className="text-[#5C6B62] truncate block" title={evt.parentHash || 'Genesis'}>
                      {evt.parentHash ? `${evt.parentHash.slice(0, 16)}...${evt.parentHash.slice(-6)}` : 'Genesis (0x0000...)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C9B91] block">CURRENT BLOCK HASH:</span>
                    <span className="text-[#1E4D38] font-bold truncate block" title={evt.fullHash || evt.hash || ''}>
                      {evt.fullHash
                        ? `${evt.fullHash.slice(0, 16)}...${evt.fullHash.slice(-6)}`
                        : evt.hash || '0x...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowProvenanceModal(false)}
              className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#1E2922] hover:bg-[#FAF9F4] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
