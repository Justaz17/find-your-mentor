import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MentorProfile, Category } from '../types/Mentor';
import { LearnerProfile } from '../types/Learner';
import { getMentors, getCategories, searchMentors } from '../services/mentorService';
import { getMyLearnerProfile } from '../services/learnerService';

const shuffleSlice = (arr: MentorProfile[], count: number): MentorProfile[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

export const useHomeScreen = (isAuthenticated: boolean) => {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) { setProfileChecked(true); return; }
      getMyLearnerProfile()
        .then(p => { setLearnerProfile(p); setProfileChecked(true); })
        .catch(() => { setLearnerProfile(null); setProfileChecked(true); });
    }, [isAuthenticated])
  );

  const fetchMentors = useCallback(async () => {
    try {
      setError(null);
      let data: MentorProfile[];
      if (isAuthenticated) {
        data = await searchMentors({});
      } else {
        const raw = await getMentors();
        data = [...raw].sort((a, b) => {
          const r = (b.average_rating ?? 0) - (a.average_rating ?? 0);
          return r !== 0 ? r : (b.total_reviews ?? 0) - (a.total_reviews ?? 0);
        });
      }
      setMentors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mentors');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const refresh = () => { setIsRefreshing(true); fetchMentors(); };

  const rotatedMentors = useMemo(
    () => shuffleSlice(mentors.slice(0, 6), 6),
    [mentors.length]
  );

  const getProfileCompletion = () => {
    if (!learnerProfile) return { pct: 0, missing: ['About me', 'Preferences', 'Skills', 'Goals', 'Availability'] };
    const fields = [
      { label: 'About me', done: !!(learnerProfile.bio || learnerProfile.location) },
      { label: 'Preferences', done: !!(learnerProfile.preferred_category_id || learnerProfile.experience_level) },
      { label: 'Skills', done: learnerProfile.interests.length > 0 },
      { label: 'Goals', done: !!(learnerProfile.goal_tags) },
      { label: 'Availability', done: !!(learnerProfile.availability_preference) },
    ];
    const done = fields.filter(f => f.done).length;
    return {
      pct: Math.round((done / fields.length) * 100),
      missing: fields.filter(f => !f.done).map(f => f.label),
    };
  };

  const { pct: completionPct, missing: missingFields } = getProfileCompletion();

  return {
    mentors,
    categories,
    rotatedMentors,
    isLoading,
    isRefreshing,
    error,
    learnerProfile,
    profileChecked,
    completionPct,
    missingFields,
    refresh,
    fetchMentors,
  };
};