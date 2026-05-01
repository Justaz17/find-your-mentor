import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colours.surface },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colours.surface,
  },

  // ── Header ────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colours.background,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '900', color: Colours.text },
  cancelText: { fontSize: FontSize.md, color: Colours.textSecondary, fontWeight: '700' },
  saveText: { fontSize: FontSize.md, color: Colours.primary, fontWeight: '900' },

  content: { padding: Spacing.lg },

  // ── Sections ──────────────────────────────────────────────────────────
  section: {
    backgroundColor: Colours.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colours.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colours.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },

  // ── Fields ────────────────────────────────────────────────────────────
  fieldWrap: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colours.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colours.text,
    fontWeight: '600',
  },
  textArea: { minHeight: 120, textAlignVertical: 'top', lineHeight: 22 },
  charCount: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Current skills ────────────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colours.primaryLight,
    borderWidth: 1,
    borderColor: Colours.border,
  },
  skillChipText: {
    fontSize: FontSize.xs,
    color: Colours.primary,
    fontWeight: '700',
  },

  // ── Skill search ──────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FontSize.sm,
    color: Colours.text,
    fontWeight: '600',
  },
  searchResults: {
    backgroundColor: Colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  searchResultName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colours.text,
  },
  searchResultCategory: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  noResults: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // ── Category tabs ─────────────────────────────────────────────────────
  categoryTabsScroll: {
    marginBottom: Spacing.sm,
  },
  categoryTabs: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colours.surface,
    borderWidth: 1,
    borderColor: Colours.border,
  },
  categoryTabActive: {
    backgroundColor: Colours.primary,
    borderColor: Colours.primary,
  },
  categoryTabText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colours.text,
  },
  categoryTabTextActive: {
    color: '#fff',
  },

  // ── Browse chips (skills for selected category) ───────────────────────
  browseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  browseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colours.primaryLight,
    borderWidth: 1,
    borderColor: Colours.border,
  },
  browseChipText: {
    fontSize: FontSize.xs,
    color: Colours.primary,
    fontWeight: '700',
  },

  // ── Session format ────────────────────────────────────────────────────
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colours.surface,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colours.border,
  },
  formatCardActive: {
    backgroundColor: Colours.primaryLight,
    borderColor: Colours.primary,
  },
  formatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colours.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatIconActive: {
    backgroundColor: Colours.primary,
  },
  formatLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colours.text,
  },
  formatLabelActive: {
    color: Colours.primary,
  },
  formatDesc: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },

  // ── Visibility ────────────────────────────────────────────────────────
  visibilityCard: {
    backgroundColor: Colours.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colours.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  visibilityTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colours.text,
  },
  visibilitySub: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});