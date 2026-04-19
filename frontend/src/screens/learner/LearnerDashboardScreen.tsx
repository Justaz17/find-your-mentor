import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../utils/constants';
import { styles } from '../../styles/LearnerDashboardScreen.styles';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import { useLearnerProfile } from './hooks/useLearnerProfile';
import { MentorOnlyState } from './components/MentorOnlyState';
import { NoProfileState } from './components/NoProfileState';
import { ProfileContent } from './components/ProfileContent';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface LearnerDashboardProps {
  onSwitchToMentor?: () => void;
}

const LearnerDashboardScreen = ({ onSwitchToMentor }: LearnerDashboardProps) => {
  const navigation = useNavigation<NavProp>();
  const { user, signOut } = useAuth();
  const { profile, isLoading, hasProfile } = useLearnerProfile();

  if (user?.role === 'mentor') {
    return <MentorOnlyState navigation={navigation} />;
  }

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!hasProfile) {
    return <NoProfileState navigation={navigation} />;
  }

  return (
    <ProfileContent
      profile={profile!}
      userName={user?.name ?? 'Your Name'}
      userEmail={user?.email ?? ''}
      userRole={user?.role ?? 'learner'}
      isLoading={isLoading}
      onSignOut={signOut}
      onBecomeMentor={() => navigation.navigate('MentorOnboarding' as never)}
      onViewMentorProfile={onSwitchToMentor}
      onEditProfile={(profile) => navigation.navigate('EditLearnerProfile', { profile })}
    />
  );
};

export default LearnerDashboardScreen;