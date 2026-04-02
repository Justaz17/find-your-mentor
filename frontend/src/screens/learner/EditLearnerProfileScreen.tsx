import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import {
  LearnerProfile, LearnerProfileCreate, LearnerInterestCreate,
  GOAL_TAGS, AVAILABILITY_WINDOWS, SESSION_FORMATS, EXPERIENCE_LEVELS,
} from '../../types/Learner';
import { Category } from '../../types/Mentor';
import { saveMyLearnerProfile } from '../../services/learnerService';
import { getCategories } from '../../services/mentorService';
import { RootStackParamList } from '../../navigation/types';
import LocationPicker from '../../components/common/LocationPicker';
import LanguagePicker from '../../components/common/LanguagePicker';
import { acc, styles } from '../../styles/EditLearnerProfileScreen.styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteP = RouteProp<RootStackParamList, 'EditLearnerProfile'>;

// ── Accordion section ─────────────────────────────────────────────────────

interface AccordionProps {
  icon: string;
  title: string;
  summary: string | null;   // shown when collapsed
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = ({ icon, title, summary, isOpen, onToggle, children }: AccordionProps) => (
  <View style={acc.wrap}>
    <TouchableOpacity style={acc.header} onPress={onToggle} activeOpacity={0.85}>
      <View style={acc.headerLeft}>
        <View style={[acc.iconWrap, isOpen && acc.iconWrapActive]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={isOpen ? Colors.primary : Colors.textSecondary}
          />
        </View>
        <View style={acc.headerText}>
          <Text style={acc.title}>{title}</Text>
          {!isOpen && !!summary && (
            <Text style={acc.summary} numberOfLines={1}>{summary}</Text>
          )}
        </View>
      </View>
      <MaterialCommunityIcons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={Colors.textSecondary}
      />
    </TouchableOpacity>
    {isOpen && <View style={acc.body}>{children}</View>}
  </View>
);


// ── Small reusables ───────────────────────────────────────────────────────

const FieldLabel = ({ text, hint }: { text: string; hint?: string }) => (
  <View style={{ marginBottom: Spacing.sm }}>
    <Text style={styles.fieldLabel}>{text}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

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

// ── Main screen ───────────────────────────────────────────────────────────

const EditLearnerProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const existing = route.params?.profile ?? null;

  // ── Form state ────────────────────────────────────────────────────
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [preferredLanguages, setPreferredLanguages] = useState(existing?.preferred_languages ?? '');
  const [goalDescription, setGoalDescription] = useState(existing?.goal_description ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(existing?.preferred_category_id ?? null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(existing?.preferred_session_format ?? null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(existing?.experience_level ?? null);
  const [minPrice, setMinPrice] = useState(existing?.min_price != null ? String(existing.min_price) : '');
  const [maxPrice, setMaxPrice] = useState(existing?.max_price != null ? String(existing.max_price) : '');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(
    new Set(existing?.goal_tags?.split(',').map(t => t.trim()).filter(Boolean) ?? [])
  );
  const [selectedAvailability, setSelectedAvailability] = useState<Set<string>>(
    new Set(existing?.availability_preference?.split(',').map(a => a.trim()).filter(Boolean) ?? [])
  );
  const [interests, setInterests] = useState<Array<LearnerInterestCreate & { skill_name: string }>>(
    existing?.interests.map(i => ({
      skill_id: i.skill_id,
      skill_name: i.skill_name,
      current_level: i.current_level,
      target_level: i.target_level,
    })) ?? []
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  // ── Accordion open state ──────────────────────────────────────────
  // Auto-open sections that already have data when editing
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (!existing) return new Set(['about']); // first-time: open About
    const open = new Set<string>();
    if (existing.bio || existing.location || existing.preferred_languages) open.add('about');
    if (existing.preferred_category_id || existing.experience_level || existing.preferred_session_format || existing.min_price || existing.max_price) open.add('preferences');
    if (existing.interests?.length) open.add('skills');
    if (existing.goal_tags || existing.goal_description) open.add('goals');
    if (existing.availability_preference) open.add('availability');
    return open;
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────
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
      // If current level changed, clear target if it's now <= current
      if (field === 'current_level' && value && updated.target_level) {
        const currentIdx = EXPERIENCE_LEVELS.indexOf(value);
        const targetIdx = EXPERIENCE_LEVELS.indexOf(updated.target_level);
        if (targetIdx <= currentIdx) updated.target_level = null;
      }
      return updated;
    }));
  };

  // ── Section summaries (shown when collapsed) ──────────────────────
  const aboutSummary = [bio ? 'Bio added' : null, location, preferredLanguages]
    .filter(Boolean).join(' · ') || null;

  const preferencesSummary = [
    categories.find(c => c.id === selectedCategoryId)?.name,
    selectedLevel,
    selectedFormat?.replace('_', ' '),
    minPrice || maxPrice ? `€${minPrice || '0'}–€${maxPrice || '∞'}` : null,
  ].filter(Boolean).join(' · ') || null;

  const skillsSummary = interests.length > 0
    ? interests.map(i => i.skill_name).join(', ')
    : null;

  const goalsSummary = selectedGoals.size > 0
    ? Array.from(selectedGoals).map(v => GOAL_TAGS.find(g => g.value === v)?.label ?? v).join(', ')
    : null;

  const availabilitySummary = selectedAvailability.size > 0
    ? Array.from(selectedAvailability).map(v => AVAILABILITY_WINDOWS.find(a => a.value === v)?.label ?? v).join(', ')
    : null;

  // ── Save ──────────────────────────────────────────────────────────
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
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? 'Edit profile' : 'Create profile'}</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} disabled={isSaving}>
          {isSaving
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── About me ── */}
        <Accordion
          icon="account-outline"
          title="About me"
          summary={aboutSummary}
          isOpen={openSections.has('about')}
          onToggle={() => toggleSection('about')}
        >
          <View>
            <FieldLabel text="Bio" />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell mentors about yourself..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
          <View>
            <FieldLabel text="Location" />
            <LocationPicker value={location} onChange={setLocation} />
          </View>
          <View>
            <FieldLabel text="Languages I speak" />
            <LanguagePicker value={preferredLanguages} onChange={setPreferredLanguages} />
          </View>
        </Accordion>

