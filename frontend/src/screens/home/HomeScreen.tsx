import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, CATEGORIES } from '../../utils/constants';
import { MentorProfile, Category } from '../../types/Mentor';
import { getMentors, getCategories, searchMentors } from '../../services/mentorService';
import { getMyLearnerProfile } from '../../services/learnerService';
import { LearnerProfile } from '../../types/Learner';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import MentorCard from '../../components/mentor/MentorCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search skills, mentors, topics..."
        placeholderTextColor={Colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
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
              : `${completionPct}% done — add ${missingFields[0]?.toLowerCase() ?? 'more info'} to improve matches`}
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
                <MaterialCommunityIcons name={step.icon as any} size={22} color={Colors.primary} />
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
        <Text style={styles.howCtaText}>Get started — it's free</Text>
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
            ? 'Personalised picks — refreshed each visit'
            : 'Highest rated by learners'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
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
          <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.primary} />
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
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  listContent: { paddingBottom: Spacing.xxl },

  // ── Bubbles ───────────────────────────────────────────────────────────
  bgBubble1: {
    position: 'absolute', top: -100, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.primaryLight, opacity: 0.85,
  },
  bgBubble2: {
    position: 'absolute', top: 320, right: -120,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: Colors.primary, opacity: 0.04,
  },
  bgBubble3: {
    position: 'absolute', top: 780, left: -100,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.primaryLight, opacity: 0.5,
  },
  bgBubble4: {
    position: 'absolute', top: 1200, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: Colors.primary, opacity: 0.03,
  },

  // ── Hero (shared wrap) ────────────────────────────────────────────────
  heroWrap: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },

  // Greeting sits just above the headline, small and muted
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: -4,
  },

  // ── Headline ──────────────────────────────────────────────────────────
  heroTitle: { lineHeight: 46 },
  heroTitleBlack: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  heroTitlePurple: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },

  // ── Guest only ────────────────────────────────────────────────────────
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '800' },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700' },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '800' },
  ctaRow: { flexDirection: 'row', gap: 10 },
  primaryCta: {
    flex: 1, flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryCtaText: { color: Colors.textLight, fontSize: FontSize.sm, fontWeight: '900' },
  secondaryCta: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  secondaryCtaText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '800' },
  mentorSkipLink: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  mentorSkipText: {
    fontSize: FontSize.xs, color: Colors.primary,
    fontWeight: '700', textDecorationLine: 'underline',
  },

  // ── Search ────────────────────────────────────────────────────────────
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16, paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1, paddingVertical: 13,
    fontSize: FontSize.md, color: Colors.text, fontWeight: '600',
  },

  // ── Find me a mentor ──────────────────────────────────────────────────
  findMentorBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOpacity: 0.35,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  findMentorBtnText: {
    color: '#fff', fontSize: FontSize.md,
    fontWeight: '900', letterSpacing: -0.3,
  },

  // ── Sections ──────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '900',
    color: Colors.text, letterSpacing: -0.4, marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    fontWeight: '600', marginBottom: Spacing.md,
  },

  // ── Section divider with centred label ────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionDividerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '900',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Categories grid ───────────────────────────────────────────────────
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  categoryGridItem: {
    width: '22%', alignItems: 'center', gap: 6,
  },
  categoryIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryGridLabel: {
    fontSize: 10, fontWeight: '700',
    color: Colors.text, textAlign: 'center', lineHeight: 13,
  },

  // ── Join banner ───────────────────────────────────────────────────────
  joinBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  joinBannerTitle: {
    fontSize: FontSize.md, fontWeight: '900',
    color: Colors.text, marginBottom: 2,
  },
  joinBannerSub: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600',
  },

  // ── Mentors scroll ────────────────────────────────────────────────────
  mentorsScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  mentorCardWrap: { width: 160 },

  loadingWrap: { height: 180, justifyContent: 'center', alignItems: 'center' },
  errorWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  errorText: { fontSize: FontSize.sm, color: Colors.error, marginBottom: Spacing.sm, fontWeight: '700' },
  retryBtn: {
    backgroundColor: Colors.error, borderRadius: 12,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  retryText: { color: Colors.textLight, fontSize: FontSize.sm, fontWeight: '900' },

  // ── How it works ─────────────────────────────────────────────────────
  howWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  howHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  howTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  howSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Each row: left card | centre node | right card
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
    position: 'relative',
  },
  stepSide: {
    flex: 1,
    paddingTop: 4,
  },
  stepSideEmpty: {
    // empty side — takes up space so node stays centred
  },
  stepNode: {
    width: 48,
    alignItems: 'center',
    paddingTop: 2,
    zIndex: 2,
  },
  stepNodeInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // Vertical connector line between nodes
  connector: {
    position: 'absolute',
    width: 2,
    top: 50,
    bottom: -50,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  connectorLeft: {
    left: '50%',
    marginLeft: -1 + (48 / 2) - 1, // align with node centre
  },
  connectorRight: {
    left: '50%',
    marginLeft: -1 + (48 / 2) - 1,
  },
  stepCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginHorizontal: 6,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  stepBody: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  howCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  howCtaText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // ── Profile completion card ──────────────────────────────────────────────
  completionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    gap: Spacing.sm,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  completionLeft: { flex: 1 },
  completionTitle: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 3,
  },
  completionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  completionPctWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  completionPct: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.primary,
  },
  completionTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  completionFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  completionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionCtaText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '800',
  },

  // ── Browse all ────────────────────────────────────────────────────────
  browseAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    marginTop: Spacing.lg,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  browseAllText: {
    fontSize: FontSize.md, fontWeight: '900',
    color: Colors.primary, letterSpacing: -0.2,
  },
});

export default HomeScreen;