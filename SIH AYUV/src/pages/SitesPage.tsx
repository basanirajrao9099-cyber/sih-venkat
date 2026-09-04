import React, { useState } from 'react';
import { Building2, Search, Filter, Eye, CheckCircle2, MapPin, Plus } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { DEMO_SITES } from '../data/sites';
import { SiteOpsItem } from '../types/trialOps';
import { useToast } from '../hooks/useToast';

export const SitesPage: React.FC = () => {
  const { showToast } = useToast();
  const [sites, setSites] = useState<SiteOpsItem[]>(DEMO_SITES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<SiteOpsItem | null>(null);

  React.useEffect(() => {
    const fetchLiveSites = async () => {
      try {
        const res = await fetch('/api/v1/sites');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped: SiteOpsItem[] = list.map((s: any) => ({
              id: s.id,
              siteId: s.siteId,
              siteName: s.siteName || s.name,
              investigator: s.investigator || s.piName,
              location: s.location || `${s.city}, ${s.state}`,
              participants: s.participants || s.currentEnrollment || 18,
              trainingPct: s.trainingPct || 92,
              documentsPct: s.documentsPct || 100,
              activationStatus: s.activationStatus || 'ACTIVE',
              governanceStatus: s.governanceStatus || 'READY',
              contactEmail: s.contactEmail,
              lastMonitorVisit: s.lastMonitorVisit || '2026-02-18',
            }));
            setSites(mapped);
          }
        }
      } catch (err) {
        console.warn('Sites live API unreachable, using local state', err);
      }
    };

    fetchLiveSites();
  }, []);

  const filteredSites = sites.filter((s) => {
    const matchesSearch =
      s.siteId.toLowerCase().includes(search.toLowerCase()) ||
      s.siteName.toLowerCase().includes(search.toLowerCase()) ||
      s.investigator.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      s.activationStatus === statusFilter ||
      s.governanceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2E7D5B]" />
            Trial Sites & Center Operations
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Operational activation status, investigator credentials, and governance readiness across institutions.
          </p>
        </div>

        <Button
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => showToast('Site Onboarding', 'Site onboarding docket wizard initiated', 'info')}
        >
          Add Study Site
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
              placeholder="Search by Site ID (e.g. SITE-001), center name, or investigator..."
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
              <option value="ACTIVE">Activation: ACTIVE</option>
              <option value="READY">Governance: READY</option>
              <option value="PENDING AUDIT">Governance: PENDING AUDIT</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sites Table */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <Table
          data={filteredSites}
          keyExtractor={(s) => s.id}
          columns={[
            {
              header: 'Site ID & Name',
              className: 'min-w-[240px]',
              accessor: (s) => (
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">{s.siteId}</span>
                  <p className="text-xs font-semibold text-[#26352D] mt-1">{s.siteName}</p>
                  <p className="text-[11px] text-[#66736B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#66736B]" />
                    {s.location}
                  </p>
                </div>
              ),
            },
            {
              header: 'Investigator',
              accessor: (s) => (
                <div className="text-xs">
                  <p className="font-medium text-[#26352D]">{s.investigator}</p>
                  <p className="text-[10px] text-[#66736B]">{s.contactEmail}</p>
                </div>
              ),
            },
            {
              header: 'Participants',
              accessor: (s) => (
                <span className="text-xs font-semibold text-[#26352D]">
                  {s.participants} Participants
                </span>
              ),
            },
            {
              header: 'Training %',
              accessor: (s) => (
                <div className="text-xs space-y-1 w-24">
                  <div className="flex justify-between font-medium">
                    <span className="text-[#26352D]">{s.trainingPct}%</span>
                    <span className="text-[#66736B] text-[10px]">Training</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF9F4] rounded-full overflow-hidden border border-[#E8E4D9]">
                    <div
                      className="h-full bg-[#2E7D5B] rounded-full"
                      style={{ width: `${s.trainingPct}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              header: 'Documents %',
              accessor: (s) => (
                <div className="text-xs space-y-1 w-24">
                  <div className="flex justify-between font-medium">
                    <span className="text-[#26352D]">{s.documentsPct}%</span>
                    <span className="text-[#66736B] text-[10px]">Docs</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF9F4] rounded-full overflow-hidden border border-[#E8E4D9]">
                    <div
                      className="h-full bg-[#7FAF91] rounded-full"
                      style={{ width: `${s.documentsPct}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              header: 'Activation Status',
              accessor: (s) => (
                <Badge
                  variant={s.activationStatus === 'ACTIVE' ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {s.activationStatus}
                </Badge>
              ),
            },
            {
              header: 'Governance Status',
              accessor: (s) => (
                <Badge
                  variant={s.governanceStatus === 'READY' ? 'info' : 'warning'}
                  size="sm"
                >
                  {s.governanceStatus}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              className: 'text-right',
              accessor: (s) => (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                  onClick={() => setSelectedSite(s)}
                >
                  View Details
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Site Details Modal */}
      {selectedSite && (
        <Modal
          isOpen={Boolean(selectedSite)}
          onClose={() => setSelectedSite(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#2E7D5B] font-bold">{selectedSite.siteId}</span>
              <Badge variant="success" size="sm" dot>
                {selectedSite.activationStatus}
              </Badge>
              <Badge variant="info" size="sm">
                GOVERNANCE: {selectedSite.governanceStatus}
              </Badge>
            </div>
          }
          description={selectedSite.siteName}
          size="lg"
          footer={
            <Button size="sm" onClick={() => setSelectedSite(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <div>
                <span className="text-[#66736B]">Principal Investigator</span>
                <p className="text-[#26352D] font-semibold mt-0.5">{selectedSite.investigator}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Site Location</span>
                <p className="text-[#26352D] font-medium mt-0.5">{selectedSite.location}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Current Participants</span>
                <p className="text-[#2E7D5B] font-bold mt-0.5">{selectedSite.participants} Subjects</p>
              </div>
              <div>
                <span className="text-[#66736B]">GCP Training Compliance</span>
                <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.trainingPct}% Completed</p>
              </div>
              <div>
                <span className="text-[#66736B]">Regulatory Documents</span>
                <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.documentsPct}% Verified</p>
              </div>
              <div>
                <span className="text-[#66736B]">Last CRA Monitoring</span>
                <p className="text-[#26352D] font-mono mt-0.5">{selectedSite.lastMonitorVisit}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
                <span className="font-semibold text-[#26352D] block">Staff GCP Training Status</span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#66736B]">Investigator & Coordinator Training</span>
                  <span className="text-[#2E7D5B] font-bold">{selectedSite.trainingPct}%</span>
                </div>
                <div className="w-full h-2 bg-white border border-[#E8E4D9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E7D5B] rounded-full"
                    style={{ width: `${selectedSite.trainingPct}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
                <span className="font-semibold text-[#26352D] block">Essential Documents Binder</span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#66736B]">IRB/IEC, Form 44, CVs & Lab Certs</span>
                  <span className="text-[#2E7D5B] font-bold">{selectedSite.documentsPct}%</span>
                </div>
                <div className="w-full h-2 bg-white border border-[#E8E4D9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7FAF91] rounded-full"
                    style={{ width: `${selectedSite.documentsPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EAF4EF] border border-[#7FAF91]/40 text-[#2E7D5B] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D5B]" />
              <span>Center cleared for electronic data capture (EDC) and investigational product dispensing.</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
