import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours, Spacing } from '../../../utils/constants';
import { styles } from '../../../styles/LearnerDashboardScreen.styles';
import { LearnerProfile } from '../../../types/Learner';
import { useLearnerDashboardDisplay } from '../hooks/useLearnerDashboardDisplay';
import { InfoChip } from './InfoChip';
import { SectionCard } from './SectionCard';
import { PreferenceRow } from './PreferenceRow';
import { BecomeMentorModal } from './BecomeMentorModal';
import { RootStackParamList } from '../../../navigation/types';
import { CommonActions } from '@react-navigation/native';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileContentProps {
  profile: LearnerProfile;
  userName: string;
  userEmail: string;
  userRole: string;
  isLoading: boolean;
  onSignOut: () => void;
  onBecomeMentor: () => void;
  onViewMentorProfile: () => void;
  onEditProfile: (profile: LearnerProfile) => void;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  profile,
  userName,
  userEmail,
  userRole,
  isLoading,
  onSignOut,
  onBecomeMentor,
  onViewMentorProfile,
  onEditProfile,
}) => {
  console.log(' ProfileContent received profile:', JSON.stringify(profile, null, 2));
  const insets = useSafeAreaInsets();
  const [showBecomeMentorConfirm, setShowBecomeMentorConfirm] = useState(false);
  const display = useLearnerDashboardDisplay(profile, userName);
  console.log(' Full display object:', display);
  console.log(' display.goalLabels:', display.goalLabels);
  console.log(' display.availabilityLabels:', display.availabilityLabels);
  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colours.primary} />
      </View>
    );
  }

  const handleConfirmBecomeMentor = () => {
    setShowBecomeMentorConfirm(false);
    onBecomeMentor();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner + Avatar ──────────────────────────────────────── */}
        <View style={styles.bannerWrap}>
          <LinearGradient
            colors={['#6C3AED', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, { paddingTop: insets.top }]}
          />

          <TouchableOpacity
            style={[styles.editButton, { top: insets.top + 12 }]}
            onPress={() => onEditProfile(profile)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color="#fff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.avatarWrap, { backgroundColor: display.avatarColour }]}>
            <Text style={styles.avatarText}>{display.initials}</Text>
          </View>
        </View>

        {/* ── Identity block ───────────────────────────────────────── */}
        <View style={styles.identityBlock}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>

          {profile.experience_level && (
            <View style={[
              styles.levelBadge,
              { backgroundColor: display.levelColour(profile.experience_level) + '22',
                borderColor: display.levelColour(profile.experience_level) }
            ]}>
              <Text style={[styles.levelBadgeText, { color: display.levelColour(profile.experience_level) }]}>
                {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            {!!profile.location && (
              <InfoChip icon="map-marker-outline" label={profile.location} />
            )}
            {!!profile.preferred_languages && (
              <InfoChip icon="translate" label={profile.preferred_languages} />
            )}
            {!!profile.preferred_category_name && (
              <InfoChip icon="tag-outline" label={profile.preferred_category_name} />
            )}
          </View>

          {/* Mentor buttons */}
          {userRole === 'both' ? (
            <TouchableOpacity 
              style={[styles.signOutButton, { backgroundColor: Colours.primary }]} 
             onPress={onViewMentorProfile}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="briefcase" size={16} color="#fff" />
              <Text style={[styles.signOutText, { color: '#fff' }]}>View Mentor Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.signOutButton, { backgroundColor: Colours.primary }]} 
              onPress={() => setShowBecomeMentorConfirm(true)} 
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="briefcase-plus" size={16} color="#fff" />
              <Text style={[styles.signOutText, { color: '#fff' }]}>Become a Mentor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Profile sections ─────────────────────────────────────── */}
        {!!profile.bio && (
          <SectionCard title="About">
            <Text style={styles.bio}>{profile.bio}</Text>
          </SectionCard>
        )}
        
        {profile.interests.length > 0 && (
          <SectionCard title="Skills I want to learn">
            {(profile.interests || []).map(interest => (
              <View key={interest.id} style={styles.interestRow}>
                <View style={styles.interestLeft}>
                  <Text style={styles.interestName}>{interest.skill_name}</Text>
                  {interest.current_level && (
                    <Text style={styles.interestLevel}>
                      {interest.current_level}
                      {interest.target_level ? ` → ${interest.target_level}` : ''}
                    </Text>
                  )}
                </View>
                {interest.target_level && (
                  <View style={[
                    styles.smallBadge,
                    { backgroundColor: display.levelColour(interest.target_level) + '22',
                      borderColor: display.levelColour(interest.target_level) }
                  ]}>
                    <Text style={[styles.smallBadgeText, { color: display.levelColour(interest.target_level) }]}>
                      {interest.target_level}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </SectionCard>
        )}
        
        {display.goalLabels.length > 0 && (
          <SectionCard title="Learning goals">
            <View style={styles.chipsRow}>
              {display.goalLabels.map(label => (
                <View key={label} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{label}</Text>
                </View>
              ))}
            </View>
            {!!profile.goal_description && (
              <Text style={styles.goalDescription}>{profile.goal_description}</Text>
            )}
          </SectionCard>
        )}

        <SectionCard title="Preferences">
          <PreferenceRow
            icon="currency-eur"
            label="Budget"
            value={display.formatBudget}
          />
          <PreferenceRow
            icon="monitor-cellphone"
            label="Session format"
            value={display.formatFormat(profile.preferred_session_format)}
          />
          {display.availabilityLabels.length > 0 && (
            <View style={styles.prefRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={Colours.textSecondary}
                style={styles.prefIconEl}
              />
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>Availability</Text>
                <View style={styles.chipsRow}>
                  {display.availabilityLabels.map(label => (
                    <View key={label} style={styles.availChip}>
                      <Text style={styles.availChipText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </SectionCard>

        <View style={styles.explainerCard}>
          <View style={styles.explainerTitleRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={Colours.primary} />
            <Text style={styles.explainerTitle}>How this powers your matches</Text>
          </View>
          <Text style={styles.explainerText}>
            When you search for mentors, every mentor is scored against your profile.
            Skills carry the most weight (35%), followed by goals (15%), budget (10%),
            language match (10%), and availability overlap (10%).
          </Text>
        </View>

        {/* ── Sign out ─────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={16} color={Colours.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BecomeMentorModal
        visible={showBecomeMentorConfirm}
        onClose={() => setShowBecomeMentorConfirm(false)}
        onConfirm={handleConfirmBecomeMentor}
      />
    </>
  );
};