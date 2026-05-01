import { useMemo } from 'react';
import { LearnerProfile, GOAL_TAGS, AVAILABILITY_WINDOWS } from '../../../types/Learner';
import { Colours } from '../../../utils/constants';

export const useLearnerDashboardDisplay = (profile: LearnerProfile | null, userName?: string) => {
  const initials = useMemo(() => {
    if (!userName) return '?';
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [userName]);

  const avatarColour = useMemo(() => {
    const avatar_colours = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
    return avatar_colours[(userName?.length ?? 0) % avatar_colours.length];
  }, [userName]);

  const goalLabels = useMemo(() => {
    if (!profile?.goal_tags) return [];
    return profile.goal_tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(v => GOAL_TAGS.find(g => g.value === v)?.label ?? v);
  }, [profile?.goal_tags]);

  const availabilityLabels = useMemo(() => {
    if (!profile?.availability_preference) return [];
    return profile.availability_preference
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
      .map(v => AVAILABILITY_WINDOWS.find(w => w.value === v)?.label ?? v);
  }, [profile?.availability_preference]);

  const formatBudget = useMemo(() => {
    if (!profile) return null;
    if (profile.min_price != null && profile.max_price != null)
      return `€${profile.min_price} – €${profile.max_price}`;
    if (profile.max_price != null) return `Up to €${profile.max_price}`;
    if (profile.min_price != null) return `From €${profile.min_price}`;
    return null;
  }, [profile?.min_price, profile?.max_price]);

  const formatFormat = (f: string | null | undefined) => {
    if (!f) return null;
    return f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const levelColour = (level: string | null | undefined) => {
    if (level === 'beginner') return '#10B981';
    if (level === 'intermediate') return '#F59E0B';
    if (level === 'advanced') return '#EF4444';
    return Colours.primary;
  };

  return {
    initials,
    avatarColour,
    goalLabels,
    availabilityLabels,
    formatBudget,
    formatFormat,
    levelColour,
  };
};