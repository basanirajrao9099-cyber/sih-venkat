import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FlaskConical, Eye, Building2, Users, FileText, TrendingUp, Cpu } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { DEMO_TRIALS } from '../data/trials';
import { TrialOpsItem } from '../types/trialOps';
import { useToast } from '../hooks/useToast';

export const TrialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trials, setTrials] = useState<TrialOpsItem[]>(DEMO_TRIALS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrial, setSelectedTrial] = useState<TrialOpsItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTrialId, setNewTrialId] = useState('ATF-004');
  const [newPhase, setNewPhase] = useState<TrialOpsItem['phase']>('Phase II');

  React.useEffect(() => {
    const fetchLiveTrials = async () => {
      try {
        const res = await fetch('/api/v1/trials');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped: TrialOpsItem[] = list.map((t: any) => ({
              id: t.id,
              trialId: t.trialId,
              trialName: t.title,
              phase: t.phase,
              status: (t.status || 'ACTIVE').toUpperCase(),
              protocolVersion: t.protocolVersion || 'v1.0',
              numberOfSites: t.numberOfSites || t.activeSites || 3,
              numberOfParticipants: t.numberOfParticipants || t.enrolledCount || 47,
              recruitmentPercentage: t.recruitmentPercentage || 72,
              leadInvestigator: t.leadInvestigator || t.piName,
              activeAmendment: t.activeAmendment,
              indication: t.indication,
              sponsor: t.sponsor,
              startDate: t.startDate,
              description: t.description,
            }));
            setTrials(mapped);
          }
        }
      } catch (err) {
        console.warn('Trials live API unreachable, using local state', err);
      }
    };

    fetchLiveTrials();
  }, []);

  const filteredTrials = trials.filter((t) => {
    const matchesSearch =
      t.trialName.toLowerCase().includes(search.toLowerCase()) ||
      t.trialId.toLowerCase().includes(search.toLowerCase()) ||
      t.protocolVersion.toLowerCase().includes(search.toLowerCase()) ||
      (t.indication?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Validation Error', 'Please enter a trial title', 'warning');
      return;
    }

    const created: TrialOpsItem = {
      id: `trial-${Date.now()}`,
      trialId: newTrialId,
      trialName: newTitle,
      phase: newPhase,
      status: 'ACTIVE',
      protocolVersion: 'Protocol v1.0',
      siteCount: 4,
      participantCount: 0,
      recruitmentPct: 0,
      targetParticipants: 100,
      indication: 'Integrative Clinical Protocol Investigation',
      sponsor: 'Central Research Council for Ayush',
      startDate: new Date().toISOString().split('T')[0],
      description: 'Newly registered multicenter clinical study protocol.'
    };

    setTrials([created, ...trials]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    showToast('Trial Registered', `Protocol ${created.trialId} successfully created`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#2E7D5B]" />
            Clinical Trials Portfolio
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Active multicenter Ayurvedic trial registry, recruitment velocity, and protocol versions.
          </p>
        </div>

        <Button
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Initiate Protocol
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
              placeholder="Search by Trial ID (e.g. ATF-001), name, or protocol..."
              className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#26352D] placeholder-[#66736B] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#66736B]" />
            <span className="text-xs text-[#66736B] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E8E4D9] text-xs text-[#26352D] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#2E7D5B] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="RECRUITING">RECRUITING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trials Table */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <Table
          data={filteredTrials}
          keyExtractor={(t) => t.trialId}
          columns={[
            {
              header: 'Trial ID & Name',
              className: 'min-w-[260px]',
              accessor: (t) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">{t.trialId}</span>
                    <Badge variant="default" size="sm">
                      {t.phase}
                    </Badge>
                    {t.activeAmendment && (
                      <Badge variant="warning" size="sm">
                        {t.activeAmendment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#26352D]">{t.trialName}</p>
                  <p className="text-[11px] text-[#66736B] line-clamp-1">{t.indication || 'Ayurvedic multi-center clinical research'}</p>
                </div>
              ),
            },
            {
              header: 'Protocol Version',
              accessor: (t) => (
                <span className="text-xs font-mono font-semibold text-[#2E7D5B] bg-[#FAF9F4] px-2.5 py-1 rounded border border-[#E8E4D9]">
                  {t.protocolVersion}
                </span>
              ),
            },
            {
              header: 'Sites',
              accessor: (t) => (
                <div className="text-xs font-medium text-[#26352D] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#66736B]" />
                  <span>{t.numberOfSites || t.siteCount || 3} Sites</span>
                </div>
              ),
            },
            {
              header: 'Participants & Recruitment',
              className: 'min-w-[180px]',
              accessor: (t) => {
                const count = t.numberOfParticipants || t.participantCount || 47;
                const pct = t.recruitmentPercentage || t.recruitmentPct || 72;
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#26352D] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#66736B]" />
                        {count} Participants
                      </span>
                      <span className="text-[#2E7D5B] font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF9F4] rounded-full overflow-hidden border border-[#E8E4D9]">
                      <div
                        className="h-full bg-[#2E7D5B] rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Status',
              accessor: (t) => (
                <Badge
                  variant={t.status === 'ACTIVE' ? 'success' : t.status === 'RECRUITING' ? 'info' : 'default'}
                  size="sm"
                  dot={t.status === 'ACTIVE' || t.status === 'RECRUITING'}
                >
                  {t.status}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              className: 'text-right',
              accessor: (t) => (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                  onClick={() => setSelectedTrial(t)}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Trial Details Modal */}
      {selectedTrial && (
        <Modal
          isOpen={Boolean(selectedTrial)}
          onClose={() => setSelectedTrial(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#2E7D5B] font-bold">{selectedTrial.trialId}</span>
              <Badge variant="info">{selectedTrial.phase}</Badge>
              <Badge variant="success" size="sm" dot>
                {selectedTrial.status}
              </Badge>
              {selectedTrial.activeAmendment && (
                <Badge variant="warning" size="sm">
                  Active: {selectedTrial.activeAmendment}
                </Badge>
              )}
            </div>
          }
          description={selectedTrial.trialName}
          size="lg"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button size="sm" variant="outline" onClick={() => setSelectedTrial(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<FileText className="w-4 h-4 text-[#2E7D5B]" />}
                  onClick={() => navigate('/protocol')}
                >
                  VIEW PROTOCOL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<TrendingUp className="w-4 h-4 text-[#2E7D5B]" />}
                  onClick={() => navigate('/impact')}
                >
                  ANALYZE IMPACT
                </Button>
                <Button
                  size="sm"
                  icon={<Cpu className="w-4 h-4" />}
                  onClick={() => navigate('/compiler')}
                >
                  COMPILE CHANGESET
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <div>
                <span className="text-[#66736B]">Protocol Version</span>
                <p className="font-mono text-[#2E7D5B] font-bold mt-0.5">{selectedTrial.protocolVersion}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Number of Sites</span>
                <p className="text-[#26352D] font-semibold mt-0.5">{selectedTrial.siteCount} Investigational Sites</p>
              </div>
              <div>
                <span className="text-[#66736B]">Participants Enrolled</span>
                <p className="text-[#26352D] font-semibold mt-0.5">
                  {selectedTrial.participantCount} / {selectedTrial.targetParticipants}
                </p>
              </div>
              <div>
                <span className="text-[#66736B]">Recruitment Completion</span>
                <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedTrial.recruitmentPct}% Completed</p>
              </div>
            </div>

            {/* Recruitment Bar */}
            <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#26352D]">Recruitment Progress</span>
                <span className="text-[#2E7D5B] font-semibold">{selectedTrial.recruitmentPct}% Target Met</span>
              </div>
              <div className="w-full h-2 bg-white border border-[#E8E4D9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E7D5B] rounded-full"
                  style={{ width: `${selectedTrial.recruitmentPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#66736B] font-medium">Study Indication</span>
              <p className="p-2.5 rounded-lg bg-[#FAF9F4] border border-[#E8E4D9] text-[#26352D]">
                {selectedTrial.indication}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[#66736B] font-medium">Clinical Description</span>
              <p className="p-2.5 rounded-lg bg-[#FAF9F4] border border-[#E8E4D9] text-[#26352D] leading-relaxed">
                {selectedTrial.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 text-[#66736B]">
              <div>Sponsor: <span className="text-[#26352D] font-medium">{selectedTrial.sponsor}</span></div>
              <div>Study Start: <span className="text-[#26352D] font-medium">{selectedTrial.startDate}</span></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Initiate Trial Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initiate New Trial Protocol"
        description="Register a new clinical protocol docket into the trial operations database."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateTrial}>
              Save Protocol
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTrial} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#26352D] font-medium mb-1">Trial ID *</label>
              <input
                type="text"
                value={newTrialId}
                onChange={(e) => setNewTrialId(e.target.value)}
                className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-lg p-2 font-mono text-[#26352D] focus:ring-1 focus:ring-[#2E7D5B]"
                required
              />
            </div>
            <div>
              <label className="block text-[#26352D] font-medium mb-1">Trial Phase</label>
              <select
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value as TrialOpsItem['phase'])}
                className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-lg p-2 text-[#26352D] focus:ring-1 focus:ring-[#2E7D5B]"
              >
                <option value="Phase I">Phase I</option>
                <option value="Phase II">Phase II</option>
                <option value="Phase IIb">Phase IIb</option>
                <option value="Phase III">Phase III</option>
                <option value="Phase IV">Phase IV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#26352D] font-medium mb-1">Trial Name *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Ayurvedic Intervention Trial"
              className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-lg p-2 text-[#26352D] focus:ring-1 focus:ring-[#2E7D5B]"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
