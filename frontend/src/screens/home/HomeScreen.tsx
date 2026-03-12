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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, CATEGORIES } from '../../utils/constants';
import { MentorProfile,Category } from '../../types/Mentor';
import { getMentors,getCategories } from '../../services/mentorService';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import MentorCard from '../../components/mentor/MentorCard';
import CategoryCard from '../../components/common/CategoryCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();
  const { user, isAuthenticated } = useAuth();

  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  getCategories().then(setCategories).catch(() => {});
}, []);

  const fetchMentors = useCallback(async () => {
    try {
      setError(null);
      const data = await getMentors();
      setMentors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mentors');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
  const match = categories.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  navigation.navigate('Search', {
    category_id: match?.id ?? undefined,
    query: match ? undefined : categoryName,
  });
};

  const handleMentorPress = (mentorId: number) => {
    navigation.navigate('MentorProfile', { mentorId });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const popularTags = useMemo(() => ['Python', 'Fitness', 'Spanish', 'Guitar'], []);

  const ListHeader = (
    <View>
      {/* HERO */}
      <View style={[styles.heroWrap, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroBgTop} />
        <View style={styles.heroBgBottom} />

        <View style={styles.heroContent}>
          <Text style={styles.greeting}>
            {isAuthenticated ? `${getGreeting()}, ${user?.name}` : getGreeting()}
          </Text>

          <Text style={styles.heroTitle}>Find your next mentor</Text>

          <Text style={styles.heroSubtitle}>
            Book 1-on-1 sessions with people who’ve done it before.
          </Text>

          <View style={styles.searchCard}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills, mentors, topics..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <View style={styles.tagsRow}>
            <Text style={styles.tagsLabel}>Popular:</Text>
            {popularTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => {
                  setSearchQuery(tag);
                  // optional: auto-search
                  // handleSearch();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.primaryCta} activeOpacity={0.85}>
              <Text style={styles.primaryCtaText}>Browse mentors</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85}>
              <Text style={styles.secondaryCtaText}>Become a mentor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CATEGORIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse categories</Text>
        <Text style={styles.sectionSubtitle}>Explore mentors across fields</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              icon={category.icon}
              color={category.color}
              onPress={() => handleCategoryPress(category.name)}
            />
          ))}
        </ScrollView>
      </View>

      {/* TOP MENTORS HEADER */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Top mentors</Text>
            <Text style={styles.sectionSubtitle}>Highly rated by learners</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.viewAllText}>View all →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: MentorProfile }) => (
    <View style={styles.mentorRow}>
      <MentorCard mentor={item} onPress={() => handleMentorPress(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={!isLoading && !error ? mentors : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.statesWrap}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading mentors...</Text>
              </View>
            )}

            {!!error && !isLoading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMentors} activeOpacity={0.85}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !error && mentors.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-school-outline" size={52} color={Colors.textSecondary} style={{ marginBottom: Spacing.md }} />
                <Text style={styles.emptyTitle}>No mentors yet</Text>
                <Text style={styles.emptyText}>Be the first to create a mentor profile!</Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  listContent: {
    paddingBottom: Spacing.xxl,
  },

  // HERO
  heroWrap: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.background,
},
  heroBgTop: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: Colors.primaryLight,
    opacity: 0.95,
  },
  heroBgBottom: {
    position: 'absolute',
    bottom: -150,
    right: -110,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  heroContent: {
    gap: 8,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.6,
    lineHeight: 38,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },

  // SEARCH
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  searchIcon: { fontSize: 18, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },

  // TAGS
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginRight: 2,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '800',
  },

  // CTA
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  primaryCta: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryCtaText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  secondaryCta: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryCtaText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  // SECTIONS
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '900',
    marginTop: 6,
  },

  categoriesContainer: {
  paddingTop: Spacing.sm,
  paddingRight: Spacing.lg,
},

  // MENTOR LIST
  mentorRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // STATES
  statesWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '800',
  },
  retryButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    color: Colors.textLight,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: { fontSize: 46, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default HomeScreen;
