import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditTimelineEvent {
  step: string;
  title: string;
  timestamp: string;
  actor: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'READY' | 'SUBMITTED' | 'WARNING';
  icon: React.ReactNode;
}

const AUDIT_EVENTS: AuditTimelineEvent[] = [
  {
    step: 'STEP 1',
    title: 'ChangeSet Created',
    timestamp: 'Today, 10:14:02 IST',
    actor: 'Dr. V. Sharma (Lead PI)',
    description:
      'ChangeSet CS-0001 drafted for Trial ATF-001 targeting Protocol v1.1 (Visit 4 Day 25–31 → Day 25–35 flex window).',
    status: 'SUBMITTED',
    icon: <FileText className="w-4 h-4 text-[#2E7D5B]" />,
  },
  {
    step: 'STEP 2',
    title: 'Impact Analysis Completed',
    timestamp: 'Today, 10:14:28 IST',
    actor: 'Automated Dependency Engine v2.4',
    description:
      'Traversed trial data schema and resolved blast radius: 3 Sites, 47 Participants, 1 Visit Window, 1 CRF, 1 EDC Mapping, Ethics, Training, and Consent.',
    status: 'PASSED',
    icon: <TrendingUp className="w-4 h-4 text-[#2E7D5B]" />,
  },
  {
    step: 'STEP 3',
    title: 'Compilation Failed',
    timestamp: 'Today, 10:15:05 IST',
    actor: 'Fabric Governance Compiler',
    description:
      'Pre-flight gate check triggered BUILD FAILED due to unfulfilled procedural and regulatory prerequisites.',
    status: 'FAILED',
    icon: <AlertCircle className="w-4 h-4 text-[#B91C1C]" />,
  },
  {
    step: 'STEP 4',
    title: 'Findings Generated',
    timestamp: 'Today, 10:15:06 IST',
    actor: 'Rules Synthesizer',
    description:
      'Formally logged 3 Blocking Findings (F-001: IEC Notification, F-002: Consent Addendum, F-003: Site Training) and 1 Warning (F-004: EDC Mapping).',
    status: 'WARNING',
    icon: <Layers className="w-4 h-4 text-[#C9A227]" />,
  },
  {
    step: 'STEP 5',
    title: 'Evidence Added',
    timestamp: 'Today, 10:16:42 IST',
    actor: 'Clinical Operations & Regulatory QA',
    description:
      'Uploaded verified regulatory dossier acknowledgement, Patient Information Sheet addendum, and CRC training sign-offs. Verified 4 / 4 evidence artifacts.',
    status: 'PASSED',
    icon: <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />,
  },
  {
    step: 'STEP 6',
    title: 'Compilation Passed',
    timestamp: 'Today, 10:17:15 IST',
    actor: 'Fabric Governance Compiler',
    description:
      'Re-evaluated all 9 governance pipeline checkpoints. Zero blocking findings detected. All rule constraints satisfied.',
    status: 'PASSED',
    icon: <Cpu className="w-4 h-4 text-[#2E7D5B]" />,
  },
  {
    step: 'STEP 7',
    title: 'Implementation Ready',
    timestamp: 'Today, 10:17:18 IST',
    actor: 'Trial Governance Board',
    description:
      'ChangeSet CS-0001 certified for immediate, synchronized operational rollout across Sites 01, 02, and 03.',
    status: 'READY',
    icon: <Sparkles className="w-4 h-4 text-[#2E7D5B]" />,
  },
];

