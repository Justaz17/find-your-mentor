import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import { MentorProfile, Category, SearchFilters } from '../../types/Mentor';
import { searchMentors, getCategories, getRandomMentor } from '../../services/mentorService';
import { RootStackParamList } from '../../navigation/types';
import MentorCard from '../../components/mentor/MentorCard';
import { useAuth } from '../../context/AuthContext';
import { sl, styles } from '../../styles/SearchScreen.styles';

type SearchNavProp = NativeStackNavigationProp<RootStackParamList>;
type SearchRouteProp = RouteProp<RootStackParamList, 'Search'>;

const SESSION_FORMAT_OPTIONS = [
  { label: 'Any format', value: null },
  { label: 'Online', value: 'online' },
  { label: 'In person', value: 'in_person' },
  { label: 'Both', value: 'both' },
];

const PRICE_MIN = 0;
const PRICE_MAX = 150;
const PRICE_STEP = 5;
const SLIDER_WIDTH = Dimensions.get('window').width - Spacing.lg * 2 - 32;

// ── Dual handle price slider ──────────────────────────────────────────────
const PriceSlider = ({
  low, high, onChange,
}: {
  low: number; high: number; onChange: (l: number, h: number) => void;
}) => {
  const toPercent = (v: number) => (v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN);
  const toValue = (p: number) =>
    Math.round((PRICE_MIN + p * (PRICE_MAX - PRICE_MIN)) / PRICE_STEP) * PRICE_STEP;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const lowRef = useRef(low);
  const highRef = useRef(high);
  lowRef.current = low;
  highRef.current = high;

  const makePan = (handle: 'low' | 'high') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const pct = clamp(
          (handle === 'low' ? toPercent(lowRef.current) : toPercent(highRef.current)) +
            gs.dx / SLIDER_WIDTH,
          0, 1,
        );
        const val = toValue(pct);
        if (handle === 'low') {
          onChange(clamp(val, PRICE_MIN, highRef.current - PRICE_STEP), highRef.current);
        } else {
          onChange(lowRef.current, clamp(val, lowRef.current + PRICE_STEP, PRICE_MAX));
        }
      },
    });

  const lowPan = useRef(makePan('low')).current;
  const highPan = useRef(makePan('high')).current;

  const lowPct = toPercent(low) * 100;
  const highPct = toPercent(high) * 100;

  return (
    <View style={sl.wrap}>
      <View style={sl.labels}>
        <Text style={sl.labelText}>{low === PRICE_MIN ? 'Any' : `€${low}`}</Text>
        <Text style={sl.labelText}>{high >= PRICE_MAX ? `€${PRICE_MAX}+` : `€${high}`}</Text>
      </View>
      <View style={sl.track}>
        <View style={[sl.trackFill, { left: `${lowPct}%`, right: `${100 - highPct}%` }]} />
        <View {...lowPan.panHandlers} style={[sl.handle, { left: `${lowPct}%` }]}>
          <View style={sl.handleInner} />
        </View>
        <View {...highPan.panHandlers} style={[sl.handle, { left: `${highPct}%` }]}>
          <View style={sl.handleInner} />
        </View>
      </View>
      <View style={sl.ticks}>
        <Text style={sl.tickText}>€0</Text>
        <Text style={sl.tickText}>€50</Text>
        <Text style={sl.tickText}>€100</Text>
        <Text style={sl.tickText}>€150+</Text>
      </View>
    </View>
  );
};


