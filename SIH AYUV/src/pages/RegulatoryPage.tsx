import React from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Award,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const RegulatoryPage: React.FC = () => {
  const regulatoryCards = [
    {
      title: 'CTRI',
      subtitle: 'Clinical Trials Registry - India',
      status: 'Update Required',
      variant: 'warning' as const,
      description: 'Public registry trial record must be updated with amended Visit 4 window before site initiation.',
      icon: <ShieldCheck className="w-5 h-5 text-amber-700" />,
    },
    {
      title: 'IEC',
      subtitle: 'Institutional Ethics Committees',
      status: 'Notification Required',
      variant: 'danger' as const,
      description: 'Expedited amendment submission required for central review board and satellite trial centers.',
      icon: <Award className="w-5 h-5 text-rose-600" />,
    },
    {
      title: 'Protocol',
      subtitle: 'Study Protocol Lineage',
      status: 'Amendment Drafted',
      variant: 'info' as const,
      description: 'Protocol v1.1 drafted with revised Section 6.2 Schedule of Assessments (Day 25–35 flex window).',
      icon: <FileText className="w-5 h-5 text-[#2E7D5B]" />,
    },
    {
      title: 'Consent',
      subtitle: 'Informed Consent Documentation',
      status: 'Update Required',
      variant: 'warning' as const,
      description: 'Patient Information Sheet addendum drafted for participant visit window flexibility acknowledgment.',
      icon: <FileCheck className="w-5 h-5 text-amber-700" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
            REGULATORY GOVERNANCE
          </span>
          <Badge variant="warning" size="sm" dot>
            Review Required
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#2E7D5B]" />
          Regulatory Compliance & Filings
        </h1>
        <p className="text-xs text-[#66736B] mt-0.5">
          CDSCO regulatory statutory filings, CTRI registry compliance, and protocol amendment oversight.
        </p>
      </div>

      {/* 1. REGULATORY STATUS OVERVIEW */}
      <Card className="p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-[#E8E4D9] pb-3 mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2E7D5B]" />
            Regulatory Status
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Trial</span>
            <span className="font-mono text-base font-bold text-[#26352D] block mt-0.5">
              ATF-001
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Protocol</span>
            <span className="font-mono text-base font-bold text-[#2E7D5B] block mt-0.5">
              v1.1
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Amendment</span>
            <span className="font-mono text-base font-bold text-[#2E7D5B] block mt-0.5">
              CS-0001
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Regulatory Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="danger" size="md" dot>
                REVIEW REQUIRED
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. REGULATORY STATUS CARDS */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B]">
          Regulatory Checkpoint Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regulatoryCards.map((card) => (
            <Card key={card.title} className="p-5 space-y-3 relative overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-xs">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                  {card.icon}
                </div>
                <Badge variant={card.variant} size="sm">
                  {card.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#26352D]">{card.title}</h3>
                <p className="text-[11px] text-[#66736B] mt-0.5 font-medium">{card.subtitle}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] text-[11px] text-[#26352D] leading-relaxed">
                Status: <strong className="text-[#26352D]">{card.status}</strong>
                <p className="text-[#66736B] mt-1">{card.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. REGULATORY IMPACT SECTION */}
      <div className="p-6 rounded-2xl bg-[#FEF9C3]/50 border border-[#FDE047] space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
            Regulatory Impact
          </h2>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-sm text-[#26352D] font-bold leading-relaxed">
            "ChangeSet CS-0001 modifies Visit 4 timing from Day 25–31 to Day 25–35."
          </p>
          <p className="text-xs text-amber-900 font-semibold leading-relaxed">
            "Regulatory documentation must be reviewed before implementation."
          </p>
          <p className="text-[11px] text-[#66736B] leading-relaxed pt-1">
            In accordance with CDSCO New Drugs and Clinical Trials Rules (2019), substantial changes to study visit assessment windows require formal documentation update in the regulatory binder and submission to CTRI prior to subject visit execution.
          </p>
        </div>
      </div>
    </div>
  );
};
