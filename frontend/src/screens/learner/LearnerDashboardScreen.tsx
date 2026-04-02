import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/LearnerDashboardScreen.styles';
import { useAuth } from '../../context/AuthContext';
import { LearnerProfile, GOAL_TAGS, AVAILABILITY_WINDOWS } from '../../types/Learner';
import { getMyLearnerProfile } from '../../services/learnerService';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const BANNER_HEIGHT = 120;
const AVATAR_SIZE = 80;
const AVATAR_OFFSET = AVATAR_SIZE / 2;

// ── Small helpers ─────────────────────────────────────────────────────────

const InfoChip = ({
  icon, label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}) => (
  <View style={styles.infoChip}>
    <MaterialCommunityIcons name={icon} size={13} color={Colors.textSecondary} />
    <Text style={styles.infoChipText}>{label}</Text>
  </View>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const PreferenceRow = ({
  icon, label, value,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string | null | undefined;
}) => {
  if (!value) return null;
  return (
    <View style={styles.prefRow}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.textSecondary} style={styles.prefIconEl} />
      <View style={styles.prefText}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefValue}>{value}</Text>
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────

const LearnerDashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

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

  // ── Derived display values ────────────────────────────────────────

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarColors = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  const avatarColor = avatarColors[(user?.name?.length ?? 0) % avatarColors.length];

  const goalLabels = profile?.goal_tags
    ? profile.goal_tags.split(',').map(t => t.trim()).filter(Boolean)
        .map(v => GOAL_TAGS.find(g => g.value === v)?.label ?? v)
    : [];

  const availabilityLabels = profile?.availability_preference
    ? profile.availability_preference.split(',').map(a => a.trim()).filter(Boolean)
        .map(v => AVAILABILITY_WINDOWS.find(w => w.value === v)?.label ?? v)
    : [];

  const formatBudget = () => {
    if (!profile) return null;
    if (profile.min_price != null && profile.max_price != null)
      return `€${profile.min_price} – €${profile.max_price}`;
    if (profile.max_price != null) return `Up to €${profile.max_price}`;
    if (profile.min_price != null) return `From €${profile.min_price}`;
    return null;
  };

  const formatFormat = (f: string | null | undefined) => {
    if (!f) return null;
    return f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const levelColour = (level: string | null | undefined) => {
    if (level === 'beginner') return '#10B981';
    if (level === 'intermediate') return '#F59E0B';
    if (level === 'advanced') return '#EF4444';
    return Colors.primary;
  };

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
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

        {hasProfile && (
          <TouchableOpacity
            style={[styles.editButton, { top: insets.top + 12 }]}
            onPress={() => navigation.navigate('EditLearnerProfile', { profile: profile ?? undefined })}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color="#fff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.avatarWrap, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* ── Identity block ───────────────────────────────────────── */}
      <View style={styles.identityBlock}>
        <Text style={styles.name}>{user?.name ?? 'Your Name'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {profile?.experience_level && (
          <View style={[
            styles.levelBadge,
            { backgroundColor: levelColour(profile.experience_level) + '22',
              borderColor: levelColour(profile.experience_level) }
          ]}>
            <Text style={[styles.levelBadgeText, { color: levelColour(profile.experience_level) }]}>
              {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          {!!profile?.location && (
            <InfoChip icon="map-marker-outline" label={profile.location} />
          )}
          {!!profile?.preferred_languages && (
            <InfoChip icon="translate" label={profile.preferred_languages} />
          )}
          {!!profile?.preferred_category_name && (
            <InfoChip icon="tag-outline" label={profile.preferred_category_name} />
          )}
        </View>
      </View>

      {/* ── No profile state ─────────────────────────────────────── */}
      {!hasProfile && (
        <View style={styles.noProfileCard}>
          <MaterialCommunityIcons name="account-edit-outline" size={40} color={Colors.primary} style={{ marginBottom: Spacing.sm }} />
          <Text style={styles.noProfileTitle}>Complete your learner profile</Text>
          <Text style={styles.noProfileSubtitle}>
            Add your skills, goals, and preferences so we can match you with the right mentors.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('EditLearnerProfile', {})}
            activeOpacity={0.85}
          >
            <Text style={styles.createButtonText}>Create my profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Profile sections ─────────────────────────────────────── */}
      {hasProfile && profile && (
        <>
          {!!profile.bio && (
            <SectionCard title="About">
              <Text style={styles.bio}>{profile.bio}</Text>
            </SectionCard>
          )}

          {profile.interests.length > 0 && (
            <SectionCard title="Skills I want to learn">
              {profile.interests.map(interest => (
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
                      { backgroundColor: levelColour(interest.target_level) + '22',
                        borderColor: levelColour(interest.target_level) }
                    ]}>
                      <Text style={[styles.smallBadgeText, { color: levelColour(interest.target_level) }]}>
                        {interest.target_level}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </SectionCard>
          )}

          {goalLabels.length > 0 && (
            <SectionCard title="Learning goals">
              <View style={styles.chipsRow}>
                {goalLabels.map(label => (
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
              value={formatBudget()}
            />
            <PreferenceRow
              icon="monitor-cellphone"
              label="Session format"
              value={formatFormat(profile.preferred_session_format)}
            />
            {availabilityLabels.length > 0 && (
              <View style={styles.prefRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.prefIconEl}
                />
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Availability</Text>
                  <View style={styles.chipsRow}>
                    {availabilityLabels.map(label => (
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
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={Colors.primary} />
              <Text style={styles.explainerTitle}>How this powers your matches</Text>
            </View>
            <Text style={styles.explainerText}>
              When you search for mentors, every mentor is scored against your profile.
              Skills carry the most weight (35%), followed by goals (15%), budget (10%),
              language match (10%), and availability overlap (10%).
            </Text>
          </View>
        </>
      )}

      {/* ── Sign out ─────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.85}>
        <MaterialCommunityIcons name="logout" size={16} color={Colors.error} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default LearnerDashboardScreen;