// ── Main screen ───────────────────────────────────────────────────────────
const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavProp>();
  const route = useRoute<SearchRouteProp>();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState(route.params?.query ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<MentorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiceLoading, setIsDiceLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    route.params?.category_id != null ? [route.params.category_id] : []
  );
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [priceLow, setPriceLow] = useState(PRICE_MIN);
  const [priceHigh, setPriceHigh] = useState(PRICE_MAX);

  const incomingParamsRef = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doReset = () => {
    setQuery('');
    setSelectedCategoryIds([]);
    setSelectedFormat(null);
    setPriceLow(PRICE_MIN);
    setPriceHigh(PRICE_MAX);
  };

  // ── Consume incoming params from Home ─────────────────────────────────
  useEffect(() => {
    if (route.params?.category_id !== undefined) {
      setSelectedCategoryIds(route.params.category_id != null ? [route.params.category_id] : []);
    }
    if (route.params?.query !== undefined) {
      setQuery(route.params.query ?? '');
    }
    if (route.params?.category_id !== undefined || route.params?.query !== undefined) {
      incomingParamsRef.current = true;
      navigation.setParams({ category_id: undefined, query: undefined });
    }
  }, [route.params?.category_id, route.params?.query]);

  // ── Reset on focus (direct tab tap from another tab) ──────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (incomingParamsRef.current) {
        incomingParamsRef.current = false;
        return;
      }
      doReset();
    });
    return unsubscribe;
  }, [navigation]);

  // ── Reset on tabPress (already on Search tab) ─────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      doReset();
    });
    return unsubscribe;
  }, [navigation]);

  const runSearch = useCallback(async (
    q: string,
    categoryIds: number[],
    format: string | null,
    low: number,
    high: number,
  ) => {
    if (q.trim() && q.trim().length < 2) {
        setResults([]);
        return;
      }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const filters: Partial<SearchFilters> = {};
      if (q.trim()) filters.skill = q.trim();
      if (categoryIds.length > 0) filters.category_id = categoryIds[0];
      if (format) filters.session_format = format;
      if (low > PRICE_MIN) filters.min_price = low;
      if (high < PRICE_MAX) filters.max_price = high;
      const data = await searchMentors(filters);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    runSearch(query, selectedCategoryIds, selectedFormat, priceLow, priceHigh);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      runSearch(query, selectedCategoryIds, selectedFormat, priceLow, priceHigh);
    }, 500);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, selectedCategoryIds, selectedFormat, priceLow, priceHigh]);

  const handleCategoryToggle = (id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDice = async () => {
    setIsDiceLoading(true);
    try {
      const mentor = await getRandomMentor();
      navigation.navigate('MentorProfile', { mentorId: mentor.id });
    } catch {
    } finally {
      setIsDiceLoading(false);
    }
  };

  const isPriceFiltered = priceLow > PRICE_MIN || priceHigh < PRICE_MAX;
  const activeFilterCount = [
    selectedCategoryIds.length > 0,
    selectedFormat !== null,
    isPriceFiltered,
  ].filter(Boolean).length;

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...selectedCategoryIds.map(id => ({
      label: categories.find(c => c.id === id)?.name ?? String(id),
      onRemove: () => setSelectedCategoryIds(prev => prev.filter(c => c !== id)),
    })),
    ...(selectedFormat ? [{
      label: selectedFormat.replace('_', ' '),
      onRemove: () => setSelectedFormat(null),
    }] : []),
    ...(isPriceFiltered ? [{
      label: `€${priceLow} – ${priceHigh >= PRICE_MAX ? `€${PRICE_MAX}+` : `€${priceHigh}`}`,
      onRemove: () => { setPriceLow(PRICE_MIN); setPriceHigh(PRICE_MAX); },
    }] : []),
  ];

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Ambient bubbles */}
      <View style={styles.bgBubble1} pointerEvents="none" />
      <View style={styles.bgBubble2} pointerEvents="none" />
      <View style={styles.bgBubble3} pointerEvents="none" />

      {/* ── Top block  no background, bubbles show through ── */}
      <View style={styles.topBlock}>

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
              ? <ActivityIndicator size="small" color={Colours.primary} />
              : <MaterialCommunityIcons name="dice-multiple" size={22} color={Colours.primary} />
            }
          </TouchableOpacity>
        </View>

        {/* Search + filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colours.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search mentors, skills..."
              placeholderTextColor={Colours.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query, selectedCategoryIds, selectedFormat, priceLow, priceHigh)}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colours.textSecondary} />
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
              color={activeFilterCount > 0 ? Colours.primary : Colours.textSecondary}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category chips — multi-select */}
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[styles.chip, selectedCategoryIds.length === 0 && styles.chipActive]}
              onPress={() => setSelectedCategoryIds([])}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, selectedCategoryIds.length === 0 && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(cat => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => handleCategoryToggle(cat.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active filter chips; transparent, no background */}
        {activeChips.length > 0 && (
          <View style={styles.activeFiltersRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {activeChips.map((chip, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.activeChip}
                  onPress={chip.onRemove}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activeChipText}>{chip.label}</Text>
                  <MaterialCommunityIcons name="close" size={12} color={Colours.primary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={doReset} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Divider between top block and results */}
        <View style={styles.divider} />
      </View>

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
        ListFooterComponent={
          !isAuthenticated && results.length > 0 ? (
            <TouchableOpacity
              style={styles.joinBanner}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Auth', { initialTab: 'register', wantsMentor: false })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.joinBannerTitle}>Ready to level up?</Text>
                <Text style={styles.joinBannerSub}>Create a free account to book sessions</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colours.primary} />
            </TouchableOpacity>
          ) : null
        }
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
              <ActivityIndicator size="large" color={Colours.primary} />
              <Text style={styles.loadingText}>Finding mentors...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={52}
                color={Colours.textSecondary}
                style={{ marginBottom: Spacing.md }}
              />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or searching something different.
              </Text>
              <TouchableOpacity style={styles.clearButton} onPress={doReset}>
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
            <PriceSlider
              low={priceLow}
              high={priceHigh}
              onChange={(l, h) => { setPriceLow(l); setPriceHigh(h); }}
            />

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => { doReset(); setShowFilters(false); }}
            >
              <Text style={styles.resetButtonText}>Reset all filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default SearchScreen;