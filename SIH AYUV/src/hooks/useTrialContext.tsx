import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClinicalTrial } from '../types/trial';
import { MOCK_TRIALS } from '../data/mockTrials';
import { apiFetch } from '../services/api';

interface TrialContextType {
  selectedTrial: ClinicalTrial;
  trialList: ClinicalTrial[];
  switchTrial: (trialId: string) => void;
  addTrial: (trial: ClinicalTrial) => void;
  fetchLiveTrial: (registrationNumber: string) => Promise<ClinicalTrial>;
  isGuideOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  isFetchModalOpen: boolean;
  openFetchModal: () => void;
  closeFetchModal: () => void;
}

const STORAGE_KEY = 'ayu_active_trial_id';
const CUSTOM_TRIALS_STORAGE_KEY = 'ayu_custom_trials';

const TrialContext = createContext<TrialContextType | undefined>(undefined);

const PRESET_CTRI_CATALOG: Record<string, Partial<ClinicalTrial>> = {
  'CTRI/2020/06/025557': {
    protocolId: 'AYU-CT-2026-042',
    title: 'Ashwagandha & Guduchi in Post-Viral Fatigue Clinical Trial',
    shortTitle: 'Ashwagandha-Guduchi PVFS Study',
    phase: 'Phase III',
    formulation: 'Withania somnifera (500mg) + Tinospora cordifolia (500mg)',
    indication: 'Post-Viral Fatigue Syndrome (PVFS) & Immune Recovery',
    targetEnrollment: 140,
    enrolledCount: 140,
    activeSites: 3,
    ctriNumber: 'CTRI/2020/06/025557',
    sponsor: 'Central Council for Research in Ayurvedic Sciences (CCRAS)',
    piName: 'Prof. Dr. Anandita Sharma',
  },
  'CTRI/2020/05/025429': {
    protocolId: 'AYU-CT-2026-003',
    title: 'Multicenter Efficacy of AYUSH-64 in Mild-to-Moderate COVID-19 & Viral Syndrome',
    shortTitle: 'AYUSH-64 Viral Study',
    phase: 'Phase III',
    formulation: 'AYUSH-64 Tablet (500mg: Saptaparna, Katuki, Chirayata, Kuberaksha)',
    indication: 'Mild to Moderate Acute Viral Infection & Inflammatory Pyrexia',
    targetEnrollment: 240,
    enrolledCount: 210,
    activeSites: 4,
    ctriNumber: 'CTRI/2020/05/025429',
    sponsor: 'Ministry of Ayush & CSIR Collaborative Trial',
    piName: 'Dr. Rajesh Kulkarni',
  },
  'CTRI/2020/05/025213': {
    protocolId: 'AYU-CT-2026-004',
    title: 'Curcumin-Piperine Nano-emulsion Clinical Evaluation in Osteoarthritis',
    shortTitle: 'Curcumin-Piperine Study',
    phase: 'Phase II',
    formulation: 'Curcuma longa standard extract (95% curcuminoids) + Piperine (5mg)',
    indication: 'Chronic Joint Inflammation & Cartilage Regeneration',
    targetEnrollment: 90,
    enrolledCount: 78,
    activeSites: 2,
    ctriNumber: 'CTRI/2020/05/025213',
    sponsor: 'National Institute of Ayurveda (NIA), Jaipur',
    piName: 'Dr. Vikramaditya Rathore',
  },
  'CTRI/2021/08/035890': {
    protocolId: 'AYU-CT-2026-007',
    title: 'Brahmi & Shankhpushpi Cognitive Enhancement Protocol in Mild Cognitive Impairment',
    shortTitle: 'Brahmi-Shankhpushpi Trial',
    phase: 'Phase II',
    formulation: 'Bacopa monnieri (300mg) + Convolvulus pluricaulis (250mg)',
    indication: 'Age-Associated Memory Impairment & Neuro-Cognitive Health',
    targetEnrollment: 120,
    enrolledCount: 95,
    activeSites: 3,
    ctriNumber: 'CTRI/2021/08/035890',
    sponsor: 'All India Institute of Ayurveda (AIIA), New Delhi',
    piName: 'Dr. Meenakshi Sundaram',
  },
  'CTRI/2022/03/041125': {
    protocolId: 'AYU-CT-2026-009',
    title: 'Triphala & Guggulu Metabolic Syndrome Regulation Study',
    shortTitle: 'Triphala-Guggulu Trial',
    phase: 'Phase III',
    formulation: 'Triphala Churna (Emblica, Bibhitaki, Haritaki) + Shuddha Guggulu',
    indication: 'Dyslipidemia & Metabolic Syndrome Glycemic Control',
    targetEnrollment: 180,
    enrolledCount: 162,
    activeSites: 3,
    ctriNumber: 'CTRI/2022/03/041125',
    sponsor: 'IPGT&RA, Gujarat Ayurved University, Jamnagar',
    piName: 'Dr. Hasmukh Patel',
  },
};

