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
    const response = await apiFetch<any>(
      `/api/v1/ctri/fetch?registrationNumber=${encodeURIComponent(registrationNumber)}&allowFallback=true`
    );

    const raw = response.trial || response;
    const newTrial: ClinicalTrial = {
      id: `trial-ctri-${Date.now()}`,
      protocolId: raw.protocol_id || raw.protocolId || `CTRI-${raw.registration_number?.replace(/\//g, '-') || 'IMPORTED'}`,
      title: raw.public_title || raw.title || 'CTRI Clinical Trial',
      shortTitle: raw.public_title ? raw.public_title.slice(0, 36) + '...' : 'CTRI Live Study',
      system: 'Ayurveda',
      phase: raw.phase || 'Phase III',
      status: (raw.status || 'recruiting').toLowerCase() as any,
      formulation: raw.intervention || 'Standardized Herbal Formulation',
      indication: raw.condition || 'Clinical Health Indication',
      targetEnrollment: raw.sample_size || 140,
      enrolledCount: raw.sample_size || 140,
      activeSites: Array.isArray(raw.sites) ? raw.sites.length : 3,
      startDate: raw.registration_date || '2025-01-01',
      estimatedEndDate: raw.last_updated || '2026-12-31',
      sponsor: raw.sponsor || 'CCRAS / Ministry of Ayush',
      ctriNumber: raw.registration_number || registrationNumber,
      piName: raw.principal_investigator || 'Lead Clinical Investigator',
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
