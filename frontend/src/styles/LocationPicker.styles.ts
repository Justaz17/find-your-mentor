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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colours.border,
    backgroundColor: Colours.surface,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colours.text,
    fontWeight: '600',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colours.surface,
    gap: Spacing.sm,
  },
  optionActive: { backgroundColor: Colours.primaryLight },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colours.text,
    fontWeight: '600',
  },
  optionTextActive: { color: Colours.primary, fontWeight: '800' },
});
