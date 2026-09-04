import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Eye,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ChangeSetRecord, getStoredChangeSets, saveStoredChangeSet } from '../data/changesets';
import { useToast } from '../hooks/useToast';

export const ChangesetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [changesets, setChangesets] = useState<ChangeSetRecord[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<ChangeSetRecord | null>(null);
  const [viewModalChangeSet, setViewModalChangeSet] = useState<ChangeSetRecord | null>(null);

  // 8-Step Wizard State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Trial
  const [trialId, setTrialId] = useState('ATF-001');
  const [trialName, setTrialName] = useState('Ayurvedic Intervention Trial');

  // Step 2: Change Type
  const [changeType, setChangeType] = useState('Protocol Amendment');

  // Step 3: Previous State
  const [previousState, setPreviousState] = useState('Visit 4: Day 25–31');

  // Step 4: New State
  const [newState, setNewState] = useState('Visit 4: Day 25–35');

  // Step 5: Affected Entities
  const availableEntities = [
    'Sites',
    'Participants',
    'Visit',
    'CRF',
    'EDC',
    'Ethics',
    'Training',
    'Consent',
  ];
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    'Sites',
    'Participants',
    'Visit',
    'CRF',
    'EDC',
    'Ethics',
    'Training',
    'Consent',
  ]);

  // Step 6: Effective Date
  const [effectiveDate, setEffectiveDate] = useState('2026-03-15');

  useEffect(() => {
    const loaded = getStoredChangeSets();
    setChangesets(loaded);

    const fetchLiveChangesets = async () => {
      try {
        const res = await fetch('/api/v1/changesets');
        if (res.ok) {
          const liveList = await res.json();
          if (Array.isArray(liveList) && liveList.length > 0) {
            const mergedMap = new Map<string, ChangeSetRecord>();
            liveList.forEach((cs: ChangeSetRecord) => mergedMap.set(cs.id, cs));
            loaded.forEach((cs) => {
              if (!mergedMap.has(cs.id)) mergedMap.set(cs.id, cs);
            });
            setChangesets(Array.from(mergedMap.values()));
          }
        }
      } catch (err) {
        console.warn('Backend changesets API unreachable, using local storage', err);
      }
    };

    fetchLiveChangesets();
  }, []);

  const toggleEntity = (entity: string) => {
    if (selectedEntities.includes(entity)) {
      setSelectedEntities(selectedEntities.filter((e) => e !== entity));
    } else {
      setSelectedEntities([...selectedEntities, entity]);
    }
  };

  const handleCreateChangeSet = () => {
    const nextNumber = changesets.length + 1;
    const generatedId = `CS-${nextNumber.toString().padStart(4, '0')}`;

    const newCS: ChangeSetRecord = {
      id: generatedId,
      trialId,
      trialName,
      type: changeType,
      previousState,
      newState,
      change: `${previousState.split(':')[0]}: ${previousState.split(':')[1]?.trim() || previousState} → ${newState.split(':')[1]?.trim() || newState}`,
      affectedEntities: selectedEntities,
      effectiveDate,
      status: 'SUBMITTED',
      created: new Date().toISOString().split('T')[0],
    };

    fetch('/api/v1/changesets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCS),
    }).catch((err) => console.warn('Backend create changeset warning:', err));

    const updatedList = saveStoredChangeSet(newCS);
    setChangesets(updatedList);
    setCreatedResult(newCS);
    setIsWizardOpen(false);
    setCurrentStep(1);
    showToast('ChangeSet Generated', `Docket ${generatedId} created and submitted`, 'success');
  };

  const openWizard = () => {
    setCurrentStep(1);
    setCreatedResult(null);
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#2E7D5B]" />
            Protocol ChangeSet Composer & Audit
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Formal amendment version control, entity impact propagation, and regulatory submission trail.
          </p>
        </div>

        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openWizard}>
          New ChangeSet Wizard
        </Button>
      </div>

      {/* AFTER CREATION DISPLAY BANNER */}
      {createdResult && (
        <div className="p-6 rounded-2xl bg-[#EAF4EF] border-2 border-[#2E7D5B] shadow-sm space-y-4 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7FAF91]/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] bg-white px-2.5 py-0.5 rounded-md border border-[#7FAF91]/40">
                  CHANGESET CREATED
                </span>
                <span className="font-mono text-base font-bold text-[#26352D]">{createdResult.id}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#26352D] mt-1">
                {createdResult.trialId} — {createdResult.trialName}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning" size="sm" dot>
                Status: {createdResult.status}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                icon={<TrendingUp className="w-4 h-4 text-[#2E7D5B]" />}
                onClick={() => navigate('/impact')}
              >
                ANALYZE IMPACT
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
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Amendment Classification</span>
              <p className="font-semibold text-[#26352D] mt-0.5">{createdResult.type}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Modification Summary</span>
              <p className="font-mono font-bold text-[#2E7D5B] mt-0.5">{createdResult.change}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E4D9]">
              <span className="text-[#66736B] block text-[11px]">Target Effective Date</span>
              <p className="font-semibold text-[#26352D] mt-0.5">{createdResult.effectiveDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* CHANGESET LIST TABLE */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E4D9]">
          <div>
            <h3 className="text-sm font-semibold text-[#26352D]">Created ChangeSets</h3>
            <p className="text-xs text-[#66736B]">Formal amendment records persisted in system memory</p>
          </div>
          <span className="text-xs font-mono text-[#66736B]">{changesets.length} Records</span>
        </div>

        <Table
          data={changesets}
          keyExtractor={(cs) => cs.id}
          emptyMessage="No ChangeSets created yet. Click 'New ChangeSet Wizard' above to compose CS-0001."
          columns={[
            {
              header: 'ID',
              accessor: (cs) => (
                <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded-md border border-[#7FAF91]/40">
                  {cs.id}
                </span>
              ),
            },
            {
              header: 'Trial',
              accessor: (cs) => (
                <div className="text-xs">
                  <span className="font-semibold text-[#26352D]">{cs.trialId}</span>
                  <p className="text-[11px] text-[#66736B] truncate max-w-[180px]">{cs.trialName}</p>
                </div>
              ),
            },
            {
              header: 'Type',
              accessor: (cs) => (
                <span className="text-xs font-medium text-[#26352D]">{cs.type}</span>
              ),
            },
            {
              header: 'Change',
              className: 'min-w-[220px]',
              accessor: (cs) => (
                <span className="font-mono text-xs font-semibold text-[#2E7D5B]">
                  {cs.change}
                </span>
              ),
            },
            {
              header: 'Status',
              accessor: (cs) => (
                <Badge
                  variant={
                    cs.status === 'APPROVED'
                      ? 'success'
                      : cs.status === 'IN REVIEW' || cs.status === 'SUBMITTED'
                      ? 'warning'
                      : 'default'
                  }
                  size="sm"
                  dot={cs.status === 'IN REVIEW' || cs.status === 'SUBMITTED'}
                >
                  {cs.status}
                </Badge>
              ),
            },
            {
              header: 'Created',
              accessor: (cs) => (
                <span className="text-xs text-[#66736B] font-mono">{cs.created}</span>
              ),
            },
            {
              header: 'Actions',
              className: 'text-right min-w-[220px]',
              accessor: (cs) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Eye className="w-3.5 h-3.5 text-[#66736B]" />}
                    onClick={() => setViewModalChangeSet(cs)}
                  >
                    VIEW
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<TrendingUp className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                    onClick={() => navigate('/impact')}
                  >
                    IMPACT
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Cpu className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                    onClick={() => navigate('/compiler')}
                  >
                    COMPILE
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* VIEW CHANGESET DETAILS MODAL */}
      {viewModalChangeSet && (
        <Modal
          isOpen={Boolean(viewModalChangeSet)}
          onClose={() => setViewModalChangeSet(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#2E7D5B] font-bold">{viewModalChangeSet.id}</span>
              <Badge variant="info">{viewModalChangeSet.type}</Badge>
              <Badge variant="warning" size="sm" dot>
                {viewModalChangeSet.status}
              </Badge>
            </div>
          }
          description={`${viewModalChangeSet.trialId} — ${viewModalChangeSet.trialName}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button size="sm" variant="outline" onClick={() => setViewModalChangeSet(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<TrendingUp className="w-4 h-4 text-[#2E7D5B]" />}
                  onClick={() => navigate('/impact')}
                >
                  ANALYZE IMPACT
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
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <div>
                <span className="text-[#66736B]">Trial Specification</span>
                <p className="font-semibold text-[#26352D] mt-0.5">{viewModalChangeSet.trialId} ({viewModalChangeSet.trialName})</p>
              </div>
              <div>
                <span className="text-[#66736B]">Target Protocol</span>
                <p className="font-mono text-[#2E7D5B] font-bold mt-0.5">{viewModalChangeSet.protocol || 'v1.1'}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Modification Summary</span>
                <p className="font-mono text-[#2E7D5B] font-semibold mt-0.5">{viewModalChangeSet.change}</p>
              </div>
              <div>
                <span className="text-[#66736B]">Status</span>
                <p className="text-amber-800 font-semibold mt-0.5">{viewModalChangeSet.status}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-2">
              <span className="text-[#66736B] font-medium">State Shift Transition</span>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E8E4D9] font-mono text-xs">
                <div>
                  <span className="text-[10px] text-rose-600 block font-bold">PREVIOUS STATE</span>
                  <span className="text-rose-700 line-through font-semibold">{viewModalChangeSet.previousState}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#66736B]" />
                <div>
                  <span className="text-[10px] text-[#2E7D5B] block font-bold">NEW TARGET STATE</span>
                  <span className="text-[#2E7D5B] font-bold">{viewModalChangeSet.newState}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-1.5">
              <span className="text-[#66736B] font-medium">Affected Operational Entities</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {viewModalChangeSet.affectedEntities.map((entity) => (
                  <span
                    key={entity}
                    className="text-[11px] bg-white text-[#2E7D5B] px-2.5 py-0.5 rounded border border-[#7FAF91]/40"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 8-STEP CHANGESET COMPOSER WIZARD MODAL */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2E7D5B]" />
            <span>ChangeSet Composer Wizard (Step {currentStep} of 8)</span>
          </div>
        }
        description="Structured protocol amendment packaging workflow."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-[#66736B] font-mono">
              Step {currentStep} / 8
            </span>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
              )}

              {currentStep < 8 ? (
                <Button
                  size="sm"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleCreateChangeSet}
                >
                  Create ChangeSet
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Wizard Step Progress Tracker */}
          <div className="grid grid-cols-8 gap-1.5 pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === currentStep
                    ? 'bg-[#2E7D5B]'
                    : s < currentStep
                    ? 'bg-[#7FAF91]'
                    : 'bg-[#E8E4D9]'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: SELECT TRIAL */}
          {currentStep === 1 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 1: SELECT TRIAL
              </span>
              <p className="text-xs text-[#66736B]">Choose the active clinical trial docket to amend:</p>
              <div className="p-3.5 rounded-lg bg-white border border-[#7FAF91]/40 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-[#2E7D5B]">{trialId}</span>
                  <p className="text-xs text-[#26352D] font-medium mt-0.5">{trialName}</p>
                </div>
                <Badge variant="success" size="sm">
                  Active RCT
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 2: CHANGE TYPE */}
          {currentStep === 2 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 2: CHANGE TYPE
              </span>
              <p className="text-xs text-[#66736B]">Select regulatory classification of the change:</p>
              <div className="p-3.5 rounded-lg bg-white border border-[#7FAF91]/40 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#26352D]">{changeType}</span>
                  <p className="text-[11px] text-[#66736B] mt-0.5">
                    Modifications to patient visit windows, assessments, or schedules
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  Substantial
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIOUS STATE */}
          {currentStep === 3 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 3: PREVIOUS STATE
              </span>
              <p className="text-xs text-[#66736B]">Current baseline protocol visit rule:</p>
              <div className="p-3.5 rounded-lg bg-white border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase text-rose-600 font-bold block">CURRENT VISIT SCHEDULE</span>
                  <span className="font-mono text-sm font-bold text-rose-700 line-through mt-0.5 block">
                    {previousState}
                  </span>
                </div>
                <Badge variant="danger" size="sm">
                  Retiring
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 4: NEW STATE */}
          {currentStep === 4 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 4: NEW STATE
              </span>
              <p className="text-xs text-[#66736B]">Proposed amendment schedule target:</p>
              <div className="p-3.5 rounded-lg bg-white border border-[#7FAF91]/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase text-[#2E7D5B] font-bold block">AMENDED VISIT SCHEDULE</span>
                  <span className="font-mono text-sm font-bold text-[#2E7D5B] mt-0.5 block">
                    {newState}
                  </span>
                </div>
                <Badge variant="success" size="sm" dot>
                  Proposed
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 5: AFFECTED ENTITIES */}
          {currentStep === 5 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 5: AFFECTED ENTITIES
              </span>
              <p className="text-xs text-[#66736B]">Select downstream systems and operational layers affected:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {availableEntities.map((entity) => {
                  const isChecked = selectedEntities.includes(entity);
                  return (
                    <button
                      key={entity}
                      type="button"
                      onClick={() => toggleEntity(entity)}
                      className={`p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#EAF4EF] border-[#2E7D5B] text-[#2E7D5B] font-medium'
                          : 'bg-white border-[#E8E4D9] text-[#66736B] hover:text-[#26352D]'
                      }`}
                    >
                      <span>{entity}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 text-[#2E7D5B] rounded"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: EFFECTIVE DATE */}
          {currentStep === 6 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 6: EFFECTIVE DATE
              </span>
              <p className="text-xs text-[#66736B]">Set mandatory implementation timeline across sites:</p>
              <div className="p-3.5 rounded-lg bg-white border border-[#E8E4D9] flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[#66736B] block text-[11px]">Proposed Implementation Date</span>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="bg-[#FAF9F4] border border-[#E8E4D9] rounded p-1.5 text-[#26352D] font-mono text-xs focus:ring-1 focus:ring-[#2E7D5B]"
                  />
                </div>
                <Badge variant="info" size="sm">
                  Demo Date
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW */}
          {currentStep === 7 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 7: REVIEW COMPLETE SUMMARY
              </span>
              <p className="text-xs text-[#66736B]">Verify all changeset parameters before docket issuance:</p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-white border border-[#E8E4D9] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#66736B] block text-[11px]">Trial:</span>
                    <span className="font-bold text-[#26352D]">{trialId}</span>
                  </div>
                  <div>
                    <span className="text-[#66736B] block text-[11px]">Change Type:</span>
                    <span className="font-medium text-[#26352D]">{changeType}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E8E4D9] space-y-1">
                  <span className="text-[#66736B] block text-[11px]">Schedule Transition:</span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-rose-600 line-through">{previousState}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#66736B]" />
                    <span className="text-[#2E7D5B]">{newState}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E8E4D9] space-y-1">
                  <span className="text-[#66736B] block text-[11px]">Affected Entities ({selectedEntities.length}):</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedEntities.map((e) => (
                      <span key={e} className="text-[10px] bg-[#EAF4EF] text-[#2E7D5B] px-2 py-0.5 rounded border border-[#7FAF91]/40">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E8E4D9] flex justify-between items-center">
                  <span className="text-[#66736B]">Effective Date:</span>
                  <span className="font-mono text-[#26352D] font-bold">{effectiveDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: CREATE CHANGESET */}
          {currentStep === 8 && (
            <div className="space-y-4 p-5 rounded-xl bg-white border border-[#7FAF91]/50 text-center shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B]">
                STEP 8: CREATE CHANGESET
              </span>
              <h3 className="text-base font-bold text-[#26352D]">Generate Docket CS-0001</h3>
              <p className="text-xs text-[#66736B] max-w-md mx-auto leading-relaxed">
                Click below to register <strong>CS-0001</strong> into the clinical change registry with status <strong>SUBMITTED</strong>.
              </p>

              <div className="p-4 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] max-w-sm mx-auto text-left space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#66736B]">Docket ID:</span>
                  <span className="text-[#2E7D5B] font-bold">CS-0001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66736B]">Change:</span>
                  <span className="text-[#2E7D5B] font-semibold">Day 25–31 → Day 25–35</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66736B]">Status:</span>
                  <span className="text-amber-800 font-semibold">SUBMITTED</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="md"
                  className="px-6 py-2.5 font-bold bg-[#2E7D5B] text-white hover:bg-[#246347]"
                  icon={<Sparkles className="w-4 h-4 text-white" />}
                  onClick={handleCreateChangeSet}
                >
                  Create ChangeSet (Generate CS-0001)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
