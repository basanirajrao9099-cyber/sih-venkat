import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Building2,
  Users,
  Calendar,
  FileText,
  Database,
  Award,
  BookOpen,
  FileCheck,
  Play,
  GitPullRequest,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ImpactVisualGraph } from '../components/impact/ImpactVisualGraph';
import { NodeDetailPanel } from '../components/impact/NodeDetailPanel';
import { CS_0001_NODES, CS_0001_SUMMARY } from '../data/mockImpactGraph';
import { ImpactNode } from '../types/impactGraph';
import { getStoredChangeSets } from '../data/changesets';
import { useToast } from '../hooks/useToast';

export const ImpactPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [availableChangeSets, setAvailableChangeSets] = useState<{ id: string; label: string }[]>([
    { id: 'CS-0001', label: 'CS-0001 — Protocol Amendment (Visit 4 Day 25–35)' },
  ]);
  const [selectedChangeSetId, setSelectedChangeSetId] = useState<string>('CS-0001');

  const [analyzingState, setAnalyzingState] = useState<
    'idle' | 'reading' | 'dependencies' | 'entities' | 'complete'
  >('complete');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [impactSummary, setImpactSummary] = useState(CS_0001_SUMMARY);
  const [impactNodes, setImpactNodes] = useState<ImpactNode[]>(CS_0001_NODES);

  const defaultVisitNode = CS_0001_NODES.find((n) => n.id === 'node-visit-4') || CS_0001_NODES[0];
  const [selectedNode, setSelectedNode] = useState<ImpactNode | null>(defaultVisitNode);

  const fetchImpactReport = async (csId: string) => {
    try {
      const res = await fetch(`/api/v1/changesets/${csId}/impact`);
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setImpactSummary(data.summary);
        }
        if (data.nodes && data.nodes.length > 0) {
          setImpactNodes(data.nodes);
          const v4Node = data.nodes.find((n: ImpactNode) => n.id === 'node-visit-4') || data.nodes[0];
          setSelectedNode(v4Node);
        }
      }
    } catch (err) {
      console.warn('Backend impact API unreachable, using local fallback', err);
    }
  };

  useEffect(() => {
    const stored = getStoredChangeSets();
    if (stored.length > 0) {
      const items = stored.map((cs) => ({
        id: cs.id,
        label: `${cs.id} — ${cs.type} (${cs.change})`,
      }));
      setAvailableChangeSets(items);
    }
    fetchImpactReport(selectedChangeSetId);
  }, [selectedChangeSetId]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalyzingState('reading');
    showToast('Impact Engine Initiated', `Reading ChangeSet ${selectedChangeSetId}...`, 'info', 1000);

    await fetchImpactReport(selectedChangeSetId);

    setTimeout(() => {
      setAnalyzingState('dependencies');
      setTimeout(() => {
        setAnalyzingState('entities');
        setTimeout(() => {
          setAnalyzingState('complete');
          setIsAnalyzing(false);
          showToast('Analysis Complete', `Impact graph resolved for ${selectedChangeSetId}`, 'success', 3000);
        }, 400);
      }, 400);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
              OPERATIONAL IMPACT
            </span>
            <span className="text-xs text-[#66736B] font-mono">CS-0001 Analysis</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2E7D5B]" />
            ChangeSet Impact Analysis & Dependency Engine
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Automated impact resolution tracing schedule amendments across sites, subject cohorts, CRF schemas, and ethics clearance.
          </p>
        </div>

        {/* ChangeSet Selector & Action Trigger */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-[#E8E4D9] p-2 rounded-2xl shadow-xs">
          <select
            value={selectedChangeSetId}
            onChange={(e) => setSelectedChangeSetId(e.target.value)}
            className="bg-[#FAF9F4] border border-[#E8E4D9] rounded-lg px-3 py-1.5 text-xs text-[#26352D] font-mono focus:ring-1 focus:ring-[#2E7D5B] cursor-pointer outline-hidden"
          >
            {availableChangeSets.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            isLoading={isAnalyzing}
            icon={<Play className="w-4 h-4 text-white" />}
            onClick={runAnalysis}
          >
            ANALYZE IMPACT
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Cpu className="w-4 h-4 text-[#2E7D5B]" />}
            onClick={() => navigate('/compiler')}
          >
            COMPILE CHANGESET
          </Button>
        </div>
      </div>

      {/* Loading Sequence Feedback Display */}
      {isAnalyzing && (
        <Card className="p-5 border-[#7FAF91] bg-white shadow-md rounded-2xl animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#2E7D5B] border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-[#2E7D5B]">
                {analyzingState === 'reading' && 'Reading ChangeSet...'}
                {analyzingState === 'dependencies' && 'Resolving dependencies...'}
                {analyzingState === 'entities' && 'Finding affected entities...'}
              </span>
              <p className="text-[11px] text-[#66736B]">
                Traversing clinical trial data schema and calculating blast radius
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* IMPACT ANALYSIS COMPLETE BANNER */}
      {!isAnalyzing && analyzingState === 'complete' && (
        <div className="p-4 rounded-2xl bg-[#EAF4EF] border border-[#7FAF91]/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold text-[#2E7D5B] uppercase tracking-wider">
                IMPACT ANALYSIS COMPLETE
              </span>
              <p className="text-xs text-[#26352D] mt-0.5">
                Evaluated docket <strong>{selectedChangeSetId}</strong>: 8 operational entity domains mapped with dependency linkages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="success" size="sm" dot>
              Engine Synced
            </Badge>
            <Button
              size="sm"
              icon={<Cpu className="w-4 h-4 text-white" />}
              onClick={() => navigate('/compiler')}
            >
              COMPILE CHANGESET
            </Button>
          </div>
        </div>
      )}

      {/* IMPACT SUMMARY */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B]">
          IMPACT SUMMARY
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-mono text-[#66736B]">Sites</span>
            </div>
            <div className="text-lg font-bold text-[#26352D]">{impactSummary.sitesCount} Sites</div>
            <p className="text-[10px] text-[#66736B] font-medium">Affected</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-teal-700" />
              <span className="text-[10px] font-mono text-[#66736B]">Subjects</span>
            </div>
            <div className="text-lg font-bold text-[#26352D]">{impactSummary.participantsCount} Pts</div>
            <p className="text-[10px] text-[#66736B] font-medium">Affected</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span className="text-[10px] font-mono text-[#66736B]">Visits</span>
            </div>
            <div className="text-lg font-bold text-[#26352D]">{impactSummary.visitsCount} Visit</div>
            <p className="text-[10px] text-[#66736B] font-medium">Affected (V4)</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <FileText className="w-4 h-4 text-amber-800" />
              <span className="text-[10px] font-mono text-[#66736B]">CRF</span>
            </div>
            <div className="text-lg font-bold text-[#26352D]">{impactSummary.crfsCount} CRF</div>
            <p className="text-[10px] text-[#66736B] font-medium">Affected</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <Database className="w-4 h-4 text-blue-700" />
              <span className="text-[10px] font-mono text-[#66736B]">EDC</span>
            </div>
            <div className="text-lg font-bold text-[#26352D]">{impactSummary.edcMappingsCount} EDC</div>
            <p className="text-[10px] text-[#66736B] font-medium">Mapping Affected</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <Award className="w-4 h-4 text-purple-700" />
              <span className="text-[10px] font-mono text-[#66736B]">IEC</span>
            </div>
            <div className="text-sm font-bold text-[#26352D] pt-1">Ethics</div>
            <p className="text-[10px] text-[#66736B] font-medium">{impactSummary.ethicsAffected ? 'Affected' : 'Cleared'}</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <BookOpen className="w-4 h-4 text-[#2E7D5B]" />
              <span className="text-[10px] font-mono text-[#66736B]">SOP</span>
            </div>
            <div className="text-sm font-bold text-[#26352D] pt-1">Training</div>
            <p className="text-[10px] text-[#66736B] font-medium">{impactSummary.trainingAffected ? 'Affected' : 'Cleared'}</p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8E4D9] space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <span className="text-[10px] font-mono text-[#66736B]">ICF</span>
            </div>
            <div className="text-sm font-bold text-[#26352D] pt-1">Consent</div>
            <p className="text-[10px] text-[#66736B] font-medium">{impactSummary.consentAffected ? 'Affected' : 'Cleared'}</p>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: VISUAL IMPACT GRAPH + NODE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Visual Dependency Graph */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B] flex items-center gap-1.5">
              <GitPullRequest className="w-4 h-4 text-[#2E7D5B]" />
              VISUAL IMPACT GRAPH
            </h2>
            <span className="text-[11px] text-[#66736B]">Click any node to view clinical details</span>
          </div>

          <ImpactVisualGraph
            nodes={impactNodes}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Right 1 Col: Node Details Panel */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#66736B] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2E7D5B]" />
            NODE DETAILS
          </h2>

          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  );
};