        {/* ── Learning preferences ── */}
        <Accordion
          icon="school-outline"
          title="Learning preferences"
          summary={preferencesSummary}
          isOpen={openSections.has('preferences')}
          onToggle={() => toggleSection('preferences')}
        >
          <View>
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
          </View>
          <View>
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
          </View>
          <View>
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
          </View>
          <View>
            <FieldLabel text="Budget per session (€)" />
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
        </Accordion>

        {/* ── Skills ── */}
        <Accordion
          icon="lightning-bolt-outline"
          title="Skills I want to learn"
          summary={skillsSummary}
          isOpen={openSections.has('skills')}
          onToggle={() => toggleSection('skills')}
        >
          <View>
            {interests.map(interest => (
              <View key={interest.skill_id} style={styles.interestCard}>
                <View style={styles.interestCardHeader}>
                  <Text style={styles.interestSkillName}>{interest.skill_name}</Text>
                  <TouchableOpacity onPress={() => removeInterest(interest.skill_id)}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.levelRow}>
                  <View style={styles.levelField}>
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
                  <View style={styles.levelField}>
                    <Text style={styles.levelLabel}>Target level</Text>
                    <View style={styles.chipsRow}>
                      {EXPERIENCE_LEVELS
                        .filter(level => {
                          if (!interest.current_level) return true;
                          return EXPERIENCE_LEVELS.indexOf(level) > EXPERIENCE_LEVELS.indexOf(interest.current_level);
                        })
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
                        ))
                      }
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Accordion>

        {/* ── Goals ── */}
        <Accordion
          icon="target"
          title="Learning goals"
          summary={goalsSummary}
          isOpen={openSections.has('goals')}
          onToggle={() => toggleSection('goals')}
        >
          <View>
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
          </View>
          <View>
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
        </Accordion>

        {/* ── Availability ── */}
        <Accordion
          icon="clock-outline"
          title="Availability"
          summary={availabilitySummary}
          isOpen={openSections.has('availability')}
          onToggle={() => toggleSection('availability')}
        >
          <View>
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
        </Accordion>

      </ScrollView>
    </View>
  );
};

export default EditLearnerProfileScreen;