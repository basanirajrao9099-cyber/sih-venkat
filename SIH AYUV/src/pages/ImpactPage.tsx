import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  Users,
  Calendar,
  FileCheck,
  ShieldCheck,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getStoredChangeSets, ChangeSetRecord } from '../data/changesets';
import { useToast } from '../hooks/useToast';
import { useTrial } from '../hooks/useTrialContext';
import { apiFetch } from '../services/api';

export const ImpactPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedTrial } = useTrial();

  const [availableChangeSets, setAvailableChangeSets] = useState<ChangeSetRecord[]>([]);
  const [selectedCsId, setSelectedCsId] = useState<string>('CS-0001');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable sections state (progressive disclosure)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    sites: false,
    participants: false,
    visits: true, // Default open for primary visit change
    crfs: false,
    consent: false,
    training: false,
    ethics: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [impactData, setImpactData] = useState<any>(null);
  const [affectedSitesList, setAffectedSitesList] = useState<any[]>([]);

  const fetchImpact = async (csId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(`/api/v1/changesets/${csId}/impact`, undefined, null);
      if (data) {
        setImpactData(data);
        if (Array.isArray(data.affectedSites)) {
          setAffectedSitesList(data.affectedSites);
        }
      }
    } catch (err) {
      console.warn('Impact fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loaded = getStoredChangeSets();
    if (loaded.length > 0) {
      setAvailableChangeSets(loaded);
      const matching = loaded.find(
        (c) => c.trialId === selectedTrial.protocolId || c.trialId === selectedTrial.id
      ) || (selectedTrial.protocolId.includes('088') ? loaded.find((c) => c.id === 'CS-0002') : null)
        || (selectedTrial.protocolId.includes('105') ? loaded.find((c) => c.id === 'CS-0003') : null)
        || (selectedTrial.protocolId.includes('121') ? loaded.find((c) => c.id === 'CS-0004') : null)
        || (selectedTrial.protocolId.includes('149') ? loaded.find((c) => c.id === 'CS-0005') : null)
        || loaded[0];

      if (matching) setSelectedCsId(matching.id);
    }
  }, [selectedTrial.id, selectedTrial.protocolId]);

  useEffect(() => {
    if (selectedCsId) {
      fetchImpact(selectedCsId);
    }
  }, [selectedCsId]);

  const selectedCs = availableChangeSets.find((c) => c.id === selectedCsId) || {
    id: 'CS-0001',
    type: 'Visit schedule',
    previousState: 'Visit 4: Day 25–31',
    newState: 'Visit 4: Day 25–35',
    change: 'Day 25–31 → Day 25–35',
  };

  // 47 safe pseudonymous participant IDs
  const site1Participants = Array.from({ length: 18 }, (_, i) => `P-${(i + 1).toString().padStart(3, '0')}`);
  const site2Participants = Array.from({ length: 15 }, (_, i) => `P-${(i + 19).toString().padStart(3, '0')}`);
  const site3Participants = Array.from({ length: 14 }, (_, i) => `P-${(i + 34).toString().padStart(3, '0')}`);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* 1. HEADER & AMENDMENT SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
              {selectedCs.id}
            </span>
            <span className="text-xs text-[#5C6B62] font-medium">• Protocol v1.1</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
            Operational Impact Analysis
          </h1>
          <p className="text-xs text-[#5C6B62] mt-0.5">
            Automatic dependency analysis across clinical trial operations, participants, CRFs, and ethics mandates.
          </p>
        </div>

        {/* ChangeSet Dropdown */}
        {availableChangeSets.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-[#5C6B62]">Docket:</label>
            <select
              value={selectedCsId}
              onChange={(e) => setSelectedCsId(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg p-2 text-xs font-semibold text-[#1E2922] focus:outline-none focus:bg-white focus:border-[#1E4D38]"
            >
              {availableChangeSets.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.id} — {cs.type} ({cs.change})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <section className="bg-white border border-[#E2DFD6] rounded-xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-[#1E4D38] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#1E2922]">Resolving operational dependencies...</p>
          <p className="text-xs text-[#5C6B62]">Traversing clinical data schema across sites, participants, and CRFs.</p>
        </section>
      )}

      {/* 3. ERROR & RETRY STATE */}
      {error && !loading && (
        <section className="bg-white border border-rose-200 rounded-xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Unable to calculate impact</p>
              <p className="text-[#5C6B62]">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchImpact(selectedCsId)}
            className="px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] cursor-pointer"
          >
            Retry
          </button>
        </section>
      )}

      {/* 4. SUMMARY STRIP */}
      {!loading && !error && (
        <>
          <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4 mb-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
                  Blast Radius Scope
                </span>
                <p className="text-sm font-bold text-[#1E2922]">
                  {selectedCs.type === 'Visit schedule' ? 'Visit 4 Schedule Window Modification' : `${selectedCs.type} Amendment`}
                </p>
              </div>

              <button
                onClick={() => navigate('/changesets')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38] hover:underline cursor-pointer"
              >
                <span>Return to amendment workflow →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Sites</span>
                <span className="font-bold text-[#1E2922] text-sm">3 Sites</span>
              </div>
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Cohort</span>
                <span className="font-bold text-[#1E2922] text-sm">47 Participants</span>
              </div>
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Visits</span>
                <span className="font-bold text-[#1E2922] text-sm">1 Visit (V4)</span>
              </div>
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Case Forms</span>
                <span className="font-bold text-[#1E2922] text-sm">1 CRF</span>
              </div>
            </div>
          </section>

          {/* 5. SEVEN EXPANDABLE PROGRESSIVE DISCLOSURE SECTIONS */}
          <div className="space-y-4">
            {/* SECTION 1: AFFECTED SITES */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('sites')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      Affected Research Sites ({affectedSitesList.length > 0 ? affectedSitesList.length : 3} of 15 Participating Centers)
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> Only these investigational centers have active patient cohorts impacted by this amendment and require mandatory protocol retraining.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.sites ? 'Hide sites' : 'View affected sites'}</span>
                  {expandedSections.sites ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.sites && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2.5 text-xs animate-fade-in">
                  {affectedSitesList.length > 0 ? (
                    affectedSitesList.map((s, idx) => (
                      <div
                        key={s.id || s.siteId}
                        className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                              {s.siteId}
                            </span>
                            <span className="text-xs font-bold text-[#1E2922]">{s.name}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8B6B18] bg-[#FEF6E9] px-1.5 py-0.5 rounded border border-[#E8C28A]/50 font-mono">
                              {s.impactStatus || 'AFFECTED'}
                            </span>
                          </div>
                          <p className="text-[#5C6B62] text-[11px] flex items-center gap-1.5">
                            <span>{s.location}</span>
                            <span>•</span>
                            <span>PI: {s.investigator || 'Not available'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-[#5C6B62] block">Staff Retraining</span>
                            <span
                              className={`text-[11px] font-semibold ${
                                s.trainingStatus === 'VERIFIED'
                                  ? 'text-[#1E4D38]'
                                  : s.trainingStatus === 'COMPLETED'
                                  ? 'text-[#D97706]'
                                  : s.trainingStatus === 'CHANGES_REQUESTED' || s.trainingStatus === 'REJECTED'
                                  ? 'text-rose-700'
                                  : 'text-[#5C6B62]'
                              }`}
                            >
                              {s.trainingStatus === 'VERIFIED'
                                ? 'VERIFIED'
                                : s.trainingStatus === 'COMPLETED'
                                ? 'COMPLETED'
                                : s.trainingStatus === 'CHANGES_REQUESTED' || s.trainingStatus === 'REJECTED'
                                ? 'CHANGES REQUESTED'
                                : 'REQUIRED'}
                            </span>
                          </div>

                          <button
                            onClick={() => navigate('/sites')}
                            className="px-2.5 py-1 rounded-lg border border-[#E2DFD6] hover:bg-white text-[11px] font-semibold text-[#1E4D38] cursor-pointer"
                          >
                            Site Workflow →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#1E2922] block">All India Institute of Ayurveda (AIIA), New Delhi</span>
                          <span className="text-[#5C6B62] text-[11px]">Site 01 · Lead Investigational Center · PI: Prof. Dr. Anandita Sharma</span>
                        </div>
                        <span className="font-mono font-semibold text-[#1E4D38]">18 Participants</span>
                      </div>
                      <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#1E2922] block">National Institute of Ayurveda (NIA), Jaipur</span>
                          <span className="text-[#5C6B62] text-[11px]">Site 02 · Apex Research Center · Co-PI: Dr. Rajeshwar Varma</span>
                        </div>
                        <span className="font-mono font-semibold text-[#1E4D38]">15 Participants</span>
                      </div>
                      <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#1E2922] block">Institute of Teaching & Research in Ayurveda (IPGT&RA), Jamnagar</span>
                          <span className="text-[#5C6B62] text-[11px]">Site 03 · Participating Study Center · Co-PI: Dr. Meenakshi Bhatt</span>
                        </div>
                        <span className="font-mono font-semibold text-[#1E4D38]">14 Participants</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: PARTICIPANTS */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('participants')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      47 Enrolled Participants Affected
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> 47 active participants are currently enrolled in the schedule timeline approaching the Visit 4 milestone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.participants ? 'Hide cohort' : 'View participants'}</span>
                  {expandedSections.participants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.participants && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-3 text-xs animate-fade-in">
                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] block">
                      AIIA New Delhi (18 Participants)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {site1Participants.map((pid) => (
                        <span key={pid} className="px-2 py-0.5 bg-white border border-[#E2DFD6] rounded font-mono text-[11px] text-[#1E2922]">
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] block">
                      NIA Jaipur (15 Participants)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {site2Participants.map((pid) => (
                        <span key={pid} className="px-2 py-0.5 bg-white border border-[#E2DFD6] rounded font-mono text-[11px] text-[#1E2922]">
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] block">
                      IPGT Jamnagar (14 Participants)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {site3Participants.map((pid) => (
                        <span key={pid} className="px-2 py-0.5 bg-white border border-[#E2DFD6] rounded font-mono text-[11px] text-[#1E2922]">
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: VISITS */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('visits')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      1 Visit Schedule Affected
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> The amendment explicitly modifies the assessment window bounds for Visit 4.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.visits ? 'Hide window' : 'View visit details'}</span>
                  {expandedSections.visits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.visits && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
                  <div className="p-3.5 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-[#5C6B62] block">Target Visit</span>
                      <span className="font-bold text-[#1E2922]">Visit 4 (Mid-Treatment Assessment)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 block font-semibold">Current Protocol Window</span>
                      <span className="font-mono font-bold text-rose-700">Day 25–31 (7 Days)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#1E4D38] block font-semibold">Proposed Protocol Window</span>
                      <span className="font-mono font-bold text-[#1E4D38]">Day 25–35 (11 Days, +4 Days Flex)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: CRFS */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('crfs')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      1 Case Report Form (CRF) Affected
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> Electronic Case Report Form validation logic must match physical protocol window bounds.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.crfs ? 'Hide CRF' : 'View CRF details'}</span>
                  {expandedSections.crfs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.crfs && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#1E2922] block">CRF-04: Visit 4 Clinical Assessment Form</span>
                      <span className="text-[#5C6B62] text-[11px]">REDCap Instrument ID: crf_visit_04_v1 · Parameter Parity: Day 25–35</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2] self-start sm:self-auto">
                      Schema v1.1 Update Required
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: CONSENT */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('consent')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      Informed Consent Addendum Required
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> ICMR 2017 Section 5 guidelines mandate patient information sheet addendums for visit schedule changes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.consent ? 'Hide consent' : 'View implications'}</span>
                  {expandedSections.consent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.consent && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                    <span className="font-bold text-[#1E2922] block">Patient Information Sheet (PIS v1.1 Addendum)</span>
                    <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                      Must be provided to all 47 ongoing participants to notify them of the 4-day flex window for their Day 25–35 clinical follow-up appointment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: TRAINING */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('training')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      Multi-Site Investigator & CRC Training Required
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> Clinical Research Coordinators across centers must be re-trained on revised window tolerance limits.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.training ? 'Hide training' : 'View requirements'}</span>
                  {expandedSections.training ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.training && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                    <span className="font-bold text-[#1E2922] block">Site CRC Protocol Briefing Sign-Off</span>
                    <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                      All research coordinators at AIIA Delhi, NIA Jaipur, and IPGT Jamnagar must complete a 15-minute briefing on the new Visit 4 window and submit training logs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: ETHICS */}
            <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => toggleSection('ethics')}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E2922]">
                      Institutional Ethics Committee (IEC) Notification Required
                    </h3>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      <strong>Why affected:</strong> NDCT Rules 2019 Rule 26 requires prior ethics notification and acknowledgment before operational implementation.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38]">
                  <span>{expandedSections.ethics ? 'Hide ethics' : 'View compliance details'}</span>
                  {expandedSections.ethics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedSections.ethics && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
                  <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                    <span className="font-bold text-[#1E2922] block">IEC-Central Notification Dossier Submission</span>
                    <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                      Expedited ethics notification docket must be acknowledged by the Institutional Ethics Committee prior to deploying the amendment to investigational centers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
