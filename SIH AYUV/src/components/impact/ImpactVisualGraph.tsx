import React, { useState } from 'react';
import { ImpactNode, NodeCategory } from '../../types/impactGraph';
import { CS_0001_NODES } from '../../data/mockImpactGraph';
import {
  GitPullRequest,
  Building2,
  Users,
  Calendar,
  FileText,
  Database,
  Award,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
} from 'lucide-react';

interface ImpactVisualGraphProps {
  selectedNodeId: string | null;
  onSelectNode: (node: ImpactNode) => void;
  nodes?: ImpactNode[];
}

export const ImpactVisualGraph: React.FC<ImpactVisualGraphProps> = ({
  selectedNodeId,
  onSelectNode,
  nodes,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const graphNodes = nodes && nodes.length > 0 ? nodes : CS_0001_NODES;
  const rootNode = graphNodes.find((n) => n.id === 'node-root') || graphNodes[0];
  const sitesNode = graphNodes.find((n) => n.id === 'node-sites') || graphNodes[0];
  const siteChildren = graphNodes.filter((n) => n.parentId === 'node-sites');
  const participantsNode = graphNodes.find((n) => n.id === 'node-participants') || graphNodes[0];
  const participantChildren = graphNodes.filter((n) => n.parentId === 'node-participants');

  const directBranches = graphNodes.filter(
    (n) => n.parentId === 'node-root' && n.id !== 'node-sites' && n.id !== 'node-participants'
  );

  const getNodeIcon = (category: NodeCategory) => {
    switch (category) {
      case 'Root':
        return <GitPullRequest className="w-4 h-4 text-[#2E7D5B]" />;
      case 'Sites':
        return <Building2 className="w-4 h-4 text-emerald-700" />;
      case 'Participants':
        return <Users className="w-4 h-4 text-teal-700" />;
      case 'Protocol':
        return <Calendar className="w-4 h-4 text-amber-700" />;
      case 'Systems':
        return <Database className="w-4 h-4 text-blue-700" />;
      case 'Governance':
        return <Award className="w-4 h-4 text-[#2E7D5B]" />;
      default:
        return <FileText className="w-4 h-4 text-[#66736B]" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
      case 'CRITICAL':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">MED</span>;
      case 'LOW':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">LOW</span>;
      default:
        return null;
    }
  };

  const renderNodeButton = (node: ImpactNode, className: string = '') => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === 'node-root';

    return (
      <button
        key={node.id}
        type="button"
        onClick={() => onSelectNode(node)}
        className={`group text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
          isSelected
            ? 'ring-2 ring-[#2E7D5B] bg-[#EAF4EF] border-[#2E7D5B] shadow-md'
            : isRoot
            ? 'bg-gradient-to-r from-[#EAF4EF] to-white border-[#7FAF91] hover:border-[#2E7D5B] shadow-sm'
            : 'bg-white border-[#E8E4D9] hover:bg-[#FAF9F4] hover:border-[#7FAF91] shadow-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#FAF9F4] border border-[#E8E4D9] shrink-0 group-hover:border-[#7FAF91] transition-colors">
            {getNodeIcon(node.category)}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-[#26352D] block truncate">{node.label}</span>
            <span className="text-[10px] text-[#66736B] truncate block">{node.entity}</span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {getSeverityBadge(node.severity)}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Visual Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#E8E4D9] text-xs shadow-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#66736B] mr-1" />
          {['All', 'Operational', 'Protocol', 'Systems', 'Governance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#7FAF91]/50'
                  : 'text-[#66736B] hover:text-[#26352D] hover:bg-[#FAF9F4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Zoom Scale */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
            className="p-1.5 rounded-lg bg-[#FAF9F4] text-[#66736B] hover:text-[#26352D] hover:bg-[#F5F1E8] border border-[#E8E4D9] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#26352D] font-medium w-10 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
            className="p-1.5 rounded-lg bg-[#FAF9F4] text-[#66736B] hover:text-[#26352D] hover:bg-[#F5F1E8] border border-[#E8E4D9] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1.5 rounded-lg bg-[#FAF9F4] text-[#66736B] hover:text-[#26352D] hover:bg-[#F5F1E8] border border-[#E8E4D9] transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Canvas Container */}
      <div className="relative overflow-x-auto p-6 rounded-2xl bg-[#FAF9F4] border border-[#E8E4D9] shadow-xs min-h-[460px]">
        <div
          className="transition-transform duration-200 origin-top-left"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Tree Structure */}
          <div className="relative pl-6 space-y-8 max-w-4xl">
            {/* Root Node: CS-0001 */}
            <div className="relative inline-block w-80">
              {renderNodeButton(rootNode, 'border-[#2E7D5B] ring-2 ring-[#2E7D5B]/20')}
            </div>

            {/* Vertical trunk line from Root */}
            <div className="relative pl-10 border-l-2 border-[#7FAF91]/60 space-y-6 ml-6">
              {/* Branch 1: Sites (with Sub-branches) */}
              {(categoryFilter === 'All' || categoryFilter === 'Operational') && (
                <div className="space-y-3 relative">
                  {/* Branch Horizontal Connector */}
                  <div className="absolute -left-10 top-5 w-10 h-0.5 bg-[#7FAF91]/60" />

                  <div className="w-72">
                    {renderNodeButton(sitesNode)}
                  </div>

                  {/* Sites Sub-Branch Container */}
                  <div className="relative pl-8 border-l-2 border-[#D8D2C5] space-y-2.5 ml-6">
                    {siteChildren.map((siteNode) => (
                      <div key={siteNode.id} className="relative w-64">
                        <div className="absolute -left-8 top-5 w-8 h-0.5 bg-[#D8D2C5]" />
                        {renderNodeButton(siteNode)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Branch 2: Participants (with Sub-branch) */}
              {(categoryFilter === 'All' || categoryFilter === 'Operational') && (
                <div className="space-y-3 relative">
                  <div className="absolute -left-10 top-5 w-10 h-0.5 bg-[#7FAF91]/60" />

                  <div className="w-72">
                    {renderNodeButton(participantsNode)}
                  </div>

                  <div className="relative pl-8 border-l-2 border-[#D8D2C5] space-y-2.5 ml-6">
                    {participantChildren.map((ptNode) => (
                      <div key={ptNode.id} className="relative w-64">
                        <div className="absolute -left-8 top-5 w-8 h-0.5 bg-[#D8D2C5]" />
                        {renderNodeButton(ptNode)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining Direct Branches: Visit 4, CRF, EDC, Ethics, Training, Consent */}
              {directBranches.map((branchNode) => {
                const matchCategory =
                  categoryFilter === 'All' ||
                  (categoryFilter === 'Protocol' && branchNode.category === 'Protocol') ||
                  (categoryFilter === 'Systems' && branchNode.category === 'Systems') ||
                  (categoryFilter === 'Governance' && branchNode.category === 'Governance');

                if (!matchCategory) return null;

                return (
                  <div key={branchNode.id} className="relative w-72">
                    {/* Horizontal Connector */}
                    <div className="absolute -left-10 top-5 w-10 h-0.5 bg-[#7FAF91]/60" />
                    {renderNodeButton(branchNode)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
