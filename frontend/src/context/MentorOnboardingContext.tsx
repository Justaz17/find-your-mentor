import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createOrUpdateMentorProfile } from '../services/mentorService';

interface MentorOnboardingData {
  bio: string;
  location: string;
  languages: string;
  sessionFormat: string;
  skills: string[];
  tags: string;
}

interface MentorOnboardingContextType {
  data: MentorOnboardingData;
  updateData: (updates: Partial<MentorOnboardingData>) => void;
  saveProfile: (overrides?: Partial<MentorOnboardingData>) => Promise<void>;
  isSaving: boolean;
}

const defaultData: MentorOnboardingData = {
  bio: '',
  location: '',
  languages: '',
  sessionFormat: 'online',
  skills: [],
  tags: '',
};

const MentorOnboardingContext = createContext<MentorOnboardingContextType | undefined>(undefined);

export const MentorOnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<MentorOnboardingData>(defaultData);
  const [isSaving, setIsSaving] = useState(false);

  const updateData = (updates: Partial<MentorOnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const saveProfile = async (overrides?: Partial<MentorOnboardingData>) => {
  const merged = { ...data, ...overrides };
  console.log('SAVING TO DB:', merged);
  setIsSaving(true);
  try {
    await createOrUpdateMentorProfile({
      bio: merged.bio || '',
      hourly_rate: 0,
      skills: merged.skills,
      is_visible: true,
      languages: merged.languages || undefined,
      session_format: merged.sessionFormat,
      location: merged.location || undefined,
      tags: merged.tags || undefined,
    });
  } finally {
    setIsSaving(false);
  }
};

  return (
    <MentorOnboardingContext.Provider value={{ data, updateData, saveProfile, isSaving }}>
      {children}
    </MentorOnboardingContext.Provider>
  );
};

export const useMentorOnboarding = () => {
  const context = useContext(MentorOnboardingContext);
  if (!context) throw new Error('useMentorOnboarding must be used within MentorOnboardingProvider');
  return context;
};