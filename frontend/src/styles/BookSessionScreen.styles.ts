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
  errorText: {
    color: Colours.textSecondary,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colours.border,
  },
  progressDotActive: {
    backgroundColor: Colours.primary,
  },
  stepCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 18,
    borderColor: Colours.border,
  },
  stepTitle: {
    fontWeight: '800',
    color: Colours.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  emptyText: {
    color: Colours.textSecondary,
    fontStyle: 'italic',
  },
  warningText: {
    color: Colours.warning,
    fontWeight: '700',
  },
  warningSubtext: {
    color: Colours.textSecondary,
    marginTop: Spacing.xs,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colours.surface,
    borderRadius: 14,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colours.border,
  },
  serviceCardSelected: {
    borderColor: Colours.primary,
    backgroundColor: Colours.primaryLight,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  serviceName: {
    fontWeight: '700',
    color: Colours.text,
  },
  serviceDesc: {
    color: Colours.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  durationChip: {
    backgroundColor: Colours.background,
    borderRadius: 999,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colours.textSecondary,
  },
  servicePrice: {
    fontWeight: '900',
    color: Colours.primary,
  },
  dateRow: {
    gap: 8,
    paddingVertical: Spacing.xs,
  },
  dateButton: {
    borderRadius: 12,
    borderColor: Colours.border,
  },
  dateButtonSelected: {
    borderColor: Colours.primary,
  },
  dateLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  dateLabelSelected: {
    fontWeight: '800',
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colours.background,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colours.border,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: Colours.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    color: Colours.text,
    fontWeight: '700',
  },
  summaryPrice: {
    color: Colours.primary,
    fontWeight: '900',
  },
  continueButton: {
    borderRadius: 14,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
