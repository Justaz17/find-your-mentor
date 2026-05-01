import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surface,
  },
  header: {
    backgroundColor: Colours.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colours.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colours.background,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colours.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colours.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  addButton: {
    backgroundColor: Colours.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colours.textLight,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: FontSize.hero,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.text,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colours.textSecondary,
    maxWidth: 280,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colours.surface,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colours.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colours.error,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colours.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  retryText: {
    color: Colours.textLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
