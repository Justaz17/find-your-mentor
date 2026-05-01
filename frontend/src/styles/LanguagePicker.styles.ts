import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colours.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colours.text,
    fontWeight: '600',
  },
  placeholder: { color: Colours.textSecondary },

  modal: { flex: 1, backgroundColor: Colours.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colours.text,
  },
  doneText: {
    fontSize: FontSize.md,
    color: Colours.primary,
    fontWeight: '900',
  },

  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colours.primaryLight,
    borderWidth: 1,
    borderColor: Colours.primary,
  },
  selectedChipText: {
    fontSize: FontSize.sm,
    color: Colours.primary,
    fontWeight: '700',
  },

  list: { paddingVertical: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colours.surface,
  },
  optionActive: { backgroundColor: Colours.primaryLight },
  optionText: {
    fontSize: FontSize.md,
    color: Colours.text,
    fontWeight: '600',
  },
  optionTextActive: { color: Colours.primary, fontWeight: '800' },
});
