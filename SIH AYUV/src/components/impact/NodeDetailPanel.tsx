import React from 'react';
import { ImpactNode } from '../../types/impactGraph';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { CheckCircle2, GitPullRequest, Sparkles, X } from 'lucide-react';

interface NodeDetailPanelProps {
  node: ImpactNode | null;
  onClose?: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  if (!node) {
    return (
      <Card className="p-5 text-center text-xs text-[#66736B] border-dashed border-[#E8E4D9] bg-white">
        <Sparkles className="w-6 h-6 text-[#2E7D5B] mx-auto mb-2 opacity-70" />
        <p className="font-semibold text-[#26352D]">Click any node in the Visual Impact Graph</p>
        <p className="text-[11px] text-[#66736B] mt-1">
          Inspect affected entity details, clinical reasoning, severity classification, and relationship to CS-0001.
        </p>
      </Card>
    );
  }

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <Card className="p-5 space-y-4 border-[#7FAF91]/50 bg-white shadow-md animate-slide-up relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#66736B] hover:text-[#26352D] p-1 rounded-md transition-colors"
          title="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="border-b border-[#E8E4D9] pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D5B] font-mono block">
          AFFECTED NODE INSPECTOR
        </span>
        <div className="flex items-center gap-2 mt-1">
          <h3 className="text-base font-bold text-[#26352D]">{node.entity}</h3>
          <Badge variant={getSeverityBadgeVariant(node.severity)} size="sm">
            {node.severity}
          </Badge>
        </div>
      </div>

      {/* Main Parameters */}
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
          <span className="text-[#66736B] font-medium block text-[11px]">Entity:</span>
          <p className="font-bold text-[#26352D] mt-0.5 text-sm">{node.entity}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
          <span className="text-[#66736B] font-medium block text-[11px]">Reason:</span>
          <p className="text-[#26352D] mt-0.5 leading-relaxed font-medium">{node.reason}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[#66736B] font-medium block text-[11px]">Severity:</span>
            <div className="mt-1">
              <Badge variant={getSeverityBadgeVariant(node.severity)} size="sm">
                {node.severity}
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
            <span className="text-[#66736B] font-medium block text-[11px]">Related ChangeSet:</span>
            <span className="font-mono text-xs font-bold text-[#2E7D5B] mt-1 inline-block">
              {node.relatedChangeSet}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
          <span className="text-[#66736B] font-medium block text-[11px]">Dependency Relationship:</span>
          <div className="flex items-center gap-1.5 text-[#26352D] mt-1 font-mono text-[11px]">
            <GitPullRequest className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>{node.relationship}</span>
          </div>
        </div>
      </div>

      {/* Operational directive note */}
      <div className="p-2.5 rounded-xl bg-[#EAF4EF] border border-[#7FAF91]/40 text-[#2E7D5B] text-[11px] flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D5B] mt-0.5" />
        <span className="font-medium">Validated dependency propagation verified across AYU-TRIAL FABRIC schema.</span>
      </div>
    </Card>
  );
};
