import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createOrUpdateMentorProfile, getMyMentorProfile } from '../services/mentorService';
import { getMyServices } from '../services/serviceService';
import { getMentorAvailabilitySlots } from '../services/availabilityService';
import api from '../services/api';
import { MentorProfile, MentorService } from '../types/Mentor';
import { AvailabilitySlot } from '../types/Availability';

export interface MentorProfileCompletion {
  pct: number;
  missing: string[];
}

export const useMentorProfile = () => {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [services, setServices] = useState<MentorService[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [profileData, servicesData, slotsData] = await Promise.all([
        getMyMentorProfile().catch(() => null),
        getMyServices().catch(() => []),
        getMentorAvailabilitySlots().catch(() => []),
      ]);
      setProfile(profileData);
      setServices(servicesData);
      setSlots(slotsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    load();
  }, [load]));

  const getCompletion = (): MentorProfileCompletion => {
    if (!profile) return { pct: 0, missing: ['Profile', 'Skills', 'Services', 'Availability'] };

    const fields = [
      { label: 'Bio', done: !!profile.bio },
      { label: 'Skills', done: profile.skills.length > 0 },
      { label: 'Session format', done: !!profile.session_format },
      { label: 'Location', done: !!profile.location },
      { label: 'Services', done: services.length > 0 },
      { label: 'Availability', done: slots.length > 0 },
    ];

    const done = fields.filter(f => f.done).length;
    return {
      pct: Math.round((done / fields.length) * 100),
      missing: fields.filter(f => !f.done).map(f => f.label),
    };
  };

  return {
    profile,
    services,
    slots,
    isLoading,
    error,
    completion: getCompletion(),
    refresh: load,
  };
};