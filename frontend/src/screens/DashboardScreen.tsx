import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MentorDashboardScreen from './mentor/MentorDashboardScreen';
import LearnerDashboardScreen from './learner/LearnerDashboardScreen';

const DashboardScreen = () => {
  const { user } = useAuth();
  const [showMentor, setShowMentor] = useState(true);

  if (user?.role === 'both') {
    return showMentor
      ? <MentorDashboardScreen onSwitchToLearner={() => setShowMentor(false)} />
      : <LearnerDashboardScreen onSwitchToMentor={() => setShowMentor(true)} />;
  }

  if (user?.role === 'mentor') return <MentorDashboardScreen />;

  return <LearnerDashboardScreen />;
};

export default DashboardScreen;