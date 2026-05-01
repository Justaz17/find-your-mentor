import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.background,
  },

  // ── Dismiss ───────────────────────────────────────────────────────────
  dismissBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colours.surface,
    borderWidth: 1,
    borderColor: Colours.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },

  // ── Branding ──────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colours.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colours.textLight,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  appTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.xs,
  },
  appSubtitle: {
    fontSize: FontSize.md,
    color: Colours.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colours.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: { backgroundColor: Colours.primary },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.textSecondary,
  },
  activeTabText: { color: Colours.textLight },

  // ── Form ──────────────────────────────────────────────────────────────
  formContainer: { flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colours.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colours.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colours.text,
    backgroundColor: Colours.background,
  },

  // ── Error ─────────────────────────────────────────────────────────────
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colours.error,
  },
  errorText: {
    color: Colours.error,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },

  // ── Mentor checkbox ───────────────────────────────────────────────────
  mentorCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colours.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colours.primary + '30',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colours.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: Colours.primary,
    borderColor: Colours.primary,
  },
  mentorCheckText: { flex: 1 },
  mentorCheckLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colours.text,
    marginBottom: 2,
  },
  mentorCheckSub: {
    fontSize: FontSize.xs,
    color: Colours.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },

  // ── Submit ────────────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: Colours.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: {
    color: Colours.textLight,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  // ── Toggle ────────────────────────────────────────────────────────────
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  toggleText: {
    fontSize: FontSize.sm,
    color: Colours.textSecondary,
  },
  toggleLink: {
    fontSize: FontSize.sm,
    color: Colours.primary,
    fontWeight: '600',
  },
});
