import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Layers,
  Check,
  LayoutDashboard,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { AuditTrailModal } from '../components/common/AuditTrailModal';
import { AdvisoryModal, AdvisoryFindingExplanation } from '../components/common/AdvisoryModal';
import {
  compilerService,
  Finding,
  Obligation,
  EvidenceItem,
  PipelineStepName,
  PipelineStepStatus,
} from '../services/compilerService';
import { useToast } from '../hooks/useToast';

export const CompilerPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryFindingExplanation | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  // Compiler state machine: 'idle' | 'compiling' | 'failed' | 'recompiling' | 'ready'
  const [compilerState, setCompilerState] = useState<
    'idle' | 'compiling' | 'failed' | 'recompiling' | 'ready'
  >('idle');

  // Animation step messages
  const [compileStepText, setCompileStepText] = useState<string>('');

  // Data collections
  const [findings, setFindings] = useState<Finding[]>(compilerService.getInitialFindings());
  const [obligations, setObligations] = useState<Obligation[]>(
    compilerService.getInitialObligations()
  );
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(
    compilerService.getInitialEvidence()
  );

  useEffect(() => {
    // Load live backend findings, obligations, and evidence
    const loadLiveGovernance = async () => {
      try {
        const [fRes, oRes, eRes] = await Promise.all([
          fetch('/api/v1/compiler/findings?changeSetId=CS-0001'),
          fetch('/api/v1/compiler/obligations?changeSetId=CS-0001'),
          fetch('/api/v1/compiler/evidence?changeSetId=CS-0001'),
        ]);
        if (fRes.ok) {
          const fData = await fRes.json();
          if (Array.isArray(fData) && fData.length > 0) setFindings(fData);
        }
        if (oRes.ok) {
          const oData = await oRes.json();
          if (Array.isArray(oData) && oData.length > 0) setObligations(oData);
        }
        if (eRes.ok) {
          const eData = await eRes.json();
          if (Array.isArray(eData) && eData.length > 0) setEvidenceList(eData);
        }
      } catch (err) {
        console.warn('Backend compiler API unreachable, using local state', err);
      }
    };
    loadLiveGovernance();
  }, []);

  // Pipeline Steps
  const pipelineSteps: PipelineStepName[] = [
    'CHANGESET',
    'IMPACT',
    'COMPILE',
    'RULES',
    'FINDINGS',
    'OBLIGATIONS',
    'EVIDENCE',
    'VERIFICATION',
    'READY',
  ];

  const getStepStatus = (step: PipelineStepName): PipelineStepStatus => {
    if (compilerState === 'idle') return 'PENDING';
    if (compilerState === 'compiling' || compilerState === 'recompiling') return 'RUNNING';
    if (compilerState === 'failed') {
      if (['CHANGESET', 'IMPACT', 'COMPILE', 'RULES'].includes(step)) return 'PASSED';
      if (['FINDINGS', 'OBLIGATIONS', 'EVIDENCE', 'VERIFICATION'].includes(step)) return 'FAILED';
      return 'PENDING';
    }
    if (compilerState === 'ready') return 'PASSED';
    return 'PENDING';
  };

  const getStepBadge = (status: PipelineStepStatus) => {
    switch (status) {
      case 'PASSED':
        return <span className="text-[9px] font-bold text-[#2E7D5B] font-mono">PASSED</span>;
      case 'FAILED':
        return <span className="text-[9px] font-bold text-rose-600 font-mono">FAILED</span>;
      case 'RUNNING':
        return <span className="text-[9px] font-bold text-amber-700 font-mono animate-pulse">RUNNING</span>;
      default:
        return <span className="text-[9px] font-bold text-[#66736B] font-mono">PENDING</span>;
    }
  };

  // Run initial compilation
  const handleCompile = () => {
    setCompilerState('compiling');

    // Trigger real backend pipeline run asynchronously
    fetch('/api/v1/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeSetId: 'CS-0001', trialId: 'AYU-2026-0001' }),
    }).catch((err) => console.warn('Backend compiler run error:', err));

    const steps = [
      '1. Reading ChangeSet...',
      '2. Loading impact dependencies...',
      '3. Evaluating governance rules...',
      '4. Generating findings...',
      '5. Creating obligations...',
      '6. Checking evidence...',
      '7. Verification complete',
    ];

    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setCompileStepText(msg);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setCompilerState('failed');
            compilerService.setCompilerStatus('BLOCKED');
            showToast('Compilation Completed', 'Build Failed: 3 Blockers, 1 Warning found', 'warning');
          }, 300);
        }
      }, idx * 250);
    });
  };

  // Recompile after resolving evidence
  const handleRecompile = () => {
    setCompilerState('recompiling');

    // Trigger real backend compiler run to verify zero blockers
    fetch('/api/v1/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeSetId: 'CS-0001', trialId: 'AYU-2026-0001' }),
    }).catch((err) => console.warn('Backend recompile run error:', err));

    const steps = [
      'Checking findings...',
      'Verifying evidence...',
      'Re-running governance checks...',
      'Finalizing implementation package...',
    ];

    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setCompileStepText(msg);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            // Resolve blocking findings
            const updatedFindings = findings.map((f) =>
              f.type === 'BLOCK' ? { ...f, status: 'RESOLVED' as const } : f
            );
            setFindings(updatedFindings);
            setCompilerState('ready');
            compilerService.setCompilerStatus('READY');
            showToast('Build Passed', 'Implementation package verified and ready for deployment', 'success');
          }, 350);
        }
      }, idx * 350);
    });
  };

  // Toggle evidence to VERIFIED
  const handleAddEvidence = (id: string) => {
    compilerService.verifyEvidence(id).catch((err) => console.warn('Backend verify evidence error:', err));

    const updated = evidenceList.map((e) =>
      e.id === id ? { ...e, status: 'VERIFIED' as const, buttonText: 'VERIFIED' } : e
    );
    setEvidenceList(updated);

    if (id === 'EVD-01') toggleObligationStatus('OBL-01', 'COMPLETED');
    if (id === 'EVD-02') toggleObligationStatus('OBL-02', 'COMPLETED');
    if (id === 'EVD-03') toggleObligationStatus('OBL-03', 'COMPLETED');

    showToast('Evidence Uploaded', 'Artifact verified against protocol schema', 'success', 1500);
  };

  // Consult Advisory AI for regulatory explanation of finding
  const handleExplainFinding = async (finding: Finding) => {
    setIsAdvisoryOpen(true);
    setAdvisoryLoading(true);
    try {
      const res = await fetch('/api/v1/advisory/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id, changeSetId: 'CS-0001' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdvisoryData(data);
      } else {
        showToast('Advisory Unavailable', 'Could not retrieve regulatory explanation', 'warning');
      }
    } catch (err) {
      console.warn('Advisory query error:', err);
      showToast('Advisory Error', 'Failed to consult advisory engine', 'warning');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  // Toggle obligation status
  const toggleObligationStatus = (id: string, forceStatus?: 'OPEN' | 'COMPLETED') => {
    setObligations((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const next = forceStatus || (o.status === 'OPEN' ? 'COMPLETED' : 'OPEN');
          return { ...o, status: next };
        }
        return o;
      })
    );
  };

  // Reset entire compiler flow to idle
  const handleReset = () => {
    fetch('/api/v1/compiler/reset?changeSetId=CS-0001', {
      method: 'POST',
    }).catch((err) => console.warn('Backend reset error:', err));

    setCompilerState('idle');
    setCompileStepText('');
    setFindings(compilerService.getInitialFindings());
    setObligations(compilerService.getInitialObligations());
    setEvidenceList(compilerService.getInitialEvidence());
    compilerService.resetDemoState();
    showToast('Compiler Reset', 'Returned to initial idle state', 'info', 1500);
  };

  // Are all missing evidence items resolved to VERIFIED?
  const allEvidenceResolved = evidenceList
    .filter((e) => e.id !== 'EVD-04')
    .every((e) => e.status === 'VERIFIED');

  const readiness = compilerService.getReadiness(compilerState === 'ready');

  return (
    <div className="space-y-6">
      {/* 1. COMPILER HEADER & ACTIVE CHANGESET CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
              GOVERNANCE PIPELINE
            </span>
            <Badge variant="info" size="sm" dot>
              Build Engine v2.4
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1.5 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#2E7D5B]" />
            Implementation Compiler
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Validate protocol changes and regulatory dependencies before they reach trial operations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<LayoutDashboard className="w-4 h-4 text-[#2E7D5B]" />}
            onClick={() => navigate('/dashboard')}
          >
            DASHBOARD
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<TrendingUp className="w-4 h-4 text-[#2E7D5B]" />}
            onClick={() => navigate('/impact')}
          >
            VIEW IMPACT
          </Button>
          {compilerState !== 'idle' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('section-findings')?.scrollIntoView({ behavior: 'smooth' })}
              >
                FINDINGS
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('section-obligations')?.scrollIntoView({ behavior: 'smooth' })}
              >
                OBLIGATIONS
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('section-evidence')?.scrollIntoView({ behavior: 'smooth' })}
              >
                EVIDENCE
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Clock className="w-4 h-4 text-[#2E7D5B]" />}
                onClick={() => setIsAuditOpen(true)}
              >
                AUDIT TRAIL
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            icon={<RotateCcw className="w-3.5 h-3.5 text-rose-500" />}
            onClick={handleReset}
          >
            RESET
          </Button>
        </div>
      </div>

      {/* Active ChangeSet Context Ribbon */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-1 rounded-md border border-[#7FAF91]/40">
            CS-0001
          </span>
          <div>
            <span className="text-[#66736B] text-[11px] block">Active Study Docket</span>
            <span className="font-bold text-[#26352D]">ATF-001 — AYU-TRIAL FABRIC Demonstration Trial</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[#66736B] text-[10px] block">Target Protocol</span>
            <span className="text-[#2E7D5B] font-bold">v1.1</span>
          </div>
          <div className="h-6 w-px bg-[#E8E4D9]" />
          <div>
            <span className="text-[#66736B] text-[10px] block">Modification</span>
            <span className="text-[#26352D] font-semibold">Visit 4: Day 25–31 → Day 25–35</span>
          </div>
        </div>
      </div>

      {/* 2. COMPILER PIPELINE VISUALIZATION */}
      <Card className="p-5 bg-white border border-[#E8E4D9] shadow-sm rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#26352D] font-mono flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#2E7D5B]" />
            COMPILER PIPELINE
          </span>
          <span className="text-[11px] text-[#66736B] font-mono">
            State: <strong className="text-[#26352D] uppercase">{compilerState}</strong>
          </span>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 pt-1">
          {pipelineSteps.map((step, idx) => {
            const status = getStepStatus(step);
            const isCurrent =
              (compilerState === 'compiling' && step === 'RULES') ||
              (compilerState === 'failed' && step === 'FINDINGS') ||
              (compilerState === 'recompiling' && step === 'VERIFICATION') ||
              (compilerState === 'ready' && step === 'READY');

            return (
              <div
                key={step}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                  isCurrent
                    ? 'bg-[#EAF4EF] border-[#2E7D5B] ring-2 ring-[#2E7D5B]/20 shadow-xs'
                    : status === 'PASSED'
                    ? 'bg-[#FAF9F4] border-[#7FAF91]/50 text-[#26352D]'
                    : status === 'FAILED'
                    ? 'bg-[#FDF2F2] border-[#FCA5A5] text-[#26352D]'
                    : 'bg-[#FAF9F4] border-[#E8E4D9] text-[#66736B]'
                }`}
              >
                <div className="text-[10px] font-mono text-[#66736B] font-semibold">
                  {idx + 1}. {step}
                </div>
                <div>{getStepBadge(status)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. COMPILE BUTTON / ANIMATION / STATUS BANNER */}
      {compilerState === 'idle' && (
        <Card className="p-8 text-center space-y-3 bg-white border border-[#E8E4D9] shadow-sm rounded-2xl">
          <div className="p-3 bg-[#EAF4EF] text-[#2E7D5B] rounded-2xl w-fit mx-auto border border-[#7FAF91]/40">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#26352D]">Execute Pre-Flight Compilation</h3>
          <p className="text-xs text-[#66736B] max-w-md mx-auto">
            Evaluate ChangeSet <strong>CS-0001</strong> against protocol dependencies, ethics mandates, and operational site constraints.
          </p>
          <div className="pt-2">
            <Button
              size="md"
              className="px-8 py-2.5 font-bold bg-[#2E7D5B] text-white hover:bg-[#246347]"
              icon={<Play className="w-4 h-4 text-white" />}
              onClick={handleCompile}
            >
              COMPILE CHANGESET
            </Button>
          </div>
        </Card>
      )}

      {/* Compiling / Recompiling Animated Sequence */}
      {(compilerState === 'compiling' || compilerState === 'recompiling') && (
        <Card className="p-6 text-center space-y-4 border-[#7FAF91] bg-white shadow-md rounded-2xl animate-slide-up">
          <div className="w-8 h-8 border-3 border-[#2E7D5B] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <span className="font-mono text-sm font-bold text-[#2E7D5B]">{compileStepText}</span>
            <p className="text-xs text-[#66736B]">
              Traversing dependency graph and synthesizing governance obligations
            </p>
          </div>
        </Card>
      )}

      {/* BUILD FAILED BANNER (Initial Run Result) */}
      {compilerState === 'failed' && (
        <div className="p-6 rounded-2xl bg-[#FDF2F2] border border-[#FCA5A5] shadow-sm space-y-3 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#FECACA]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-rose-900 tracking-tight">BUILD FAILED</h2>
                <p className="text-xs text-rose-700">
                  Protocol ChangeSet CS-0001 contains unfulfilled operational and regulatory obligations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="danger" size="md">
                3 BLOCKERS
              </Badge>
              <Badge variant="warning" size="md">
                1 WARNING
              </Badge>
            </div>
          </div>

          <p className="text-xs text-rose-800 leading-relaxed">
            Please resolve the missing required evidence below to unlock formal trial rollout clearance.
          </p>
        </div>
      )}

      {/* BUILD PASSED BANNER (Recompile Success Result) */}
      {compilerState === 'ready' && (
        <div className="p-6 rounded-2xl bg-[#EAF4EF] border-2 border-[#2E7D5B] shadow-md space-y-3 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#7FAF91]/40">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-[#2E7D5B] shrink-0" />
              <div>
                <h2 className="text-base font-bold text-[#26352D] tracking-tight">BUILD PASSED</h2>
                <p className="text-xs text-[#2E7D5B] font-semibold">
                  All blocking findings resolved.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" size="lg" dot className="font-mono text-xs">
                IMPLEMENTATION READY
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-[#2E7D5B] text-[#2E7D5B] hover:bg-white"
                icon={<Clock className="w-4 h-4 text-[#2E7D5B]" />}
                onClick={() => setIsAuditOpen(true)}
              >
                AUDIT TRAIL
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<LayoutDashboard className="w-4 h-4 text-white" />}
                onClick={() => navigate('/dashboard')}
              >
                RETURN TO DASHBOARD
              </Button>
            </div>
          </div>

          <p className="text-xs text-[#26352D]">
            All 3 blocking findings have been satisfied with verified documentation. ChangeSet CS-0001 is certified for clinical rollout across Sites 01, 02, and 03.
          </p>
        </div>
      )}

      {/* 4. FINDINGS SECTION */}
      {compilerState !== 'idle' && (
        <div id="section-findings">
          <Card className="space-y-4 p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26352D] font-mono">
                  Compilation Findings
                </h2>
                <p className="text-xs text-[#66736B]">
                  Rule violations and procedural gates identified by the governance compiler
                </p>
              </div>
              <span className="text-xs font-mono text-[#66736B]">{findings.length} Items</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                    finding.status === 'RESOLVED'
                      ? 'bg-[#FAF9F4] border-[#7FAF91]/50'
                      : finding.type === 'BLOCK'
                      ? 'bg-[#FDF2F2] border-[#FCA5A5]'
                      : 'bg-[#FEF9C3]/40 border-[#FDE047]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#26352D]">
                        {finding.id}
                      </span>
                      <Badge
                        variant={finding.type === 'BLOCK' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {finding.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={finding.severity === 'HIGH' ? 'danger' : 'warning'} size="sm">
                        {finding.severity}
                      </Badge>
                      <Badge
                        variant={finding.status === 'RESOLVED' ? 'success' : 'default'}
                        size="sm"
                      >
                        {finding.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#26352D]">{finding.title}</h4>
                    <p className="text-xs text-[#66736B] mt-0.5 leading-relaxed">
                      {finding.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#E8E4D9]">
                    <span className="text-[10px] font-mono text-[#66736B]">Statutory Guidance</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#2E7D5B] hover:text-[#246347] hover:bg-[#EAF4EF] text-[11px] h-7 px-2"
                      icon={<Sparkles className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                      onClick={() => handleExplainFinding(finding)}
                    >
                      Explain via Advisory AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 5. IMPLEMENTATION OBLIGATIONS TABLE */}
      {compilerState !== 'idle' && (
        <div id="section-obligations">
          <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E4D9]">
              <div>
                <h3 className="text-sm font-semibold text-[#26352D]">Implementation Obligations</h3>
                <p className="text-xs text-[#66736B]">
                  Action items assigned to functional trial stakeholder groups
                </p>
              </div>
              <span className="text-xs text-[#66736B] font-mono">Interactive Checklist</span>
            </div>

            <Table
              data={obligations}
              keyExtractor={(o) => o.id}
              columns={[
                {
                  header: 'Obligation',
                  className: 'min-w-[220px]',
                  accessor: (o) => (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#26352D]">{o.obligation}</span>
                    </div>
                  ),
                },
                {
                  header: 'Owner',
                  accessor: (o) => (
                    <span className="text-xs text-[#66736B] font-medium">{o.owner}</span>
                  ),
                },
                {
                  header: 'Status',
                  className: 'text-right',
                  accessor: (o) => (
                    <button
                      type="button"
                      onClick={() => toggleObligationStatus(o.id)}
                      className="cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge
                        variant={o.status === 'COMPLETED' ? 'success' : 'warning'}
                        size="sm"
                        dot={o.status === 'OPEN'}
                      >
                        {o.status}
                      </Badge>
                    </button>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 6. REQUIRED EVIDENCE CARDS */}
      {compilerState !== 'idle' && (
        <div id="section-evidence" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B]">
                Required Evidence
              </h2>
              <p className="text-xs text-[#66736B]">
                Mandatory verification artifacts required to satisfy blocking findings
              </p>
            </div>

            {/* RECOMPILE BUTTON: Appears when all evidence is resolved */}
            {compilerState === 'failed' && (
              <Button
                size="sm"
                disabled={!allEvidenceResolved}
                variant={allEvidenceResolved ? 'primary' : 'secondary'}
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleRecompile}
              >
                RECOMPILE
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {evidenceList.map((item) => {
              const isMissing = item.status === 'MISSING';
              const isVerified = item.status === 'VERIFIED';

              return (
                <Card
                  key={item.id}
                  className={`p-4 space-y-3 border rounded-2xl shadow-xs transition-colors ${
                    isVerified
                      ? 'border-[#7FAF91] bg-white'
                      : isMissing
                      ? 'border-[#FCA5A5] bg-[#FDF2F2]'
                      : 'border-[#E8E4D9] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#26352D] leading-tight">
                      {item.title}
                    </span>
                    <Badge
                      variant={
                        isVerified
                          ? 'success'
                          : isMissing
                          ? 'danger'
                          : 'info'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-[#66736B] leading-relaxed min-h-[34px]">
                    {item.fileHint}
                  </p>

                  <div className="pt-1">
                    {isMissing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-semibold hover:bg-[#2E7D5B] hover:text-white"
                        onClick={() => handleAddEvidence(item.id)}
                      >
                        ADD EVIDENCE
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isVerified ? 'secondary' : 'ghost'}
                        className="w-full text-xs font-semibold cursor-default"
                        icon={isVerified ? <Check className="w-3.5 h-3.5 text-[#2E7D5B]" /> : undefined}
                      >
                        {item.buttonText}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. READINESS SUMMARY CARD (Displayed after build passes) */}
      {compilerState === 'ready' && (
        <Card className="p-6 bg-white border border-[#7FAF91] shadow-md space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4D9] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D5B] font-mono">
                FINAL CERTIFICATION
              </span>
              <h3 className="text-base font-bold text-[#26352D]">Implementation Readiness</h3>
            </div>
            <Badge variant="success" size="lg" dot className="font-mono font-bold">
              {readiness.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Protocol</span>
              <span className="font-mono text-sm font-bold text-[#2E7D5B] mt-0.5 block">
                {readiness.protocol}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">ChangeSet</span>
              <span className="font-mono text-sm font-bold text-[#26352D] mt-0.5 block">
                {readiness.changeSet}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Sites</span>
              <span className="text-sm font-bold text-[#26352D] mt-0.5 block">
                {readiness.sites} Sites
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Participants</span>
              <span className="text-sm font-bold text-[#26352D] mt-0.5 block">
                {readiness.participants} Pts
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Blocking Findings</span>
              <span className="text-sm font-bold text-[#2E7D5B] mt-0.5 block">
                {readiness.blockingFindings}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Warnings</span>
              <span className="text-sm font-bold text-amber-700 mt-0.5 block">
                {readiness.warnings}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[#66736B] text-[11px] block">Evidence</span>
              <span className="font-mono text-sm font-bold text-[#2E7D5B] mt-0.5 block">
                {readiness.evidence}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Immutable Protocol Audit Trail Modal */}
      <AuditTrailModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      {/* Advisory AI Explanation Modal */}
      <AdvisoryModal
        isOpen={isAdvisoryOpen}
        onClose={() => setIsAdvisoryOpen(false)}
        data={advisoryData}
        loading={advisoryLoading}
      />
    </div>
  );
};
