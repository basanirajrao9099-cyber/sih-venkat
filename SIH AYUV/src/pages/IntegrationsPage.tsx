import React from 'react';
import {
  Boxes,
  Database,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const IntegrationsPage: React.FC = () => {
  const systems = [
    {
      name: 'EDC / REDCap',
      type: 'Electronic Data Capture',
      status: 'CONNECTED' as const,
      description: 'REDCap Enterprise instance hosting clinical trial eCRFs and patient visits.',
      icon: <Database className="w-5 h-5 text-[#2E7D5B]" />,
    },
    {
      name: 'HIS',
      type: 'Hospital Information System',
      status: 'CONNECTED' as const,
      description: 'Central hospital EHR and clinic appointment scheduling backend.',
      icon: <Cpu className="w-5 h-5 text-[#2E7D5B]" />,
    },
    {
      name: 'FHIR',
      type: 'Health Interoperability Standard',
      status: 'READY' as const,
      description: 'HL7 FHIR R4 clinical research resource schema gateway.',
      icon: <Radio className="w-5 h-5 text-[#2E7D5B]" />,
    },
    {
      name: 'ABDM',
      type: 'Ayushman Bharat Digital Mission',
      status: 'READY' as const,
      description: 'National health ID and digital health records registry bridge.',
      icon: <Layers className="w-5 h-5 text-[#2E7D5B]" />,
    },
    {
      name: 'CTRI',
      type: 'Clinical Registry Gateway',
      status: 'REVIEW REQUIRED' as const,
      description: 'National trial registry metadata and recruitment telemetry synchronization.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
    },
    {
      name: 'Pharmacovigilance',
      type: 'Safety Adverse Event Stream',
      status: 'CONNECTED' as const,
      description: 'Automated 24-hour safety signal reporting and adverse event pipeline.',
      icon: <CheckCircle2 className="w-5 h-5 text-[#2E7D5B]" />,
    },
  ];

  const impactItems = [
    {
      target: 'REDCap eCRF mapping',
      impact: 'UPDATE REQUIRED',
      variant: 'danger' as const,
      detail: 'Visit 4 schedule window rules in REDCap dictionary must be updated from Day 25–31 to Day 25–35 to avoid flagging false out-of-window visit discrepancies.',
    },
    {
      target: 'FHIR schedule mapping',
      impact: 'UPDATE REQUIRED',
      variant: 'danger' as const,
      detail: 'FHIR Appointment and ResearchStudy resource schedule parameters must align with Protocol v1.1 window flexibility.',
    },
    {
      target: 'CTRI metadata',
      impact: 'REVIEW REQUIRED',
      variant: 'warning' as const,
      detail: 'Public trial metadata on the central trial registry requires administrative amendment filing.',
    },
    {
      target: 'Pharmacovigilance window',
      impact: 'REVIEW REQUIRED',
      variant: 'warning' as const,
      detail: 'Safety event surveillance calendar window must be extended by 4 days for cohort participants reaching Visit 4.',
    },
  ];

  const getSystemBadgeVariant = (status: 'CONNECTED' | 'READY' | 'REVIEW REQUIRED') => {
    switch (status) {
      case 'CONNECTED':
        return 'success';
      case 'READY':
        return 'info';
      case 'REVIEW REQUIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
            INTEROPERABILITY
          </span>
          <Badge variant="success" size="sm" dot>
            Pipelines Operational
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-[#2E7D5B]" />
          System Interoperability & Connected Gateways
        </h1>
        <p className="text-xs text-[#66736B] mt-0.5">
          Health IT integration hub bridging EDC, EHR, FHIR standards, ABDM, and safety surveillance.
        </p>
      </div>

      {/* 1. INTEGRATION IMPACT — CS-0001 */}
      <Card className="p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2E7D5B]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono">
                Integration Impact — CS-0001
              </h2>
            </div>
            <p className="text-xs text-[#66736B] mt-0.5">
              Protocol v1.1 (Visit 4 Day 25–31 → Day 25–35) system synchronization requirements
            </p>
          </div>
          <Badge variant="warning" size="sm">
            4 Connectors Affected
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {impactItems.map((item) => (
            <div
              key={item.target}
              className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-2 hover:border-[#7FAF91] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#26352D] text-xs">{item.target}</span>
                <Badge variant={item.variant} size="sm">
                  {item.impact}
                </Badge>
              </div>
              <p className="text-[11px] text-[#66736B] leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. SYSTEM STATUS GRID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B]">
            SYSTEM STATUS
          </h2>
          <span className="text-[11px] text-[#66736B] font-mono">6 Connected Ecosystem Endpoints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((sys) => (
            <Card key={sys.name} className="p-5 space-y-3 relative overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-xs">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                  {sys.icon}
                </div>
                <Badge
                  variant={getSystemBadgeVariant(sys.status)}
                  size="sm"
                  dot={sys.status === 'CONNECTED'}
                >
                  {sys.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#26352D]">{sys.name}</h3>
                <p className="text-[11px] text-[#66736B] font-medium">{sys.type}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] text-[11px] text-[#26352D] leading-relaxed">
                Status: <strong className="text-[#26352D]">{sys.status}</strong>
                <p className="text-[#66736B] mt-1">{sys.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
