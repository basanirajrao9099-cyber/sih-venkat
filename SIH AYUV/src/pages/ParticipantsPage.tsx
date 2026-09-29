import React, { useState } from 'react';
import { Users, Search, Filter, Eye, Dna, CheckCircle2, Clock, Calendar, ArrowDown } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { RandomizationModal } from '../components/common/RandomizationModal';
import { DEMO_PARTICIPANTS } from '../data/participants';
import { ParticipantOpsItem, RandomizationResult } from '../types/trialOps';
import { useToast } from '../hooks/useToast';

import { useTrial } from '../hooks/useTrialContext';
import { apiFetch } from '../services/api';

export const ParticipantsPage: React.FC = () => {
  const { showToast } = useToast();
  const { selectedTrial } = useTrial();
  const [participants, setParticipants] = useState<ParticipantOpsItem[]>(DEMO_PARTICIPANTS);
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantOpsItem | null>(null);
  const [isRandomizationOpen, setIsRandomizationOpen] = useState(false);

  React.useEffect(() => {
    const fetchLiveParticipants = async () => {
      try {
        const list = await apiFetch<any[]>(
          `/api/v1/participants?trialId=${encodeURIComponent(selectedTrial.protocolId)}`,
          undefined,
          DEMO_PARTICIPANTS
        );
        if (Array.isArray(list) && list.length > 0) {
            const mapped: ParticipantOpsItem[] = list.map((p: any) => ({
              id: p.id,
              participantId: p.participantId,
              site: p.site || p.siteName || 'All India Institute of Ayurveda',
              siteId: p.siteId,
              enrollmentDate: p.enrollmentDate,
              visitStatus: p.visitStatus,
              consent: p.consent,
              safety: p.safety,
              protocolVersion: p.protocolVersion,
              cohortArm: p.cohortArm,
              timeline: (p.timeline || []).map((t: any) => ({
                step: t.step,
                status: t.status,
                date: t.date,
                notes: t.notes,
              })),
            }));
            setParticipants(mapped);
          }
      } catch (err) {
        console.warn('Participants live API unreachable, using local state', err);
      }
    };

    fetchLiveParticipants();
  }, [selectedTrial.id, selectedTrial.protocolId]);

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.participantId.toLowerCase().includes(search.toLowerCase()) ||
      p.site.toLowerCase().includes(search.toLowerCase()) ||
      p.visitStatus.toLowerCase().includes(search.toLowerCase()) ||
      p.safety.toLowerCase().includes(search.toLowerCase());
    const matchesSite = siteFilter === 'all' || p.siteId === siteFilter;
    return matchesSearch && matchesSite;
  });

  const handleRandomizationComplete = (res: RandomizationResult) => {
    const existingIndex = participants.findIndex((p) => p.participantId === res.participantId);
    if (existingIndex >= 0) {
      const updated = [...participants];
      updated[existingIndex] = {
        ...updated[existingIndex],
        cohortArm: res.treatmentArm,
        visitStatus: 'Enrollment Complete',
      };
      setParticipants(updated);
    } else {
      const newPt: ParticipantOpsItem = {
        id: `pt-ops-${Date.now()}`,
        participantId: res.participantId,
        site: 'Hyderabad Clinical Centre (SITE-001)',
        siteId: 'SITE-001',
        enrollmentDate: new Date().toISOString().split('T')[0],
        visitStatus: 'Enrollment Complete',
        consent: 'Signed (e-ICF v2.1)',
        safety: 'No AE',
        protocolVersion: 'Protocol v1.0',
        cohortArm: res.treatmentArm,
        timeline: [
          { step: 'Screening', status: 'completed', date: new Date().toISOString().split('T')[0], notes: 'Criteria verified.' },
          { step: 'Enrollment', status: 'completed', date: new Date().toISOString().split('T')[0], notes: `Randomized to ${res.treatmentArm.split('—')[0]}. Code: ${res.allocationCode}` },
          { step: 'Visit 1', status: 'upcoming', notes: 'Scheduled for Week 4.' },
          { step: 'Visit 2', status: 'upcoming', notes: 'Scheduled for Week 8.' },
          { step: 'Visit 3', status: 'upcoming', notes: 'Scheduled for Week 12.' },
        ]
      };
      setParticipants([newPt, ...participants]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2E7D5B]" />
            Participant Registry & Visits
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Pseudonymized subject tracking across clinical sites with protocol visit milestones and consent monitoring.
          </p>
        </div>

        {/* Randomization Demo Trigger */}
        <Button
          size="sm"
          icon={<Dna className="w-4 h-4 text-white" />}
          onClick={() => setIsRandomizationOpen(true)}
        >
          Run Demo Randomization
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Pseudonymized ID (e.g. PT-001), site, or visit status..."
              className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#26352D] placeholder-[#66736B] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#66736B]" />
            <span className="text-xs text-[#66736B] font-medium">Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E8E4D9] text-xs text-[#26352D] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#2E7D5B] cursor-pointer"
            >
              <option value="all">All Sites</option>
              <option value="SITE-001">SITE-001 (Hyderabad)</option>
              <option value="SITE-002">SITE-002 (Delhi)</option>
              <option value="SITE-003">SITE-003 (Jaipur)</option>
              <option value="SITE-004">SITE-004 (Jamnagar)</option>
              <option value="SITE-005">SITE-005 (Mumbai)</option>
              <option value="SITE-006">SITE-006 (Varanasi)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Participants Table */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <Table
          data={filteredParticipants}
          keyExtractor={(p) => p.id}
          columns={[
            {
              header: 'Participant ID',
              accessor: (p) => (
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">
                    {p.participantId}
                  </span>
                  <p className="text-[10px] text-[#66736B] font-mono">Pseudonymized ID</p>
                </div>
              ),
            },
            {
              header: 'Site',
              className: 'min-w-[200px]',
              accessor: (p) => (
                <span className="text-xs font-medium text-[#26352D]">{p.site}</span>
              ),
            },
            {
              header: 'Enrollment',
              accessor: (p) => (
                <div className="text-xs font-mono text-[#26352D]">
                  {p.enrollmentDate}
                </div>
              ),
            },
            {
              header: 'Visit Status',
              accessor: (p) => (
                <div className="text-xs font-medium text-[#26352D] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  <span>{p.visitStatus}</span>
                </div>
              ),
            },
            {
              header: 'Consent',
              accessor: (p) => (
                <Badge
                  variant={p.consent.includes('Signed') ? 'success' : 'warning'}
                  size="sm"
                >
                  {p.consent}
                </Badge>
              ),
            },
            {
              header: 'Safety',
              accessor: (p) => (
                <Badge
                  variant={p.safety === 'No AE' ? 'default' : p.safety.includes('Mild') ? 'warning' : 'danger'}
                  size="sm"
                >
                  {p.safety}
                </Badge>
              ),
            },
            {
              header: 'Protocol Version',
              accessor: (p) => (
                <span className="text-xs font-mono text-[#2E7D5B] bg-[#FAF9F4] px-2 py-0.5 rounded border border-[#E8E4D9]">
                  {p.protocolVersion}
                </span>
              ),
            },
            {
              header: 'Actions',
              className: 'text-right',
              accessor: (p) => (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                  onClick={() => setSelectedParticipant(p)}
                >
                  Details
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Participant Detail Panel Modal with Visual Timeline */}
      {selectedParticipant && (
        <Modal
          isOpen={Boolean(selectedParticipant)}
          onClose={() => setSelectedParticipant(null)}
          title={
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[#2E7D5B] font-bold">{selectedParticipant.participantId}</span>
              <Badge variant="info">{selectedParticipant.cohortArm}</Badge>
            </div>
          }
          description={`${selectedParticipant.site} • Protocol ${selectedParticipant.protocolVersion}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#66736B]">Pseudonymized Record • Zero PII</span>
              <Button size="sm" onClick={() => setSelectedParticipant(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <div>
                <span className="text-[#66736B]">Consent Status</span>
                <p className="font-semibold text-[#2E7D5B] mt-0.5">{selectedParticipant.consent}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Safety Status</span>
                <p className="font-semibold text-[#26352D] mt-0.5">{selectedParticipant.safety}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Enrollment Date</span>
                <p className="font-mono text-[#26352D] mt-0.5">{selectedParticipant.enrollmentDate}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Current Visit</span>
                <p className="font-semibold text-[#2E7D5B] mt-0.5">{selectedParticipant.visitStatus}</p>
              </div>
            </div>

            {/* Visual Timeline Section */}
            <div className="p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#26352D] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2E7D5B]" />
                Participant Visit Timeline Progression
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E4D9]">
                {selectedParticipant.timeline.map((item, idx) => {
                  const isCompleted = item.status === 'completed';
                  const isCurrent = item.status === 'current';

                  return (
                    <div key={idx} className="relative">
                      {/* Step Indicator Pin */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                          isCompleted
                            ? 'bg-[#EAF4EF] border-[#2E7D5B] text-[#2E7D5B]'
                            : isCurrent
                            ? 'bg-[#FEF9C3] border-[#92400E] text-[#92400E] animate-pulse'
                            : 'bg-white border-[#E8E4D9] text-[#66736B]'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#26352D] text-xs">{item.step}</span>
                          <Badge
                            variant={isCompleted ? 'success' : isCurrent ? 'info' : 'default'}
                            size="sm"
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                          {item.date && (
                            <span className="text-[11px] text-[#66736B] font-mono">{item.date}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-[#66736B] leading-relaxed">{item.notes}</p>
                        )}
                      </div>

                      {/* Flow Arrow indicator */}
                      {idx < selectedParticipant.timeline.length - 1 && (
                        <div className="py-1 text-[#66736B]/60">
                          <ArrowDown className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Randomization Demo Modal */}
      <RandomizationModal
        isOpen={isRandomizationOpen}
        onClose={() => setIsRandomizationOpen(false)}
        onRandomized={handleRandomizationComplete}
      />
    </div>
  );
};
