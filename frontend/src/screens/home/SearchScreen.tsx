import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { MentorProfile, Category, SearchFilters } from '../../types/Mentor';
import { searchMentors, getCategories, getRandomMentor } from '../../services/mentorService';
import { RootStackParamList } from '../../navigation/types';
import MentorCard from '../../components/mentor/MentorCard';

type SearchNavProp = NativeStackNavigationProp<RootStackParamList>;
type SearchRouteProp = RouteProp<RootStackParamList, 'Search'>;

const SESSION_FORMAT_OPTIONS = [
  { label: 'Any format', value: null },
  { label: 'Online', value: 'online' },
  { label: 'In person', value: 'in_person' },
  { label: 'Both', value: 'both' },
];

const PRICE_PRESETS = [
  { label: 'Any price', min: null as number | null, max: null as number | null },
  { label: 'Under €25', min: null as number | null, max: 25 as number | null },
  { label: '€25 – €50', min: 25 as number | null, max: 50 as number | null },
  { label: '€50+', min: 50 as number | null, max: null as number | null },
];

const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavProp>();
  const route = useRoute<SearchRouteProp>();

  const [query, setQuery] = useState(route.params?.query ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<MentorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiceLoading, setIsDiceLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    route.params?.category_id ?? null
  );
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(PRICE_PRESETS[0]);

  const queryRef = useRef(query);
  const categoryIdRef = useRef(selectedCategoryId);
  const formatRef = useRef(selectedFormat);
  const priceRef = useRef(selectedPrice);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { queryRef.current = query; }, [query]);
  useEffect(() => { categoryIdRef.current = selectedCategoryId; }, [selectedCategoryId]);
  useEffect(() => { formatRef.current = selectedFormat; }, [selectedFormat]);
  useEffect(() => { priceRef.current = selectedPrice; }, [selectedPrice]);

  const runSearch = async () => {
    setIsLoading(true);
    try {
      const filters: Partial<SearchFilters> = {};
      if (queryRef.current.trim()) filters.skill = queryRef.current.trim();
      if (categoryIdRef.current != null) filters.category_id = categoryIdRef.current;
      if (formatRef.current) filters.session_format = formatRef.current;
      if (priceRef.current.min != null) filters.min_price = priceRef.current.min;
      if (priceRef.current.max != null) filters.max_price = priceRef.current.max;
      const data = await searchMentors(filters);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    runSearch();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(runSearch, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, selectedCategoryId, selectedFormat, selectedPrice]);

  const handleDice = async () => {
    setIsDiceLoading(true);
    try {
      const mentor = await getRandomMentor();
      navigation.navigate('MentorProfile', { mentorId: mentor.id });
    } catch {
      // no mentors available
    } finally {
      setIsDiceLoading(false);
    }
  };

  const handleCategorySelect = (id: number | null) => {
    setSelectedCategoryId(prev => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategoryId(null);
    setSelectedFormat(null);
    setSelectedPrice(PRICE_PRESETS[0]);
  };

  const activeFilterCount = [
    selectedCategoryId !== null,
    selectedFormat !== null,
    selectedPrice !== PRICE_PRESETS[0],
  ].filter(Boolean).length;

  const renderMentorItem = ({ item }: { item: MentorProfile }) => (
    <View style={styles.cardWrap}>
      <MentorCard
        mentor={item}
        onPress={() => navigation.navigate('MentorProfile', { mentorId: item.id })}
        matchReasons={item.match_reasons}
        matchScore={item.relevance_score != null ? Math.round(item.relevance_score) : undefined}
      />
    </View>
  );

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a mentor</Text>
        <TouchableOpacity
          style={styles.diceButton}
          onPress={handleDice}
          activeOpacity={0.8}
          disabled={isDiceLoading}
        >
          {isDiceLoading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <MaterialCommunityIcons name="dice-multiple" size={22} color={Colors.primary} />
          }
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} style={styles.searchIconEl} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search skills, topics..."
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={runSearch}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={activeFilterCount > 0 ? Colors.primary : Colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, selectedCategoryId === null && styles.chipActive]}
            onPress={() => handleCategorySelect(null)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, selectedCategoryId === null && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategoryId === cat.id && styles.chipActive]}
              onPress={() => handleCategorySelect(cat.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active filter summary */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersText} numberOfLines={1}>
            {[
              selectedCategory?.name,
              selectedFormat?.replace('_', ' '),
              selectedPrice !== PRICE_PRESETS[0] ? selectedPrice.label : null,
            ].filter(Boolean).join(' · ')}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => String(item.id)}
        renderItem={renderMentorItem}
        numColumns={2}
        key="two-col"
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !isLoading ? (
            <Text style={styles.resultsCount}>
              {results.length === 0
                ? 'No mentors found'
                : `${results.length} mentor${results.length !== 1 ? 's' : ''}`}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Finding mentors...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={52}
                color={Colors.textSecondary}
                style={{ marginBottom: Spacing.md }}
              />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or searching something different.
              </Text>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Filter modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Session format</Text>
            <View style={styles.optionsRow}>
              {SESSION_FORMAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.optionChip, selectedFormat === opt.value && styles.optionChipActive]}
                  onPress={() => setSelectedFormat(opt.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionChipText, selectedFormat === opt.value && styles.optionChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionTitle}>Price range</Text>
            <View style={styles.optionsRow}>
              {PRICE_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.optionChip, selectedPrice === preset && styles.optionChipActive]}
                  onPress={() => setSelectedPrice(preset)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionChipText, selectedPrice === preset && styles.optionChipTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => { clearFilters(); setShowFilters(false); }}
            >
              <Text style={styles.resetButtonText}>Reset all filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  diceButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchIconEl: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, color: Colors.textLight, fontWeight: '900' },

  chipsWrapper: {
    height: 52,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipsRow: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  chip: {
    height: 34,
    minWidth: 64,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: Colors.textLight },

  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginRight: Spacing.md,
  },
  clearFiltersText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cardWrap: { flex: 1, marginBottom: Spacing.sm },
  columnWrapper: { gap: Spacing.sm },

  loadingWrap: { alignItems: 'center', paddingTop: Spacing.xxl },
  loadingText: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  clearButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  clearButtonText: { color: Colors.textLight, fontWeight: '900', fontSize: FontSize.sm },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  modalClose: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '900' },
  modalContent: { padding: Spacing.lg, gap: Spacing.sm },
  filterSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  optionChipTextActive: { color: Colors.textLight },
  resetButton: {
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  resetButtonText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.error },
});

export default SearchScreen;