import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colours.background,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  cancelButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.error,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colours.text,
  },
  saveButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '23%',
    backgroundColor: Colours.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colours.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayButtonActive: {
    borderColor: Colours.primary,
    backgroundColor: Colours.primaryLight,
  },
  dayEmoji: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.xs,
  },
  dayButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colours.textSecondary,
  },
  dayButtonTextActive: {
    color: Colours.primary,
    fontWeight: '700',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colours.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  timeDisplay: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colours.text,
  },
  timeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeAdjustButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colours.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeAdjustText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colours.primary,
  },
  pickerButton: {
    backgroundColor: Colours.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.text,
  },
  summary: {
    backgroundColor: Colours.primaryLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colours.primary,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.xs,
  },
  summarySubtext: {
    fontSize: FontSize.sm,
    color: Colours.textSecondary,
  },
  infoBox: {
    backgroundColor: Colours.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colours.warning,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colours.text,
    fontWeight: '500',
  },
});
