import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colours, Spacing, FontSize, CATEGORIES } from '../../utils/constants';
import { MentorProfile, Category } from '../../types/Mentor';
import { getMentors, getCategories, searchMentors } from '../../services/mentorService';
import { getMyLearnerProfile } from '../../services/learnerService';
import { LearnerProfile } from '../../types/Learner';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import MentorCard from '../../components/mentor/MentorCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../../styles/HomeScreen.styles';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

// Shuffle array — different order each mount
const shuffleSlice = (arr: MentorProfile[], count: number): MentorProfile[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();
  const { user, isAuthenticated } = useAuth();

  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      if (!isAuthenticated) return;
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
      console.error('Error fetching mentors:', err);
      setError(err.message || 'Failed to load mentors');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMentors();
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigation.navigate('Search', { query: q });
  };

  const handleCategoryPress = (categoryName: string) => {
    const match = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    navigation.navigate('Search', {
      category_id: match?.id ?? undefined,
      query: match ? undefined : categoryName,
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] ?? null;
  const popularTags = useMemo(() => ['Python', 'Fitness', 'Spanish', 'Guitar'], []);

  // Rotate top 6 mentors randomly on each mount
  const rotatedMentors = useMemo(
    () => shuffleSlice(mentors.slice(0, 6), 6),
    [mentors.length] // only re-shuffle when mentor list changes, not on every render
  );

  // ─── Shared headline ──────────────────────────────────────────────────
  const Headline = (
    <Text style={styles.heroTitle}>
      <Text style={styles.heroTitleBlack}>Find Your{'\n'}</Text>
      <Text style={styles.heroTitlePurple}>Mentor.</Text>
    </Text>
  );

  // ─── Shared search bar ────────────────────────────────────────────────
  const SearchBar = (
    <View style={styles.searchCard}>
      <MaterialCommunityIcons name="magnify" size={20} color={Colours.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search skills, mentors, topics..."
        placeholderTextColor={Colours.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialCommunityIcons name="close-circle" size={18} color={Colours.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Profile completion card ────────────────────────────────────────────
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
    const missing = fields.filter(f => !f.done).map(f => f.label);
    return { pct: Math.round((done / fields.length) * 100), missing };
  };

  const { pct: completionPct, missing: missingFields } = getProfileCompletion();
  const showCompletionCard = isAuthenticated && profileChecked && completionPct < 100;

  const ProfileCompletionCard = showCompletionCard ? (
    <TouchableOpacity
      style={styles.completionCard}
      activeOpacity={0.88}
      onPress={() => navigation.navigate('EditLearnerProfile' as never, { profile: learnerProfile ?? undefined } as never)}
    >
      <View style={styles.completionTop}>
        <View style={styles.completionLeft}>
          <Text style={styles.completionTitle}>
            {completionPct === 0 ? 'Set up your profile' : 'Complete your profile'}
          </Text>
          <Text style={styles.completionSub}>
            {completionPct === 0
              ? 'Get better mentor matches by telling us about yourself'
              : `${completionPct}% done - add ${missingFields[0]?.toLowerCase() ?? 'more info'} to improve matches`}
          </Text>
        </View>
        <View style={styles.completionPctWrap}>
          <Text style={styles.completionPct}>{completionPct}%</Text>
        </View>
      </View>
      <View style={styles.completionTrack}>
        <View style={[styles.completionFill, { width: `${completionPct}%` as any }]} />
      </View>
    </TouchableOpacity>
  ) : null;

  // ─── Auth hero ────────────────────────────────────────────────────────
  const AuthHero = (
    <View style={[styles.heroWrap, { paddingTop: insets.top + Spacing.lg }]}>
      <Text style={styles.greeting}>
        {getGreeting()}{firstName ? `, ${firstName}` : ''}.
      </Text>
      {Headline}
      {SearchBar}
      <TouchableOpacity
        style={styles.findMentorBtn}
        onPress={() => navigation.navigate('Search', searchQuery.trim() ? { query: searchQuery.trim() } : {})}
        activeOpacity={0.88}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fff" />
        <Text style={styles.findMentorBtnText}>Find me a mentor</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Guest hero ───────────────────────────────────────────────────────
  const GuestHero = (
    <View style={[styles.heroWrap, { paddingTop: insets.top + Spacing.lg }]}>
      {Headline}

      

      {SearchBar}

      <TouchableOpacity
        style={styles.findMentorBtn}
        onPress={() => navigation.navigate('Search', {})}
        activeOpacity={0.88}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fff" />
        <Text style={styles.findMentorBtnText}>Find me a mentor</Text>
      </TouchableOpacity>

    </View>
  );

  // ─── How it works — zigzag steps (guest only) ───────────────────────
  const STEPS = [
    {
      number: '01',
      title: 'Create your account',
      body: 'Sign up free in under a minute. No credit card needed.',
      icon: 'account-plus-outline',
      align: 'left',
    },
    {
      number: '02',
      title: 'Find your mentor',
      body: 'Browse by skill, category, or let us match you instantly.',
      icon: 'magnify',
      align: 'right',
    },
    {
      number: '03',
      title: 'Book a session',
      body: 'Pick a time that works for you. We handle the rest.',
      icon: 'calendar-check-outline',
      align: 'left',
    },
  ];

  const HowItWorks = !isAuthenticated ? (
    <View style={styles.howWrap}>
      {/* Header */}
      <View style={styles.howHeader}>
        <Text style={styles.howTitle}>How it works</Text>
        <Text style={styles.howSubtitle}>Three steps to your first session</Text>
      </View>

      {STEPS.map((step, i) => {
        const isRight = step.align === 'right';
        return (
          <View key={step.number} style={styles.stepRow}>
            {/* Connector line — not on last step */}
            {i < STEPS.length - 1 && (
              <View style={[styles.connector, isRight ? styles.connectorRight : styles.connectorLeft]} />
            )}

            {/* Left side */}
            <View style={[styles.stepSide, isRight && styles.stepSideEmpty]}>
              {!isRight && (
                <View style={styles.stepCard}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              )}
            </View>

            {/* Icon node in the centre */}
            <View style={styles.stepNode}>
              <View style={styles.stepNodeInner}>
                <MaterialCommunityIcons name={step.icon as any} size={22} color={Colours.primary} />
              </View>
            </View>

            {/* Right side */}
            <View style={[styles.stepSide, !isRight && styles.stepSideEmpty]}>
              {isRight && (
                <View style={styles.stepCard}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.howCta}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('Auth', { initialTab: 'register', wantsMentor: false })}
      >
        <Text style={styles.howCtaText}>Get started, it's free!</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  ) : null;

  // ─── Category section ─────────────────────────────────────────────────
  const CategoriesSection = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Browse by category</Text>
      <Text style={styles.sectionSubtitle}>Explore mentors across fields</Text>
      <View style={styles.categoriesGrid}>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.name}
            style={styles.categoryGridItem}
            onPress={() => handleCategoryPress(category.name)}
            activeOpacity={0.82}
          >
            <View style={[styles.categoryIconWrap, { backgroundColor: category.color + '18' }]}>
              <MaterialCommunityIcons name={category.icon as any} size={26} color={category.color} />
            </View>
            <Text style={styles.categoryGridLabel} numberOfLines={2}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── Recommended / Top mentors ────────────────────────────────────────
  const MentorsSection = (
    <View>
      {/* Section divider */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerLine} />
        <Text style={styles.sectionDividerLabel}>
          {isAuthenticated ? 'Recommended for you' : 'Top mentors'}
        </Text>
        <View style={styles.sectionDividerLine} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          {isAuthenticated
            ? 'Personalised picks - refreshed each visit'
            : 'Highest rated by learners'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colours.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMentors}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorsScroll}
          >
            {rotatedMentors.map(mentor => (
              <View key={mentor.id} style={styles.mentorCardWrap}>
                <MentorCard
                  mentor={mentor}
                  onPress={() => navigation.navigate('MentorProfile', { mentorId: mentor.id })}
                  matchReasons={mentor.match_reasons}
                  matchScore={
                    isAuthenticated && mentor.relevance_score != null
                      ? Math.round(mentor.relevance_score)
                      : undefined
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.browseAllBtn}
          onPress={() => navigation.navigate('Search', {})}
          activeOpacity={0.88}
        >
          <Text style={styles.browseAllText}>Browse all mentors</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={Colours.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Join banner removed — lives on Search screen instead

  const ListContent = (
    <View>
      {isAuthenticated ? AuthHero : GuestHero}
      {ProfileCompletionCard}
      {HowItWorks}
      {CategoriesSection}
      {MentorsSection}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.bgBubble1} pointerEvents="none" />
      <View style={styles.bgBubble2} pointerEvents="none" />
      <View style={styles.bgBubble3} pointerEvents="none" />
      <View style={styles.bgBubble4} pointerEvents="none" />

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListContent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colours.primary} />
        }
      />
    </View>
  );
};

export default HomeScreen;