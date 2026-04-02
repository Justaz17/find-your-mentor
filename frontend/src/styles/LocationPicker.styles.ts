import { StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: { color: Colors.textSecondary },

  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
    gap: Spacing.sm,
  },
  optionActive: { backgroundColor: Colors.primaryLight },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  optionTextActive: { color: Colors.primary, fontWeight: '800' },
});
