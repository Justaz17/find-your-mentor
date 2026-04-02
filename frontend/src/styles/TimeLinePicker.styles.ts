import { StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/constants';

const HOUR_LABEL_WIDTH = 56;

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  divider: {
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
  },
  durationLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  slotsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  scrollView: {
    maxHeight: 420,
  },
  gridRow: {
    flexDirection: 'row',
  },

  // Labels column
  labelsCol: {
    width: HOUR_LABEL_WIDTH,
    position: 'relative',
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  hourLabelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Track
  track: {
    position: 'relative',
  },

  // Layers
  unavailableBase: {
    backgroundColor: '#F5F5F5', // light grey = unavailable
  },
  availBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#E8F5E9', // light green = available
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5D6A7',
  },
  gridLineHour: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D0D0D0',
  },
  gridLineHalf: {
    position: 'absolute',
    left: 8,
    right: 0,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  snapDot: {
    position: 'absolute',
    left: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },

  // Service block
  serviceBlock: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  blockTimeLabelTop: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
  },
  blockCentre: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  blockDuration: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: FontSize.md,
  },
  blockHint: {
    color: Colors.textLight,
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  blockTimeLabelBottom: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'right',
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  slotTabsScroll: {
    backgroundColor: Colors.background,
  },
  slotTabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  slotTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  slotTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  slotTabText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  slotTabTextActive: {
    color: Colors.textLight,
  },
  emptyText: {
    padding: Spacing.lg,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