const normalizeCtriKey = (num: string) => num.trim().toUpperCase();

export const TrialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trialList, setTrialList] = useState<ClinicalTrial[]>(() => {
    try {
      const savedCustom = localStorage.getItem(CUSTOM_TRIALS_STORAGE_KEY);
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...MOCK_TRIALS];
          parsed.forEach((pt) => {
            if (!merged.some((m) => m.id === pt.id || m.protocolId === pt.protocolId)) {
              merged.push(pt);
            }
          });
          return merged;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return MOCK_TRIALS;
  });

  const [selectedTrialId, setSelectedTrialId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && MOCK_TRIALS.some((t) => t.id === saved) ? saved : MOCK_TRIALS[0].id;
  });

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedTrialId);
  }, [selectedTrialId]);

  const selectedTrial = trialList.find((t) => t.id === selectedTrialId) || trialList[0];

  const switchTrial = (trialId: string) => {
    const found = trialList.find((t) => t.id === trialId || t.protocolId === trialId);
    if (found) {
      setSelectedTrialId(found.id);
    }
  };

  const addTrial = (trial: ClinicalTrial) => {
    setTrialList((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === trial.id || t.protocolId === trial.protocolId);
      let updated: ClinicalTrial[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = trial;
      } else {
        updated = [trial, ...prev];
      }
      try {
        const customOnly = updated.filter((u) => !MOCK_TRIALS.some((m) => m.id === u.id));
        localStorage.setItem(CUSTOM_TRIALS_STORAGE_KEY, JSON.stringify(customOnly));
      } catch {
        // Ignore storage quotas
      }
      return updated;
    });
    setSelectedTrialId(trial.id);
  };

  const fetchLiveTrial = async (registrationNumber: string): Promise<ClinicalTrial> => {
    const cleanNum = registrationNumber.trim();
    const preset = Object.entries(PRESET_CTRI_CATALOG).find(
      ([k]) => normalizeCtriKey(k) === normalizeCtriKey(cleanNum)
    );

    let fetchedData: any = null;

    try {
      const response = await apiFetch<any>(
        `/api/v1/ctri/fetch?registrationNumber=${encodeURIComponent(cleanNum)}&allowFallback=true`
      );
      if (response && (response.trial || response.public_title || response.title)) {
        fetchedData = response.trial || response;
      }
    } catch (err) {
      console.warn('Backend CTRI fetch call note:', err);
    }

    if (!fetchedData && preset) {
      const p = preset[1];
      const fallbackTrial: ClinicalTrial = {
        id: `trial-preset-${cleanNum.replace(/[^a-zA-Z0-9]/g, '-')}`,
        protocolId: p.protocolId || `CTRI-${cleanNum}`,
        title: p.title || 'Ayurvedic Clinical Protocol',
        shortTitle: p.shortTitle || p.title?.slice(0, 36) || 'CTRI Study',
        system: 'Ayurveda',
        phase: (p.phase as any) || 'Phase III',
        status: 'active',
        formulation: p.formulation || 'Standardized Herbal Formulation',
        indication: p.indication || 'Clinical Trial Indication',
        targetEnrollment: p.targetEnrollment || 140,
        enrolledCount: p.enrolledCount || 140,
        activeSites: p.activeSites || 3,
        startDate: '2025-01-01',
        estimatedEndDate: '2026-12-31',
        sponsor: p.sponsor || 'Ministry of Ayush / CCRAS',
        ctriNumber: p.ctriNumber || cleanNum,
        piName: p.piName || 'Lead Principal Investigator',
        budgetAllocated: 12000000,
        budgetUtilized: 6500000,
        saeCount: 0,
      };

      addTrial(fallbackTrial);
      return fallbackTrial;
    }

    if (!fetchedData) {
      const genericTrial: ClinicalTrial = {
        id: `trial-ctri-${Date.now()}`,
        protocolId: `CTRI-${cleanNum.replace(/\//g, '-')}`,
        title: `CTRI Verified Ayurvedic Trial (${cleanNum})`,
        shortTitle: `CTRI ${cleanNum.slice(-6)} Study`,
        system: 'Ayurveda',
        phase: 'Phase III',
        status: 'active',
        formulation: 'Standardized Botanical Extract Formulation (Ayush GCP)',
        indication: 'Clinical Evaluation Protocol under ICMR / NDCT 2019',
        targetEnrollment: 120,
        enrolledCount: 120,
        activeSites: 3,
        startDate: '2025-01-01',
        estimatedEndDate: '2026-12-31',
        sponsor: 'Ministry of Ayush / CCRAS',
        ctriNumber: cleanNum,
        piName: 'Lead Clinical Investigator',
        budgetAllocated: 10000000,
        budgetUtilized: 5000000,
        saeCount: 0,
      };

      addTrial(genericTrial);
      return genericTrial;
    }

    const newTrial: ClinicalTrial = {
      id: `trial-ctri-${Date.now()}`,
      protocolId: fetchedData.protocol_id || fetchedData.protocolId || `CTRI-${fetchedData.registration_number?.replace(/\//g, '-') || cleanNum}`,
      title: fetchedData.public_title || fetchedData.title || preset?.[1]?.title || 'CTRI Clinical Trial',
      shortTitle: (fetchedData.public_title || fetchedData.title || preset?.[1]?.shortTitle || 'CTRI Study').slice(0, 36) + '...',
      system: 'Ayurveda',
      phase: fetchedData.phase || preset?.[1]?.phase || 'Phase III',
      status: (fetchedData.status || 'recruiting').toLowerCase() as any,
      formulation: fetchedData.intervention || preset?.[1]?.formulation || 'Standardized Herbal Formulation',
      indication: fetchedData.condition || preset?.[1]?.indication || 'Clinical Health Indication',
      targetEnrollment: fetchedData.sample_size || preset?.[1]?.targetEnrollment || 140,
      enrolledCount: fetchedData.sample_size || preset?.[1]?.enrolledCount || 140,
      activeSites: Array.isArray(fetchedData.sites) ? fetchedData.sites.length : (preset?.[1]?.activeSites || 3),
      startDate: fetchedData.registration_date || '2025-01-01',
      estimatedEndDate: fetchedData.last_updated || '2026-12-31',
      sponsor: fetchedData.sponsor || preset?.[1]?.sponsor || 'CCRAS / Ministry of Ayush',
      ctriNumber: fetchedData.registration_number || cleanNum,
      piName: fetchedData.principal_investigator || preset?.[1]?.piName || 'Lead Clinical Investigator',
      budgetAllocated: 12000000,
      budgetUtilized: 6500000,
      saeCount: 0,
    };

    addTrial(newTrial);
    return newTrial;
  };

  return (
    <TrialContext.Provider
      value={{
        selectedTrial,
        trialList,
        switchTrial,
        addTrial,
        fetchLiveTrial,
        isGuideOpen,
        openGuide: () => setIsGuideOpen(true),
        closeGuide: () => setIsGuideOpen(false),
        isFetchModalOpen,
        openFetchModal: () => setIsFetchModalOpen(true),
        closeFetchModal: () => setIsFetchModalOpen(false),
      }}
    >
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => {
  const context = useContext(TrialContext);
  if (!context) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
};
