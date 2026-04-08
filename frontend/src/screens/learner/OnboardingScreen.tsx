import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Animated, Dimensions,
  Platform, UIManager, LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import {
  LearnerProfileCreate, LearnerInterestCreate,
  GOAL_TAGS, AVAILABILITY_WINDOWS, SESSION_FORMATS, EXPERIENCE_LEVELS,
} from '../../types/Learner';
import { Category } from '../../types/Mentor';
import { saveMyLearnerProfile } from '../../services/learnerService';
import { useAuth } from '../../context/AuthContext';
import { getCategories } from '../../services/mentorService';
import LocationPicker from '../../components/common/LocationPicker';
import LanguagePicker from '../../components/common/LanguagePicker';
import { styles } from '../../styles/OnboardingScreen.styles';
import { getCurrentUser } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STEPS = [
  {
    key: 'about',
    title: 'Tell us about yourself',
    subtitle: 'Help mentors understand who you are',
    icon: 'account-outline',
  },
  {
    key: 'preferences',
    title: 'Learning preferences',
    subtitle: 'How do you like to learn?',
    icon: 'school-outline',
  },
  {
    key: 'skills',
    title: 'Skills you want to learn',
    subtitle: 'The more specific, the better your matches',
    icon: 'lightning-bolt-outline',
  },
  {
    key: 'goals',
    title: 'What are you working towards?',
    subtitle: 'Your goals shape your mentor matches',
    icon: 'target',
  },
  {
    key: 'availability',
    title: 'When are you free?',
    subtitle: 'We\'ll match you with mentors who fit your schedule',
    icon: 'clock-outline',
  },
];

