import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';

export const EthicsPage: React.FC = () => {
  const timelineSteps = [
    { name: 'Protocol Amendment Created', status: 'completed' },
    { name: 'Impact Identified', status: 'completed' },
    { name: 'IEC Notification Required', status: 'current', isHighlighted: true },
    { name: 'Documents Updated', status: 'pending' },
    { name: 'IEC Review', status: 'pending' },
    { name: 'Approval', status: 'pending' },
  ];

  const documents = [
    { name: 'Protocol Amendment', type: 'Amendment Docket (v1.1)', status: 'READY' as const },
    { name: 'Patient Information Sheet Addendum', type: 'PIS Addendum v1.1', status: 'REQUIRED' as const },
    { name: 'Consent Form Update', type: 'ICF Revision', status: 'REQUIRED' as const },
    { name: 'Investigator Notification', type: 'Regulatory Memo', status: 'PENDING' as const },
  ];

  const getDocBadgeVariant = (status: 'READY' | 'REQUIRED' | 'PENDING') => {
    switch (status) {
      case 'READY':
        return 'success';
      case 'REQUIRED':
        return 'danger';
      case 'PENDING':
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
          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
            ETHICS GOVERNANCE
          </span>
          <Badge variant="warning" size="sm" dot>
            IEC Review Required
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Institutional Ethics Committee (IEC / IRB)
        </h1>
        <p className="text-xs text-[#66736B] mt-0.5">
          Ethics committee dossier notifications, informed consent modifications, and review timeline tracking.
        </p>
      </div>

      {/* 1. ETHICS OVERVIEW CARD */}
      <Card className="p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-[#E8E4D9] pb-3 mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Ethics Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">IEC Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="warning" size="md" dot>
                Review Required
              </Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Amendment</span>
            <span className="font-mono text-base font-bold text-[#2E7D5B] block mt-0.5">
              CS-0001
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Sites Affected</span>
            <span className="text-base font-bold text-[#26352D] block mt-0.5">
              3 Sites
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
            <span className="text-[#66736B] block text-[11px]">Consent Update</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="danger" size="md">
                Required
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. SUBMISSION TIMELINE */}
      <Card className="p-6 space-y-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <CardHeader
          title="Submission Timeline"
          subtitle="Progress trajectory from protocol amendment creation to institutional approval"
        />

        {/* Current Step Callout Banner */}
        <div className="p-4 rounded-2xl bg-[#FEF9C3]/50 border border-[#FDE047] text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold">Current Step: IEC Notification Required</span>
          </div>
          <Badge variant="warning" size="sm" dot>
            Action Pending
          </Badge>
        </div>

        {/* Visual Timeline Stepper */}
        <div className="pt-2">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
            {timelineSteps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.isHighlighted;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center text-center relative group">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isCurrent
                        ? 'bg-[#FEF9C3] border-amber-500 text-amber-900 ring-4 ring-amber-200/50 scale-110'
                        : isCompleted
                        ? 'bg-[#EAF4EF] border-[#2E7D5B] text-[#2E7D5B]'
                        : 'bg-[#FAF9F4] border-[#E8E4D9] text-[#66736B]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <span
                    className={`text-xs mt-2 font-medium max-w-[120px] leading-tight ${
                      isCurrent
                        ? 'text-amber-900 font-bold'
                        : isCompleted
                        ? 'text-[#26352D]'
                        : 'text-[#66736B]'
                    }`}
                  >
                    {step.name}
                  </span>

                  {isCurrent && (
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-1 bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-amber-300">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. DOCUMENTS SECTION */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E4D9]">
          <div>
            <h3 className="text-sm font-semibold text-[#26352D]">Ethics Submission Documents</h3>
            <p className="text-xs text-[#66736B]">Essential artifacts required for IEC clearance of CS-0001</p>
          </div>
          <Badge variant="info" size="sm">
            4 Documents Tracked
          </Badge>
        </div>

        <Table
          data={documents}
          keyExtractor={(d) => d.name}
          columns={[
            {
              header: 'Document Name',
              className: 'min-w-[260px]',
              accessor: (d) => (
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF9F4] border border-[#E8E4D9] text-purple-700 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#26352D]">{d.name}</p>
                    <p className="text-[11px] text-[#66736B]">{d.type}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Status',
              className: 'text-right',
              accessor: (d) => (
                <Badge variant={getDocBadgeVariant(d.status)} size="md">
                  {d.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
