import { StyleSheet } from 'react-native';
import { Colours, Spacing, FontSize } from '../utils/constants';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colours.surface },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colours.surface,
  },

  // ── Header ────────────────────────────────────────────────────────────
  headerSurface: {
    backgroundColor: Colours.background,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 0,
  },
  headerLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colours.textSecondary,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  headerName: {
    fontWeight: '900',
    color: Colours.text,
    letterSpacing: -0.3,
  },
  switchButton: {
    borderRadius: 8,
  },
  switchButtonLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // ── Pending banner ────────────────────────────────────────────────────
  pendingBanner: {
    marginTop: Spacing.md,
    backgroundColor: Colours.primaryLight,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colours.primary + '30',
  },
  pendingText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colours.primary,
    flex: 1,
  },

  // ── Body ──────────────────────────────────────────────────────────────
  body: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Profile completion ────────────────────────────────────────────────
  completionCard: {
    borderRadius: 16,
    borderColor: Colours.primary + '30',
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  completionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colours.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTextWrap: {
    flex: 1,
  },
  completionTitle: {
    fontWeight: '900',
    color: Colours.primary,
  },
  completionSub: {
    color: Colours.textSecondary,
    fontWeight: '600',
  },
  completionPctWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colours.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionPctText: {
    fontWeight: '900',
    color: Colours.primary,
  },

  // ── Stats row ─────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderColor: Colours.border,
  },
  statCardContent: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  statValue: {
    fontWeight: '900',
    color: Colours.text,
  },
  statLabel: {
    textAlign: 'center',
    color: Colours.textSecondary,
    fontWeight: '700',
  },

  // ── Quick actions ─────────────────────────────────────────────────────
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colours.textSecondary,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  actionCard: {
    borderRadius: 16,
    borderColor: Colours.border,
    marginBottom: Spacing.sm,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colours.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    fontWeight: '800',
    color: Colours.text,
  },
  actionSub: {
    color: Colours.textSecondary,
    fontWeight: '600',
  },

  // ── Upcoming sessions ─────────────────────────────────────────────────
  sessionCard: {
    borderRadius: 16,
    borderColor: Colours.border,
    marginBottom: Spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    fontWeight: '900',
    color: Colours.text,
  },
  sessionService: {
    fontWeight: '700',
    color: Colours.primary,
  },
  sessionDate: {
    color: Colours.textSecondary,
    fontWeight: '600',
  },

  // ── Sign out ──────────────────────────────────────────────────────────
  signOutWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  signOutText: {
    color: Colours.error,
    fontWeight: '700',
  },
});