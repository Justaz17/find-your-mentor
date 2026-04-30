import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Switch,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { getMyMentorProfile, createOrUpdateMentorProfile } from '../../services/mentorService';
import { getCategories } from '../../services/mentorService';
import { Category } from '../../types/Mentor';
import { RootStackParamList } from '../../navigation/types';
import LocationPicker from '../../components/common/LocationPicker';
import LanguagePicker from '../../components/common/LanguagePicker';
import { styles } from '../../styles/MentorEditProfileScreen.styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const BIO_MAX = 500;

const SESSION_FORMATS = [
  { value: 'online', label: 'Online', icon: 'laptop', desc: 'Video calls & screen sharing' },
  { value: 'in_person', label: 'In Person', icon: 'account-group-outline', desc: 'Meet at an agreed location' },
  { value: 'both', label: 'Both', icon: 'swap-horizontal', desc: 'Flexible for the learner' },
];

const MentorEditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  // Form state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState('');
  const [sessionFormat, setSessionFormat] = useState('online');
  const [skills, setSkills] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Preserved fields
  const [hourlyRate, setHourlyRate] = useState(0);
  const [yearsExperience, setYearsExperience] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState('');

  // Skill search & browse
  const [categories, setCategories] = useState<Category[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, cats] = await Promise.all([
          getMyMentorProfile(),
          getCategories(),
        ]);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
        setBio(profile.bio || '');
        setLocation(profile.location || '');
        setLanguages(profile.languages || '');
        setSessionFormat(profile.session_format || 'online');
        setSkills(profile.skills.map(s => s.name));
        setIsVisible(profile.is_visible);
        setHourlyRate(profile.hourly_rate || 0);
        setYearsExperience(profile.years_experience ?? undefined);
        setTags(profile.tags || '');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load profile');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // All skills flattened for search
  const allSkills = useMemo(() => {
    return categories.flatMap(cat =>
      cat.skills.map(s => ({ id: s.id, name: s.name, category: cat.name, categoryId: cat.id }))
    );
  }, [categories]);

  // Search results
  const searchResults = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return [];
    return allSkills
      .filter(s =>
        !skills.includes(s.name) &&
        (s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [skillSearch, allSkills, skills]);

  // Skills for the active category tab (excluding already added)
  const categorySkills = useMemo(() => {
    if (!activeCategory) return [];
    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return [];
    return cat.skills.filter(s => !skills.includes(s.name));
  }, [activeCategory, categories, skills]);

  const isSearching = skillSearch.trim().length > 0;

  const addSkill = (skillName: string) => {
    if (skills.some(s => s.toLowerCase() === skillName.toLowerCase())) return;
    setSkills(prev => [...prev, skillName]);
    setSkillSearch('');
  };

  const removeSkill = (skillName: string) => {
    setSkills(prev => prev.filter(s => s !== skillName));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createOrUpdateMentorProfile({
        bio: bio.trim(),
        hourly_rate: hourlyRate,
        skills,
        is_visible: isVisible,
        years_experience: yearsExperience,
        languages: languages.trim() || undefined,
        session_format: sessionFormat,
        location: location.trim() || undefined,
        tags: tags || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail ?? 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
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

        {/* ── Bio ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionHint}>Tell learners about yourself and your teaching style</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={v => v.length <= BIO_MAX && setBio(v)}
            placeholder="What do you do and what can you teach?"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={5}
          />
          <Text style={[
            styles.charCount,
            bio.length > BIO_MAX * 0.9 && { color: Colors.error },
          ]}>
            {bio.length}/{BIO_MAX}
          </Text>
        </View>

        {/* ── Location & Languages ──────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & languages</Text>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Location</Text>
            <LocationPicker value={location} onChange={setLocation} />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Languages</Text>
            <LanguagePicker value={languages} onChange={setLanguages} />
          </View>
        </View>

        {/* ── Skills ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & expertise</Text>
          <Text style={styles.sectionHint}>These power your match score with learners</Text>

          {/* Current skills */}
          {skills.length > 0 && (
            <View style={styles.chipsRow}>
              {skills.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => removeSkill(skill)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Search input */}
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={skillSearch}
              onChangeText={setSkillSearch}
              placeholder="Search skills..."
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
            />
            {skillSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSkillSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results — shown when typing */}
          {isSearching && searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map(skill => (
                <TouchableOpacity
                  key={skill.id}
                  style={styles.searchResultItem}
                  onPress={() => addSkill(skill.name)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultName}>{skill.name}</Text>
                    <Text style={styles.searchResultCategory}>{skill.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isSearching && searchResults.length === 0 && (
            <Text style={styles.noResults}>No matching skills found</Text>
          )}

          {/* Category tabs + browse — shown when NOT searching */}
          {!isSearching && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabs}
                style={styles.categoryTabsScroll}
              >
                {categories.map(cat => {
                  const active = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryTab, active && styles.categoryTabActive]}
                      onPress={() => setActiveCategory(cat.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Skills for selected category */}
              {categorySkills.length > 0 ? (
                <View style={styles.browseChipsRow}>
                  {categorySkills.map(skill => (
                    <TouchableOpacity
                      key={skill.id}
                      style={styles.browseChip}
                      onPress={() => addSkill(skill.name)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="plus" size={12} color={Colors.primary} />
                      <Text style={styles.browseChipText}>{skill.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noResults}>All skills in this category added</Text>
              )}
            </>
          )}
        </View>

        {/* ── Session format ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session format</Text>
          <View style={{ gap: Spacing.sm }}>
            {SESSION_FORMATS.map(f => {
              const active = sessionFormat === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.formatCard, active && styles.formatCardActive]}
                  onPress={() => setSessionFormat(f.value)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.formatIcon, active && styles.formatIconActive]}>
                    <MaterialCommunityIcons
                      name={f.icon as any}
                      size={22}
                      color={active ? '#fff' : Colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formatLabel, active && styles.formatLabelActive]}>
                      {f.label}
                    </Text>
                    <Text style={styles.formatDesc}>{f.desc}</Text>
                  </View>
                  {active && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Visibility ─────────────────────────────────────────── */}
        <View style={styles.visibilityCard}>
          <View style={styles.visibilityLeft}>
            <MaterialCommunityIcons
              name={isVisible ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={isVisible ? Colors.primary : Colors.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.visibilityTitle}>Profile visible</Text>
              <Text style={styles.visibilitySub}>
                {isVisible
                  ? 'Learners can find and book you'
                  : 'Your profile is hidden from search'}
              </Text>
            </View>
          </View>
          <Switch
            value={isVisible}
            onValueChange={setIsVisible}
            trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
            thumbColor={isVisible ? Colors.primary : Colors.textSecondary}
          />
        </View>

      </ScrollView>
    </View>
  );
};

export default MentorEditProfileScreen;