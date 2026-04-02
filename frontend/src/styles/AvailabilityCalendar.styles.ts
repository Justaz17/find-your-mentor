import { StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/constants';

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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  calendarWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calendar: {
    borderRadius: 12,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  selectedLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectedDate: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
});
