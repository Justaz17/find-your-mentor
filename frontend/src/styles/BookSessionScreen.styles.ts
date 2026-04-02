import { StyleSheet } from 'react-native';
import { Colors, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  stepCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 18,
    borderColor: Colors.border,
  },
  stepTitle: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  warningText: {
    color: Colors.warning,
    fontWeight: '700',
  },
  warningSubtext: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  serviceName: {
    fontWeight: '700',
    color: Colors.text,
  },
  serviceDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  durationChip: {
    backgroundColor: Colors.background,
    borderRadius: 999,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  servicePrice: {
    fontWeight: '900',
    color: Colors.primary,
  },
  dateRow: {
    gap: 8,
    paddingVertical: Spacing.xs,
  },
  dateButton: {
    borderRadius: 12,
    borderColor: Colors.border,
  },
  dateButtonSelected: {
    borderColor: Colors.primary,
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    color: Colors.text,
    fontWeight: '700',
  },
  summaryPrice: {
    color: Colors.primary,
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
