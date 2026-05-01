import { StyleSheet } from 'react-native';
import { Colours, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colours.surface,
    padding: Spacing.lg,
  },
  loadingText: {
    color: Colours.textSecondary,
    marginTop: Spacing.sm,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colours.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Header
  headerCard: {
    backgroundColor: Colours.background,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  avatarLabel: {
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    fontWeight: '800',
    color: Colours.text,
    marginTop: Spacing.md,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  ratingText: {
    color: Colours.textSecondary,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  rate: {
    fontWeight: '900',
    color: Colours.primary,
    letterSpacing: -0.3,
  },
  rateLabel: {
    color: Colours.textSecondary,
  },

  // Section cards
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 18,
    borderColor: Colours.border,
  },
  sectionTitle: {
    fontWeight: '800',
    color: Colours.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },

  // Skills
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colours.primaryLight,
    borderRadius: 999,
  },
  chipText: {
    color: Colours.primary,
    fontWeight: '700',
  },

  // Bio
  bioText: {
    color: Colours.textSecondary,
    lineHeight: 24,
  },

  // Availability
  placeholderText: {
    color: Colours.textSecondary,
    fontStyle: 'italic',
  },

  // Reviews
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  writeReviewBtn: {
    borderRadius: 999,
    borderColor: Colours.primary,
  },
  reviewForm: {
    backgroundColor: Colours.surface,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewFormLabel: {
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.xs,
  },
  starInputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  reviewInput: {
    backgroundColor: Colours.background,
    marginBottom: Spacing.sm,
  },
  reviewFormError: {
    color: Colours.error,
    marginBottom: Spacing.sm,
  },
  reviewFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  reviewItem: {
    paddingVertical: Spacing.sm,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontWeight: '700',
    color: Colours.text,
  },
  reviewComment: {
    color: Colours.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  reviewDate: {
    color: Colours.textSecondary,
    marginTop: 4,
  },
  reviewDivider: {
    backgroundColor: Colours.border,
  },

  // Book button
  bookSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  bookButton: {
    borderRadius: 14,
  },
  bookButtonContent: {
    paddingVertical: 8,
  },
  bookButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