const getStepIcon = (title: string, status: string) => {
  if (title.includes('ChangeSet')) return <FileText className="w-4 h-4 text-[#2E7D5B]" />;
  if (title.includes('Impact')) return <TrendingUp className="w-4 h-4 text-[#2E7D5B]" />;
  if (title.includes('Failed') || status === 'FAILED') return <AlertCircle className="w-4 h-4 text-[#B91C1C]" />;
  if (title.includes('Findings') || status === 'WARNING') return <Layers className="w-4 h-4 text-[#C9A227]" />;
  if (title.includes('Evidence')) return <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />;
  if (title.includes('Ready') || status === 'READY') return <Sparkles className="w-4 h-4 text-[#2E7D5B]" />;
  return <Cpu className="w-4 h-4 text-[#2E7D5B]" />;
};

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = React.useState<AuditTimelineEvent[]>(AUDIT_EVENTS);
  const [auditHash, setAuditHash] = React.useState<string>('0x9F4C2A7B...8E3D');
  const [isValid, setIsValid] = React.useState<boolean>(true);
  const [totalLogged, setTotalLogged] = React.useState<number>(AUDIT_EVENTS.length);

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchLiveAudit = async () => {
      try {
        const [trailRes, verifyRes] = await Promise.all([
          fetch('/api/v1/audit/trail?changeSetId=CS-0001'),
          fetch('/api/v1/audit/verify?changeSetId=CS-0001'),
        ]);

        if (trailRes.ok) {
          const data = await trailRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setEvents(
              data.map((d: any) => ({
                step: d.step,
                title: d.title,
                timestamp: d.timestamp,
                actor: d.who || d.actor,
                description: d.why || d.description,
                status: d.outcome || d.status,
                icon: getStepIcon(d.title, d.outcome || d.status),
              }))
            );
            setTotalLogged(data.length);
          }
        }

        if (verifyRes.ok) {
          const vData = await verifyRes.json();
          setIsValid(Boolean(vData.chainValid && !vData.tamperDetected));
          if (vData.headHash) {
            const h = vData.headHash;
            setAuditHash(h.length > 20 ? `${h.slice(0, 12)}...${h.slice(-4)}` : h);
          }
        }
      } catch (err) {
        console.warn('Live audit trail API unreachable, using local state', err);
      }
    };

    fetchLiveAudit();
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#EAF4EF] text-[#2E7D5B] border border-[#A7D7C1] shadow-sm">
            <Clock className="w-5 h-5 text-[#2E7D5B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#26352D]">Immutable Protocol Audit Trail</span>
              <Badge variant={isValid ? 'success' : 'danger'} size="sm" dot>
                {isValid ? 'Merkle Chain Verified' : 'Tamper Detected'}
              </Badge>
            </div>
            <p className="text-xs text-[#66736B] font-normal mt-0.5">
              Cryptographic chronological timeline of ChangeSet CS-0001
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <span className="font-mono text-[#66736B] font-bold">
            Root Audit Hash: <strong className="text-[#2E7D5B]">{auditHash}</strong>
          </span>
          <Button size="sm" onClick={onClose}>
            Close Audit Trail
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1 text-xs">
        <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E8E4D9] flex flex-wrap items-center justify-between gap-3 font-mono">
          <div>
            <span className="text-[#66736B] block text-[10px] font-bold">DOCKET</span>
            <span className="text-[#2E7D5B] font-extrabold">CS-0001 (ATF-001)</span>
          </div>
          <div>
            <span className="text-[#66736B] block text-[10px] font-bold">LINEAGE</span>
            <span className="text-[#26352D] font-bold">Protocol v1.0 → v1.1</span>
          </div>
          <div>
            <span className="text-[#66736B] block text-[10px] font-bold">RECORD INTEGRITY</span>
            <span className="text-[#2E7D5B] font-bold">{totalLogged} / {totalLogged} Milestones Logged</span>
          </div>
        </div>

        {/* Chronological Timeline */}
        <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E4D9]">
          {events.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white shadow-xs ${
                  evt.status === 'READY' || evt.status === 'PASSED'
                    ? 'border-[#2E7D5B] text-[#2E7D5B]'
                    : evt.status === 'FAILED'
                    ? 'border-[#B91C1C] text-[#B91C1C]'
                    : evt.status === 'WARNING'
                    ? 'border-[#C9A227] text-[#C9A227]'
                    : 'border-[#2E7D5B] text-[#2E7D5B]'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              {/* Event Content Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] hover:border-[#7FAF91] shadow-2xs hover:shadow-sm transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded-md border border-[#A7D7C1]">
                      {evt.step}
                    </span>
                    <h4 className="text-xs font-bold text-[#26352D] flex items-center gap-1.5">
                      {evt.icon}
                      {evt.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        evt.status === 'READY' || evt.status === 'PASSED'
                          ? 'success'
                          : evt.status === 'FAILED'
                          ? 'danger'
                          : evt.status === 'WARNING'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {evt.status}
                    </Badge>
                    <span className="font-mono text-[11px] text-[#66736B] font-semibold">{evt.timestamp}</span>
                  </div>
                </div>

                <p className="text-[#5E6E64] text-xs leading-relaxed font-medium">{evt.description}</p>

                <div className="pt-1 text-[11px] text-[#66736B] font-mono border-t border-[#F5F1E8]">
                  Recorded by: <span className="text-[#26352D] font-bold">{evt.actor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
