import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../utils/constants';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  listContent: { paddingBottom: Spacing.xxl },

  // ── Bubbles ───────────────────────────────────────────────────────────
  bgBubble1: {
    position: 'absolute', top: -100, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.primaryLight, opacity: 0.85,
  },
  bgBubble2: {
    position: 'absolute', top: 320, right: -120,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: Colors.primary, opacity: 0.04,
  },
  bgBubble3: {
    position: 'absolute', top: 780, left: -100,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.primaryLight, opacity: 0.5,
  },
  bgBubble4: {
    position: 'absolute', top: 1200, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: Colors.primary, opacity: 0.03,
  },

  // ── Hero (shared wrap) ────────────────────────────────────────────────
  heroWrap: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },

  // Greeting sits just above the headline, small and muted
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: -4,
  },

  // ── Headline ──────────────────────────────────────────────────────────
  heroTitle: { lineHeight: 46 },
  heroTitleBlack: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  heroTitlePurple: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },

  // ── Guest only ────────────────────────────────────────────────────────
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '800' },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700' },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '800' },
  ctaRow: { flexDirection: 'row', gap: 10 },
  primaryCta: {
    flex: 1, flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryCtaText: { color: Colors.textLight, fontSize: FontSize.sm, fontWeight: '900' },
  secondaryCta: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  secondaryCtaText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '800' },
  mentorSkipLink: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  mentorSkipText: {
    fontSize: FontSize.xs, color: Colors.primary,
    fontWeight: '700', textDecorationLine: 'underline',
  },

  // ── Search ────────────────────────────────────────────────────────────
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16, paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1, paddingVertical: 13,
    fontSize: FontSize.md, color: Colors.text, fontWeight: '600',
  },

  // ── Find me a mentor ──────────────────────────────────────────────────
  findMentorBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOpacity: 0.35,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  findMentorBtnText: {
    color: '#fff', fontSize: FontSize.md,
    fontWeight: '900', letterSpacing: -0.3,
  },

  // ── Sections ──────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '900',
    color: Colors.text, letterSpacing: -0.4, marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    fontWeight: '600', marginBottom: Spacing.md,
  },

  // ── Section divider with centred label ────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionDividerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '900',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Categories grid ───────────────────────────────────────────────────
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  categoryGridItem: {
    width: '22%', alignItems: 'center', gap: 6,
  },
  categoryIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryGridLabel: {
    fontSize: 10, fontWeight: '700',
    color: Colors.text, textAlign: 'center', lineHeight: 13,
  },

  // ── Join banner ───────────────────────────────────────────────────────
  joinBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  joinBannerTitle: {
    fontSize: FontSize.md, fontWeight: '900',
    color: Colors.text, marginBottom: 2,
  },
  joinBannerSub: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600',
  },

  // ── Mentors scroll ────────────────────────────────────────────────────
  mentorsScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  mentorCardWrap: { width: 160 },

  loadingWrap: { height: 180, justifyContent: 'center', alignItems: 'center' },
  errorWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  errorText: { fontSize: FontSize.sm, color: Colors.error, marginBottom: Spacing.sm, fontWeight: '700' },
  retryBtn: {
    backgroundColor: Colors.error, borderRadius: 12,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  retryText: { color: Colors.textLight, fontSize: FontSize.sm, fontWeight: '900' },

  // ── How it works ─────────────────────────────────────────────────────
  howWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  howHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  howTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  howSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Each row: left card | centre node | right card
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
    position: 'relative',
  },
  stepSide: {
    flex: 1,
    paddingTop: 4,
  },
  stepSideEmpty: {
    // empty side — takes up space so node stays centred
  },
  stepNode: {
    width: 48,
    alignItems: 'center',
    paddingTop: 2,
    zIndex: 2,
  },
  stepNodeInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // Vertical connector line between nodes
  connector: {
    position: 'absolute',
    width: 2,
    top: 50,
    bottom: -50,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  connectorLeft: {
    left: '50%',
    marginLeft: -1 + (48 / 2) - 1, // align with node centre
  },
  connectorRight: {
    left: '50%',
    marginLeft: -1 + (48 / 2) - 1,
  },
  stepCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginHorizontal: 6,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  stepBody: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  howCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  howCtaText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // ── Profile completion card ──────────────────────────────────────────────
  completionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    gap: Spacing.sm,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  completionLeft: { flex: 1 },
  completionTitle: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 3,
  },
  completionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  completionPctWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  completionPct: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.primary,
  },
  completionTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  completionFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  completionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionCtaText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '800',
  },

  // ── Browse all ────────────────────────────────────────────────────────
  browseAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    marginTop: Spacing.lg,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  browseAllText: {
    fontSize: FontSize.md, fontWeight: '900',
    color: Colors.primary, letterSpacing: -0.2,
  },
});
