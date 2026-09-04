import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  FileText,
  TrendingUp,
  Cpu,
  ShieldCheck,
  LayoutDashboard,
  Clock,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { AuditTrailModal } from '../components/common/AuditTrailModal';
import { compilerService } from '../services/compilerService';
import { useToast } from '../hooks/useToast';

export const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [compilerStatus, setCompilerStatus] = useState<'BLOCKED' | 'READY'>(
    compilerService.getCompilerStatus()
  );

  useEffect(() => {
    // Sync state on focus/mount
    setCompilerStatus(compilerService.getCompilerStatus());
  }, []);

  const handleResetDemo = () => {
    compilerService.resetDemoState();
    compilerService.resetBackendState().catch((err) => console.warn('Reset backend error:', err));
    setCompilerStatus('BLOCKED');
    showToast('Demo State Reset', 'Reset to CS-0001 IN REVIEW, 3 blockers, Implementation BLOCKED', 'info');
  };

  const isReady = compilerStatus === 'READY';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
              SMART INDIA HACKATHON
            </span>
            <Badge variant="info" size="sm">
              Live Presentation Mode
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26352D] mt-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#2E7D5B]" />
            AYU-TRIAL FABRIC — LIVE DEMO
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            End-to-end interactive journey from protocol amendment to compile gates and implementation certification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<LayoutDashboard className="w-4 h-4 text-[#2E7D5B]" />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            icon={<RotateCcw className="w-4 h-4 text-rose-500" />}
            onClick={handleResetDemo}
          >
            RESET DEMO
          </Button>
        </div>
      </div>

      {/* Demo Active Context Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4D9] pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D5B] font-mono flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" />
              ACTIVE PRESENTATION TRAJECTORY
            </span>
            <h3 className="text-base font-bold text-[#26352D]">
              Trial: ATF-001 (AYU-TRIAL FABRIC Demonstration Trial)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              Amendment: CS-0001
            </Badge>
            <Badge variant={isReady ? 'success' : 'warning'} size="sm" dot>
              {isReady ? 'READY' : 'IN REVIEW'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[#66736B] block text-[11px]">Amendment Change Target:</span>
            <p className="font-mono text-[#26352D] font-semibold mt-0.5">
              Visit 4: <span className="text-rose-600 line-through">Day 25–31</span> →{' '}
              <span className="text-[#2E7D5B] font-bold">Day 25–35</span>
            </p>
          </div>

          <div>
            <span className="text-[#66736B] block text-[11px]">Affected Scope:</span>
            <p className="text-[#26352D] font-medium mt-0.5">3 Sites | 47 Participants | 1 Visit Window</p>
          </div>

          <div>
            <span className="text-[#66736B] block text-[11px]">Current Status:</span>
            <p className="font-bold text-[#2E7D5B] mt-0.5 font-mono">
              {isReady ? 'IMPLEMENTATION READY' : 'BLOCKED (3 Blockers Pending Verification)'}
            </p>
          </div>
        </div>
      </div>

      {/* 10. FINAL SUCCESS SCREEN (DISPLAYED WHEN COMPILER REACHES READY) */}
      {isReady && (
        <div className="p-6 rounded-2xl bg-[#EAF4EF] border-2 border-[#2E7D5B] shadow-md space-y-4 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7FAF91]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white text-[#2E7D5B] border border-[#7FAF91]/50 shrink-0 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#26352D] tracking-tight">
                  IMPLEMENTATION READY
                </h2>
                <p className="text-xs text-[#2E7D5B] font-semibold mt-0.5">
                  Docket <strong className="font-mono">CS-0001</strong> has satisfied all pre-flight governance gates
                </p>
              </div>
            </div>

            <Badge variant="success" size="lg" dot className="font-mono text-xs font-bold">
              CERTIFIED ROLLOUT
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Protocol</span>
              <span className="font-mono text-sm font-bold text-[#2E7D5B] block mt-0.5">v1.1</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Sites</span>
              <span className="text-sm font-bold text-[#26352D] block mt-0.5">3 Sites</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Participants</span>
              <span className="text-sm font-bold text-[#26352D] block mt-0.5">47 Participants</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Blocking Findings</span>
              <span className="text-sm font-bold text-[#2E7D5B] block mt-0.5">0 Blocking</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Warnings</span>
              <span className="text-sm font-bold text-amber-700 block mt-0.5">1 Warning</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Evidence</span>
              <span className="font-mono text-sm font-bold text-[#2E7D5B] block mt-0.5">4 / 4 Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#7FAF91]/40 text-center flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <span className="text-sm font-black uppercase tracking-wider text-[#2E7D5B] font-mono">
              CHANGESET READY FOR IMPLEMENTATION
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-[#2E7D5B] text-[#2E7D5B] hover:bg-[#EAF4EF] font-bold shrink-0"
              icon={<Clock className="w-4 h-4 text-[#2E7D5B]" />}
              onClick={() => setIsAuditOpen(true)}
            >
              VIEW AUDIT TRAIL
            </Button>
          </div>
        </div>
      )}

      {/* 8. SEQUENTIAL DEMO PRESENTATION BUTTONS */}
      <Card className="space-y-4 p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <div className="border-b border-[#E8E4D9] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono">
            Sequential Presentation Trajectory
          </h3>
          <p className="text-xs text-[#66736B] mt-0.5">
            Click through each stage to demonstrate the complete clinical change lifecycle to judges and stakeholders
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Step 1: Create Amendment */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col justify-between space-y-3 hover:border-[#7FAF91] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D5B] font-mono">STAGE 1</span>
              <h4 className="text-xs font-bold text-[#26352D]">1. CREATE AMENDMENT</h4>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Review Protocol v1.0 baseline and package Visit 4 window modification.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<FileText className="w-3.5 h-3.5 text-[#2E7D5B]" />}
              onClick={() => navigate('/protocol')}
            >
              1. CREATE AMENDMENT
            </Button>
          </div>

          {/* Step 2: Analyze Impact */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col justify-between space-y-3 hover:border-[#7FAF91] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D5B] font-mono">STAGE 2</span>
              <h4 className="text-xs font-bold text-[#26352D]">2. ANALYZE IMPACT</h4>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Execute dependency engine resolving 8 affected operational domains.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<TrendingUp className="w-3.5 h-3.5 text-[#2E7D5B]" />}
              onClick={() => navigate('/impact')}
            >
              2. ANALYZE IMPACT
            </Button>
          </div>

          {/* Step 3: Compile */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col justify-between space-y-3 hover:border-[#7FAF91] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D5B] font-mono">STAGE 3</span>
              <h4 className="text-xs font-bold text-[#26352D]">3. COMPILE</h4>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Pre-flight compilation triggering intentional 3 BLOCKERS failure.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<Cpu className="w-3.5 h-3.5 text-[#2E7D5B]" />}
              onClick={() => navigate('/compiler')}
            >
              3. COMPILE
            </Button>
          </div>

          {/* Step 4: Resolve Findings */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col justify-between space-y-3 hover:border-[#7FAF91] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D5B] font-mono">STAGE 4</span>
              <h4 className="text-xs font-bold text-[#26352D]">4. RESOLVE FINDINGS</h4>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Provide required IEC letter, consent addendum, and CRC training records.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />}
              onClick={() => navigate('/compiler')}
            >
              4. RESOLVE FINDINGS
            </Button>
          </div>

          {/* Step 5: Recompile */}
          <div className="p-4 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] flex flex-col justify-between space-y-3 hover:border-[#7FAF91] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#2E7D5B] font-mono">STAGE 5</span>
              <h4 className="text-xs font-bold text-[#26352D]">5. RECOMPILE</h4>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Re-evaluate verified package to achieve BUILD PASSED & certification.
              </p>
            </div>
            <Button
              size="sm"
              className="font-bold bg-[#2E7D5B] text-white hover:bg-[#246347]"
              icon={<Play className="w-3.5 h-3.5 text-white" />}
              onClick={() => navigate('/compiler')}
            >
              5. RECOMPILE
            </Button>
          </div>
        </div>
      </Card>

      {/* Immutable Protocol Audit Trail Modal */}
      <AuditTrailModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
};
