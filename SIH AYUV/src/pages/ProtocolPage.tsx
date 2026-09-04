import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, ArrowDown, CheckCircle2, GitCompare } from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const ProtocolPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'history'>('overview');

  const visits = [
    { name: 'Visit 1', day: 'Day 1', description: 'Baseline screening, consent verification & first dose allocation.' },
    { name: 'Visit 2', day: 'Day 7', description: 'Early tolerability, vitals check & compliance diary review.' },
    { name: 'Visit 3', day: 'Day 14', description: 'Mid-point safety laboratory draw & secondary assessment.' },
    { name: 'Visit 4', day: 'Day 25–31', description: 'End-of-month clinical endpoint evaluation & drug accountability.' },
  ];

  const versionHistory = [
    {
      version: 'v1.0',
      status: 'ACTIVE',
      date: '2025-10-15',
      summary: 'Initial CTRI registered protocol baseline with 4 scheduled clinic visits.',
      isCurrent: true,
    },
    {
      version: 'v1.1',
      status: 'DRAFT / PROPOSED',
      date: '2026-03-01',
      summary: 'Proposed amendment expanding Visit 4 window from Day 25–31 to Day 25–35.',
      isCurrent: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded border border-[#7FAF91]/40">
              ATF-001
            </span>
            <Badge variant="success" size="sm" dot>
              Status: ACTIVE (v1.0)
            </Badge>
            <Badge variant="warning" size="sm">
              Amendment: CS-0001 (IN REVIEW)
            </Badge>
            <span className="text-xs font-mono text-[#66736B]">Target: Protocol v1.1</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2E7D5B]" />
            Protocol Specification & Version History
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Primary Study: <strong className="text-[#26352D]">ATF-001 — AYU-TRIAL FABRIC Demonstration Trial</strong> (Phase III Multicenter RCT).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/changesets">
            <Button size="sm" icon={<GitCompare className="w-4 h-4" />}>
              CREATE AMENDMENT
            </Button>
          </Link>
          <Link to="/impact">
            <Button size="sm" variant="outline">
              ANALYZE IMPACT
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E4D9] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#7FAF91]/50 font-semibold'
              : 'text-[#66736B] hover:text-[#26352D]'
          }`}
        >
          Protocol v1.0 Overview & Visits
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#7FAF91]/50 font-semibold'
              : 'text-[#66736B] hover:text-[#26352D]'
          }`}
        >
          Version Comparison (v1.0 vs v1.1)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#7FAF91]/50 font-semibold'
              : 'text-[#66736B] hover:text-[#26352D]'
          }`}
        >
          Version History
        </button>
      </div>

      {/* TAB 1: PROTOCOL v1.0 OVERVIEW & VISITS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Status Card */}
          <Card className="p-5 bg-white border border-[#7FAF91]/40 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B] font-mono">
                  CURRENT REVISION
                </span>
                <h2 className="text-lg font-bold text-[#26352D]">Protocol v1.0</h2>
                <p className="text-xs text-[#66736B]">
                  Approved by Central Ethics Committee (IEC-AIIA-2025-084) and registered with CTRI.
                </p>
              </div>
              <Badge variant="success" size="lg" dot className="font-mono font-bold">
                ACTIVE
              </Badge>
            </div>
          </Card>

          {/* Visits Grid */}
          <Card className="p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm space-y-4">
            <CardHeader
              title="Protocol Visit Schedule"
              subtitle="4 core scheduled clinical clinic visits for trial participants"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {visits.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-2 relative overflow-hidden group hover:border-[#7FAF91] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#26352D]">{v.name}</span>
                    <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded border border-[#7FAF91]/40">
                      {v.day}
                    </span>
                  </div>
                  <p className="text-xs text-[#66736B] leading-relaxed">{v.description}</p>
                  <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#2E7D5B] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                    <span>Mandatory Protocol Window</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: VERSION COMPARISON (v1.0 vs v1.1) */}
      {activeTab === 'comparison' && (
        <Card className="p-6 space-y-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
          <div className="border-b border-[#E8E4D9] pb-4">
            <h2 className="text-base font-bold text-[#26352D] flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#2E7D5B]" />
              Protocol Version Comparison: v1.0 vs v1.1
            </h2>
            <p className="text-xs text-[#66736B] mt-1">
              Side-by-side visual diff of Visit 4 schedule window modification.
            </p>
          </div>

          {/* Visual Comparison Flow */}
          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-4 py-2">
            {/* Old Protocol State */}
            <div className="w-full p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  PROTOCOL v1.0 (BASELINE)
                </span>
                <Badge variant="default" size="sm">Current Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E4D9]">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#26352D]">Visit 4</span>
                  <p className="text-[11px] text-[#66736B]">Scheduled clinical window</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-rose-600 font-bold block">OLD VALUE</span>
                  <span className="font-mono text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-md border border-rose-200 line-through">
                    Day 25–31
                  </span>
                </div>
              </div>
            </div>

            {/* Transition Indicator */}
            <div className="flex flex-col items-center gap-1 text-[#2E7D5B] py-1">
              <ArrowDown className="w-4 h-4 text-[#2E7D5B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] bg-[#EAF4EF] px-3 py-0.5 rounded-full border border-[#7FAF91]/40">
                AMENDMENT
              </span>
              <ArrowDown className="w-4 h-4 text-[#2E7D5B]" />
            </div>

            {/* New Protocol State */}
            <div className="w-full p-4 rounded-2xl bg-[#FAF9F4] border border-[#7FAF91]/50 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2E7D5B] uppercase tracking-wider">
                  PROTOCOL v1.1 (PROPOSED)
                </span>
                <Badge variant="success" size="sm" dot>Amendment Target</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#7FAF91]/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#26352D]">Visit 4</span>
                  <p className="text-[11px] text-[#2E7D5B]">Extended 4-day flex window</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-[#2E7D5B] font-bold block">NEW VALUE</span>
                  <span className="font-mono text-sm font-bold text-[#2E7D5B] bg-[#EAF4EF] px-3 py-1 rounded-md border border-[#7FAF91]/50">
                    Day 25–35
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-[#26352D]">Ready to formalize this change?</h4>
              <p className="text-[11px] text-[#66736B] mt-0.5">
                Launch the ChangeSet composer to package this amendment into formal docket <strong>CS-0001</strong>.
              </p>
            </div>
            <Link to="/changesets">
              <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Compose ChangeSet
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* TAB 3: PROTOCOL VERSION HISTORY */}
      {activeTab === 'history' && (
        <Card className="space-y-4 p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
          <CardHeader
            title="Protocol Version History"
            subtitle="Lineage and release records for study ATF-001"
          />

          <div className="space-y-3">
            {versionHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#26352D]">{item.version}</span>
                    <Badge variant={item.isCurrent ? 'success' : 'warning'} size="sm" dot={item.isCurrent}>
                      {item.status}
                    </Badge>
                    <span className="text-xs font-mono text-[#66736B]">Released: {item.date}</span>
                  </div>
                  <p className="text-xs text-[#66736B]">{item.summary}</p>
                </div>

                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant={item.isCurrent ? 'outline' : 'secondary'}
                    onClick={() => setActiveTab('comparison')}
                  >
                    Compare Diff
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
