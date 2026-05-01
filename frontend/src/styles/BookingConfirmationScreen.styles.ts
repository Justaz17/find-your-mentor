import { StyleSheet } from 'react-native';
import { Colours, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surface,
    paddingHorizontal: Spacing.lg,
  },
  pageTitle: {
    fontWeight: '800',
    color: Colours.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  sectionCard: {
    marginBottom: Spacing.md,
    borderRadius: 18,
    borderColor: Colours.border,
  },
  sectionTitle: {
    fontWeight: '800',
    color: Colours.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: Colours.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    color: Colours.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  detailPrice: {
    color: Colours.primary,
    fontWeight: '900',
  },
  divider: { backgroundColor: Colours.border },
  noteHint: {
    color: Colours.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  noteInput: { backgroundColor: Colours.background },
  charCount: {
    color: Colours.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  paymentStatus: {
    backgroundColor: Colours.primaryLight,
    borderRadius: 12,
    padding: Spacing.md,
  },
  paymentStatusText: {
    fontWeight: '700',
    color: Colours.text,
    marginBottom: 4,
  },
  paymentStatusHint: { color: Colours.textSecondary },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  policyGreen: { color: '#059669', fontWeight: '600' },
  policyAmber: { color: '#D97706', fontWeight: '600' },
  policyRed: { color: Colours.error, fontWeight: '600' },
  policyValue: { color: Colours.text, fontWeight: '700' },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colours.error,
  },
  errorText: {
    color: Colours.error,
    fontWeight: '700',
  },
  confirmSection: { marginBottom: Spacing.lg },
  confirmButton: { borderRadius: 14 },
  confirmButtonContent: { paddingVertical: 8 },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ── Success ───────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    backgroundColor: Colours.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colours.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colours.secondary,
  },
  successCheck: {
    fontSize: 32,
    color: Colours.secondary,
    fontWeight: '900',
  },
  successTitle: {
    fontWeight: '900',
    color: Colours.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  successText: {
    color: Colours.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  successCard: {
    width: '100%',
    borderRadius: 18,
    borderColor: Colours.border,
    marginBottom: Spacing.lg,
  },
  homeButton: { borderRadius: 14, width: '100%', marginBottom: Spacing.md },
  homeButtonContent: { paddingVertical: 8 },
  homeButtonLabel: { fontSize: 16, fontWeight: '800' },
  cancelNote: {
    color: Colours.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
