import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Users,
  Building2,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Sparkles,
  GitPullRequest,
  Cpu,
  Layers,
  Database,
  Award,
  BookOpen,
  ShieldCheck,
  Sprout,
  Activity,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { compilerService, ReadinessSummary } from '../services/compilerService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState<ReadinessSummary>(compilerService.getReadiness());

  useEffect(() => {
    // Refresh compiler readiness on mount
    setReadiness(compilerService.getReadiness());
  }, []);

  const isReady = readiness.status === 'READY';

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: AYURVEDA + AI + PERSONALIZED HEALTH */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FAF9F4] to-[#F5F1E8] border border-[#E8E4D9] p-6 sm:p-8 shadow-sm">
        {/* Subtle Ayurvedic botanical background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#7FAF91]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-48 h-48 bg-[#C9A227]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF4EF] text-[#2E7D5B] border border-[#7FAF91]/40">
                <Sprout className="w-3.5 h-3.5 text-[#2E7D5B]" />
                AI-Powered Ayurvedic Clinical Intelligence
              </span>
              <span className="text-xs text-[#66736B] font-medium">• Central Orchestration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#26352D]">
              AYU-TRIAL FABRIC
            </h1>
            <p className="text-sm text-[#66736B] leading-relaxed">
              Standardized Ayurvedic botanical trial lifecycle platform with deterministic ChangeSet compilation, verifiable Merkle audit trails, and multi-site GCP compliance.
            </p>
          </div>

          {/* DEMO MODE & ACTION BUTTONS */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/demo">
              <Button
                size="md"
                className="bg-[#2E7D5B] hover:bg-[#246347] text-white font-bold shadow-md shadow-[#2E7D5B]/20 text-xs px-5 py-2.5 rounded-xl transition-all"
                icon={<Sparkles className="w-4 h-4 text-[#FBF6E5]" />}
              >
                LAUNCH DEMO MODE
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. EXACT 6 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Trials: 1 */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs space-y-1 hover:border-[#7FAF91] transition-colors">
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Active Trials</span>
            <div className="p-1.5 rounded-lg bg-[#EAF4EF] text-[#2E7D5B]">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#26352D]">1</div>
          <p className="text-[10px] text-[#2E7D5B] font-mono font-medium">ATF-001 (Phase II/III)</p>
        </div>

        {/* Active Sites: 3 */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs space-y-1 hover:border-[#7FAF91] transition-colors">
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Active Sites</span>
            <div className="p-1.5 rounded-lg bg-[#FAF9F4] text-[#26352D]">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#26352D]">3</div>
          <p className="text-[10px] text-[#66736B]">Hyderabad, Delhi, Jaipur</p>
        </div>

        {/* Participants: 47 */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs space-y-1 hover:border-[#7FAF91] transition-colors">
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Participants</span>
            <div className="p-1.5 rounded-lg bg-[#FAF9F4] text-[#26352D]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#26352D]">47</div>
          <p className="text-[10px] text-[#66736B]">In Active Cohort</p>
        </div>

        {/* Open ChangeSets: 1 */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs space-y-1 hover:border-[#7FAF91] transition-colors">
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Open ChangeSets</span>
            <div className="p-1.5 rounded-lg bg-[#FBF6E5] text-[#8D6F12]">
              <GitPullRequest className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#26352D]">1</div>
          <p className="text-[10px] text-[#8D6F12] font-mono font-medium">CS-0001 (In Review)</p>
        </div>

        {/* Pending Findings */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs space-y-1 hover:border-[#7FAF91] transition-colors">
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Pending Findings</span>
            <div className="p-1.5 rounded-lg bg-[#FEF9C3] text-[#92400E]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-black ${isReady ? 'text-[#2E7D5B]' : 'text-amber-700'}`}>
            {readiness.blockingFindings}
          </div>
          <p className="text-[10px] text-[#66736B]">
            {isReady ? 'All Resolved' : 'Governance Blockers'}
          </p>
        </div>

        {/* Implementation Readiness */}
        <div
          className={`p-4 rounded-2xl border shadow-xs space-y-1 transition-colors ${
            isReady
              ? 'bg-[#EAF4EF] border-[#7FAF91]/60'
              : 'bg-[#FDF2F2] border-[#FCA5A5]'
          }`}
        >
          <div className="flex items-center justify-between text-[#66736B]">
            <span className="text-[11px] font-semibold">Readiness Gate</span>
            {isReady ? (
              <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div
            className={`text-base font-black font-mono tracking-tight ${
              isReady ? 'text-[#2E7D5B]' : 'text-rose-700'
            }`}
          >
            {readiness.status}
          </div>
          <p className="text-[10px] text-[#66736B]">
            {isReady ? 'Certified Rollout' : 'Pre-Flight Gates'}
          </p>
        </div>
      </div>

      {/* 3 & 4 & 5 & 6. MAIN CONTENT TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: ACTIVE CHANGESET & IMPACT SNAPSHOT */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3. ACTIVE CHANGESET CARD */}
          <Card className="p-6 bg-white border border-[#E8E4D9] shadow-sm space-y-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4D9] pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] font-mono">
                    ACTIVE AMENDMENT
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
                    CS-0001
                  </span>
                  <Badge variant="warning" size="sm" dot>
                    IN REVIEW
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-[#26352D] mt-1">
                  ATF-001 — AYU-TRIAL FABRIC Demonstration Trial
                </h3>
              </div>

              {/* Required buttons: VIEW IMPACT and COMPILE */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<TrendingUp className="w-4 h-4 text-[#2E7D5B]" />}
                  onClick={() => navigate('/impact')}
                >
                  VIEW IMPACT
                </Button>
                <Button
                  size="sm"
                  icon={<Cpu className="w-4 h-4" />}
                  onClick={() => navigate('/compiler')}
                >
                  COMPILE
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
                <span className="text-[#66736B] text-[11px] font-medium">Target Protocol:</span>
                <p className="font-mono text-sm font-bold text-[#2E7D5B]">Protocol v1.1</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
                <span className="text-[#66736B] text-[11px] font-medium">Visit 4 Schedule Change:</span>
                <p className="font-mono text-xs font-bold">
                  <span className="text-rose-600 line-through">Day 25–31</span> →{' '}
                  <span className="text-[#2E7D5B]">Day 25–35</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1">
                <span className="text-[#66736B] text-[11px] font-medium">Current Status:</span>
                <p className="font-semibold text-amber-800">IN REVIEW (Rule Engine Active)</p>
              </div>
            </div>
          </Card>

          {/* 4. IMPACT SNAPSHOT */}
          <Card className="p-6 bg-white border border-[#E8E4D9] shadow-sm space-y-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4D9] pb-3.5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2E7D5B]" />
                  IMPACT SNAPSHOT
                </h3>
                <p className="text-xs text-[#66736B] mt-0.5">
                  Automated dependency blast radius across clinical operations
                </p>
              </div>

              {/* Button: VIEW FULL IMPACT */}
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowRight className="w-4 h-4 text-[#2E7D5B]" />}
                onClick={() => navigate('/impact')}
              >
                VIEW FULL IMPACT
              </Button>
            </div>

            {/* Exactly 8 prompt items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">3 Sites</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <Users className="w-4 h-4 text-teal-700 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">47 Participants</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">1 Visit</span>
                  <span className="text-[10px] text-[#66736B]">Affected (V4)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-amber-800 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">1 CRF</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <Database className="w-4 h-4 text-blue-700 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">1 EDC Mapping</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <Award className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">Ethics</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">Training</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <div>
                  <span className="font-bold text-[#26352D] block">Consent</span>
                  <span className="text-[10px] text-[#66736B]">Affected</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT 1 COLUMN: READINESS CARD & SYSTEM STATUS */}
        <div className="space-y-6">
          {/* 6. READINESS CARD */}
          <Card
            className={`p-6 space-y-4 border rounded-2xl shadow-sm transition-colors ${
              isReady
                ? 'bg-gradient-to-br from-white to-[#EAF4EF] border-[#7FAF91]'
                : 'bg-gradient-to-br from-white to-[#FAF9F4] border-[#E8E4D9]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B] font-mono">
                  GOVERNANCE GATE
                </span>
                <h3 className="text-sm font-bold text-[#26352D] mt-0.5">
                  IMPLEMENTATION STATUS
                </h3>
              </div>
              <Badge variant={isReady ? 'success' : 'danger'} size="md" dot className="font-mono font-bold">
                {readiness.status}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E8E4D9] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#66736B]">Blocking Findings:</span>
                <span className={`font-bold ${isReady ? 'text-[#2E7D5B]' : 'text-rose-600'}`}>
                  {readiness.blockingFindings} Blocking Findings
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#66736B]">Warnings:</span>
                <span className="font-bold text-amber-700">1 Warning</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E8E4D9]">
                <span className="text-[#66736B]">Evidence Fulfillment:</span>
                <span className="font-mono font-bold text-[#2E7D5B]">{readiness.evidence}</span>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full font-bold"
              variant={isReady ? 'primary' : 'secondary'}
              icon={<Cpu className="w-4 h-4" />}
              onClick={() => navigate('/compiler')}
            >
              {isReady ? 'VIEW CERTIFIED PACKAGE' : 'LAUNCH COMPILER GATE'}
            </Button>
          </Card>

          {/* 5. SYSTEM STATUS */}
          <Card className="p-6 bg-white border border-[#E8E4D9] shadow-sm space-y-3 rounded-2xl">
            <div className="border-b border-[#E8E4D9] pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2E7D5B]" />
                SYSTEM STATUS
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">EDC / REDCap</span>
                <Badge variant="success" size="sm" dot>CONNECTED</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">HIS Clinical Data</span>
                <Badge variant="success" size="sm" dot>CONNECTED</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">FHIR Bridge</span>
                <Badge variant="info" size="sm">READY</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">ABDM Health ID</span>
                <Badge variant="info" size="sm">READY</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">CTRI Registry</span>
                <Badge variant="warning" size="sm">REVIEW REQUIRED</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <span className="font-medium text-[#26352D]">Pharmacovigilance (PvPI)</span>
                <Badge variant="success" size="sm" dot>CONNECTED</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
