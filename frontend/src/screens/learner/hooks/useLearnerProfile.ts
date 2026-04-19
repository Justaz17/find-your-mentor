import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LearnerProfile } from '../../../types/Learner';
import { getMyLearnerProfile } from '../../../services/learnerService';

export const useLearnerProfile = () => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getMyLearnerProfile()
        .then(data => {
          setProfile(data);
          setHasProfile(true);
        })
        .catch(e => {
          if (e?.response?.status === 404) setHasProfile(false);
        })
        .finally(() => setIsLoading(false));
    }, [])
  );

  return { profile, isLoading, hasProfile, setProfile };
};