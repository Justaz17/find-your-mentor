import { StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  skipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  stepCounter: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  content: {
    padding: Spacing.lg,
  },

  stepHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },

  stepContent: { gap: Spacing.xs },

  fieldLabel: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  hint: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  chipTextActive: { color: Colors.textLight },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priceInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, gap: 6,
  },
  priceInput: { flex: 1, paddingVertical: 11, fontSize: FontSize.md, color: Colors.text, fontWeight: '600' },
  priceSeparator: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '700' },

  emptySkills: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptySkillsText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text },
  emptySkillsHint: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  interestCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  interestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestSkillName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text },
  levelRow: { gap: Spacing.sm },
  levelLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6 },

  addSkillButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  addSkillText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '800' },

  skillPicker: {
    backgroundColor: Colors.background,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm,
  },
  skillPickerCategory: {
    fontSize: FontSize.sm, fontWeight: '900', color: Colors.text,
    marginTop: Spacing.sm, marginBottom: 6,
  },
  skillPickerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.border,
  },
  skillPickerChipText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  nextButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '900', letterSpacing: -0.3 },
  skipStepBtn: { alignItems: 'center', paddingVertical: 4 },
  skipStepText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700' },
});
