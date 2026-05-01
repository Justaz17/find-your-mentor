import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colours.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colours.text,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  time: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colours.error,
    borderRadius: 8,
  },
  deleteText: {
    color: Colours.textLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
