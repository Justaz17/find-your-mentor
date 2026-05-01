import { StyleSheet } from 'react-native';
import { Colours, FontSize, Spacing } from '../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colours.background,
    borderBottomWidth: 1,
    borderBottomColor: Colours.border,
  },
  cancelButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.error,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colours.text,
  },
  saveButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colours.text,
    marginBottom: Spacing.md,
  },
  pickerButton: {
    backgroundColor: Colours.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colours.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colours.text,
  },
  summary: {
    backgroundColor: Colours.primaryLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colours.primary,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colours.text,
  },
});
