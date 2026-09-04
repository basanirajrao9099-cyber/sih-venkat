import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { Card, MetricCard } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';

interface SafetyCase {
  caseId: string;
  participant: string;
  event: string;
  severity: 'Mild' | 'Moderate' | 'Serious';
  status: 'Open' | 'Under Review' | 'Escalated' | 'Closed';
  lastUpdated: string;
}

export const SafetyPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const cases: SafetyCase[] = [
    {
      caseId: 'SA-001',
      participant: 'P-014',
      event: 'Headache',
      severity: 'Moderate',
      status: 'Under Review',
      lastUpdated: 'Today',
    },
    {
      caseId: 'SA-002',
      participant: 'P-027',
      event: 'Dizziness',
      severity: 'Mild',
      status: 'Open',
      lastUpdated: 'Today',
    },
    {
      caseId: 'SA-003',
      participant: 'P-031',
      event: 'Adverse Event',
      severity: 'Serious',
      status: 'Escalated',
      lastUpdated: 'Yesterday',
    },
    {
      caseId: 'SA-004',
      participant: 'P-039',
      event: 'Transient Nausea',
      severity: 'Mild',
      status: 'Closed',
      lastUpdated: '2 days ago',
    },
    {
      caseId: 'SA-005',
      participant: 'P-042',
      event: 'Skin Rash (Forearms)',
      severity: 'Moderate',
      status: 'Under Review',
      lastUpdated: '3 days ago',
    },
    {
      caseId: 'SA-006',
      participant: 'P-045',
      event: 'Somnolence',
      severity: 'Mild',
      status: 'Open',
      lastUpdated: '4 days ago',
    },
    {
      caseId: 'SA-007',
      participant: 'P-047',
      event: 'Hepatic Enzyme Fluctuation',
      severity: 'Serious',
      status: 'Escalated',
      lastUpdated: '5 days ago',
    },
  ];

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseId.toLowerCase().includes(search.toLowerCase()) ||
      c.participant.toLowerCase().includes(search.toLowerCase()) ||
      c.event.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev) {
      case 'Serious':
        return 'danger';
      case 'Moderate':
        return 'warning';
      case 'Mild':
        return 'success';
      default:
        return 'info';
    }
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'Escalated':
        return 'danger';
      case 'Under Review':
        return 'warning';
      case 'Open':
        return 'info';
      case 'Closed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            PHARMACOVIGILANCE
          </span>
          <Badge variant="danger" size="sm" dot>
            Surveillance Active
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          Safety & Pharmacovigilance
        </h1>
        <p className="text-xs text-[#66736B] mt-0.5">
          Real-time safety surveillance, adverse event signal tracking, and trial safety triage.
        </p>
      </div>

      {/* SECTION: SAFETY IMPACT OF CS-0001 */}
      <div className="p-4 rounded-2xl bg-[#FEF9C3]/50 border border-[#FDE047] shadow-xs flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
              SAFETY IMPACT OF CS-0001
            </span>
            <Badge variant="warning" size="sm">
              Active Amendment
            </Badge>
          </div>
          <p className="text-xs text-[#26352D] font-semibold">
            "Visit 4 schedule change may affect safety monitoring windows for 47 participants."
          </p>
          <p className="text-[11px] text-[#66736B]">
            Cohort monitoring protocols at Sites 01, 02, and 03 must ensure LFT/RFT laboratory assessment is conducted within the extended Day 25–35 boundary.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Safety Signals"
          value="2"
          change="Signals Flagged"
          changeType="negative"
          icon={<Activity className="w-5 h-5 text-rose-600" />}
          description="Signals under medical triage"
        />
        <MetricCard
          label="Open Cases"
          value="7"
          change="Pending Resolution"
          changeType="neutral"
          icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
          description="Active adverse events logged"
        />
        <MetricCard
          label="Serious Events"
          value="3"
          change="24h Expedited Track"
          changeType="negative"
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          description="Reported to licensing board"
        />
        <MetricCard
          label="Pending Review"
          value="4"
          change="Medical Monitor Queue"
          changeType="neutral"
          icon={<Clock className="w-5 h-5 text-[#2E7D5B]" />}
          description="Awaiting causality clearance"
        />
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
              placeholder="Search by Case ID (e.g. SA-001), participant, or event..."
              className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#26352D] placeholder-[#66736B] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#66736B]" />
            <span className="text-xs text-[#66736B] font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E8E4D9] text-xs text-[#26352D] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#2E7D5B] cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Serious">Serious</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SAFETY TABLE */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E4D9]">
          <div>
            <h3 className="text-sm font-semibold text-[#26352D]">Pharmacovigilance Case Ledger</h3>
            <p className="text-xs text-[#66736B]">Adverse event reports across active study sites</p>
          </div>
          <span className="text-xs font-mono text-[#66736B]">{filteredCases.length} Cases</span>
        </div>

        <Table
          data={filteredCases}
          keyExtractor={(c) => c.caseId}
          columns={[
            {
              header: 'Case ID',
              accessor: (c) => (
                <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">
                  {c.caseId}
                </span>
              ),
            },
            {
              header: 'Participant',
              accessor: (c) => (
                <span className="font-mono text-xs font-medium text-[#26352D]">
                  {c.participant}
                </span>
              ),
            },
            {
              header: 'Event',
              className: 'min-w-[180px]',
              accessor: (c) => (
                <span className="text-xs font-semibold text-[#26352D]">{c.event}</span>
              ),
            },
            {
              header: 'Severity',
              accessor: (c) => (
                <Badge variant={getSeverityBadgeVariant(c.severity)} size="sm">
                  {c.severity}
                </Badge>
              ),
            },
            {
              header: 'Status',
              accessor: (c) => (
                <Badge
                  variant={getStatusBadgeVariant(c.status)}
                  size="sm"
                  dot={c.status === 'Under Review' || c.status === 'Escalated'}
                >
                  {c.status}
                </Badge>
              ),
            },
            {
              header: 'Last Updated',
              className: 'text-right',
              accessor: (c) => (
                <span className="text-xs text-[#66736B] font-mono">{c.lastUpdated}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