// ── Small reusables ───────────────────────────────────────────────────────
const ToggleChip = ({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const FieldLabel = ({ text, hint }: { text: string; hint?: string }) => (
  <View style={{ marginBottom: Spacing.sm }}>
    <Text style={styles.fieldLabel}>{text}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────
const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();
  const { clearPendingOnboarding,signIn } = useAuth();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const navigation = useNavigation();

  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Form state ─────────────────────────────────────────────────────────
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [preferredLanguages, setPreferredLanguages] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [goalDescription, setGoalDescription] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<Set<string>>(new Set());
  const [interests, setInterests] = useState<Array<LearnerInterestCreate & { skill_name: string }>>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const screenWidth = Dimensions.get('window').width;

  const toggleGoal = (value: string) => {
    setSelectedGoals(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const toggleAvailability = (value: string) => {
    setSelectedAvailability(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const addInterest = (skillId: number, skillName: string) => {
    if (interests.find(i => i.skill_id === skillId)) return;
    setInterests(prev => [...prev, { skill_id: skillId, skill_name: skillName, current_level: null, target_level: null }]);
    setShowSkillPicker(false);
  };

  const removeInterest = (skillId: number) => {
    setInterests(prev => prev.filter(i => i.skill_id !== skillId));
  };

  const updateInterestLevel = (skillId: number, field: 'current_level' | 'target_level', value: string | null) => {
    setInterests(prev => prev.map(i => {
      if (i.skill_id !== skillId) return i;
      const updated = { ...i, [field]: value };
      if (field === 'current_level' && value && updated.target_level) {
        const currentIdx = EXPERIENCE_LEVELS.indexOf(value as any);
        const targetIdx = EXPERIENCE_LEVELS.indexOf(updated.target_level as any);
        if (targetIdx <= currentIdx) updated.target_level = null;
      }
      return updated;
    }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSkip = () => {
    clearPendingOnboarding();
  };

  const handleSave = async () => {
  setIsSaving(true);
  try {
    const payload: LearnerProfileCreate = {
      bio: bio.trim() || undefined,
      preferred_category_id: selectedCategoryId,
      preferred_languages: preferredLanguages || undefined,
      preferred_session_format: selectedFormat,
      min_price: minPrice ? parseFloat(minPrice) : null,
      max_price: maxPrice ? parseFloat(maxPrice) : null,
      experience_level: selectedLevel,
      location: location || undefined,
      goal_tags: selectedGoals.size > 0 ? Array.from(selectedGoals).join(',') : undefined,
      goal_description: goalDescription.trim() || undefined,
      availability_preference: selectedAvailability.size > 0 ? Array.from(selectedAvailability).join(',') : undefined,
      interests: interests.map(i => ({
        skill_id: i.skill_id,
        current_level: i.current_level,
        target_level: i.target_level,
      })),
    };
    await saveMyLearnerProfile(payload);
    console.log('Profile saved');
    
    // Refresh user token with updated role
    console.log('Calling getCurrentUser');
    const { user: freshUser, access_token } = await getCurrentUser();
    console.log('Fresh user role:', freshUser.role, 'Token exists:', !!access_token);
    
    console.log('Calling signIn');
    await signIn(access_token, false);
    console.log('signIn done');
    
    await clearPendingOnboarding();
    console.log('clearPendingOnboarding done');

     setTimeout(() => {
      navigation.navigate('Main' as never);
    }, 100);
  } catch (e: any) {
    console.error('Error in handleSave:', e?.message || e);
    await clearPendingOnboarding();
  } finally {
    setIsSaving(false);
  }
};

  const currentStep = STEPS[step];

  // ── Step content ──────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep.key) {

      case 'about':
        return (
          <View style={styles.stepContent}>
            <FieldLabel text="Bio" hint="Optional — introduce yourself to mentors" />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="e.g. Software student looking to level up in Python and system design..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
            <FieldLabel text="Location" />
            <LocationPicker value={location} onChange={setLocation} />
            <View style={{ height: Spacing.md }} />
            <FieldLabel text="Languages I speak" />
            <LanguagePicker value={preferredLanguages} onChange={setPreferredLanguages} />
          </View>
        );

      case 'preferences':
        return (
          <View style={styles.stepContent}>
            <FieldLabel text="Main area of interest" />
            <View style={styles.chipsRow}>
              {categories.map(cat => (
                <ToggleChip
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategoryId === cat.id}
                  onPress={() => setSelectedCategoryId(prev => prev === cat.id ? null : cat.id)}
                />
              ))}
            </View>
            <View style={{ height: Spacing.md }} />
            <FieldLabel text="Experience level" />
            <View style={styles.chipsRow}>
              {EXPERIENCE_LEVELS.map(level => (
                <ToggleChip
                  key={level}
                  label={level.charAt(0).toUpperCase() + level.slice(1)}
                  active={selectedLevel === level}
                  onPress={() => setSelectedLevel(prev => prev === level ? null : level)}
                />
              ))}
            </View>
            <View style={{ height: Spacing.md }} />
            <FieldLabel text="Session format" />
            <View style={styles.chipsRow}>
              {SESSION_FORMATS.map(opt => (
                <ToggleChip
                  key={opt.value}
                  label={opt.label}
                  active={selectedFormat === opt.value}
                  onPress={() => setSelectedFormat(prev => prev === opt.value ? null : opt.value)}
                />
              ))}
            </View>
            <View style={{ height: Spacing.md }} />
            <FieldLabel text="Budget per session (€)" hint="Optional" />
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrap}>
                <MaterialCommunityIcons name="currency-eur" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.priceInput}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="Min"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.priceSeparator}>–</Text>
              <View style={styles.priceInputWrap}>
                <MaterialCommunityIcons name="currency-eur" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.priceInput}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="Max"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );

      case 'skills':
        return (
          <View style={styles.stepContent}>
            {interests.length === 0 && (
              <View style={styles.emptySkills}>
                <MaterialCommunityIcons name="lightning-bolt-outline" size={36} color={Colors.textSecondary} />
                <Text style={styles.emptySkillsText}>No skills added yet</Text>
                <Text style={styles.emptySkillsHint}>Add the skills you want to learn below</Text>
              </View>
            )}

            {interests.map(interest => (
              <View key={interest.skill_id} style={styles.interestCard}>
                <View style={styles.interestCardHeader}>
                  <Text style={styles.interestSkillName}>{interest.skill_name}</Text>
                  <TouchableOpacity onPress={() => removeInterest(interest.skill_id)}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.levelRow}>
                  <View>
                    <Text style={styles.levelLabel}>Current level</Text>
                    <View style={styles.chipsRow}>
                      {EXPERIENCE_LEVELS.map(level => (
                        <ToggleChip
                          key={level}
                          label={level.charAt(0).toUpperCase() + level.slice(1)}
                          active={interest.current_level === level}
                          onPress={() => updateInterestLevel(interest.skill_id, 'current_level', interest.current_level === level ? null : level)}
                        />
                      ))}
                    </View>
                  </View>
                  <View>
                    <Text style={styles.levelLabel}>Target level</Text>
                    <View style={styles.chipsRow}>
                      {EXPERIENCE_LEVELS
                        .filter(level => !interest.current_level || EXPERIENCE_LEVELS.indexOf(level) > EXPERIENCE_LEVELS.indexOf(interest.current_level as any))
                        .map(level => (
                          <ToggleChip
                            key={level}
                            label={level.charAt(0).toUpperCase() + level.slice(1)}
                            active={interest.target_level === level}
                            onPress={() => updateInterestLevel(interest.skill_id, 'target_level', interest.target_level === level ? null : level)}
                          />
                        ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSkillButton}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowSkillPicker(prev => !prev);
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name={showSkillPicker ? 'close' : 'plus'} size={18} color={Colors.primary} />
              <Text style={styles.addSkillText}>{showSkillPicker ? 'Close' : 'Add a skill'}</Text>
            </TouchableOpacity>

            {showSkillPicker && (
              <View style={styles.skillPicker}>
                {categories.map(cat => (
                  <View key={cat.id}>
                    <Text style={styles.skillPickerCategory}>{cat.name}</Text>
                    <View style={styles.chipsRow}>
                      {cat.skills
                        .filter(s => !interests.find(i => i.skill_id === s.id))
                        .map(skill => (
                          <TouchableOpacity
                            key={skill.id}
                            style={styles.skillPickerChip}
                            onPress={() => addInterest(skill.id, skill.name)}
                            activeOpacity={0.85}
                          >
                            <MaterialCommunityIcons name="plus" size={12} color={Colors.primary} />
                            <Text style={styles.skillPickerChipText}>{skill.name}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'goals':
        return (
          <View style={styles.stepContent}>
            <FieldLabel text="What are you working towards?" hint="Select all that apply" />
            <View style={styles.chipsRow}>
              {GOAL_TAGS.map(goal => (
                <ToggleChip
                  key={goal.value}
                  label={goal.label}
                  active={selectedGoals.has(goal.value)}
                  onPress={() => toggleGoal(goal.value)}
                />
              ))}
            </View>
            <View style={{ height: Spacing.md }} />
            <FieldLabel text="Describe your goals" hint="Optional" />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={goalDescription}
              onChangeText={setGoalDescription}
              placeholder="e.g. I want to build my first full-stack project by the end of the year."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        );

      case 'availability':
        return (
          <View style={styles.stepContent}>
            <FieldLabel text="When are you usually free?" hint="Select all that apply" />
            <View style={styles.chipsRow}>
              {AVAILABILITY_WINDOWS.map(opt => (
                <ToggleChip
                  key={opt.value}
                  label={opt.label}
                  active={selectedAvailability.has(opt.value)}
                  onPress={() => toggleAvailability(opt.value)}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>
        {step > 0 ? (
          <TouchableOpacity onPress={handleBack} activeOpacity={0.85}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step icon + title */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <MaterialCommunityIcons
              name={currentStep.icon as any}
              size={28}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
        </View>

        {renderStep()}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.88}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {step === STEPS.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <MaterialCommunityIcons
                name={step === STEPS.length - 1 ? 'check' : 'arrow-right'}
                size={20}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
        {step < STEPS.length - 1 && (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.7} style={styles.skipStepBtn}>
            <Text style={styles.skipStepText}>Skip this step</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default OnboardingScreen;