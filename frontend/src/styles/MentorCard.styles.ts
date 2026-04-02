import { StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/constants';

export const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  count: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: 3,
  },
  reviews: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export const ml = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  text: { fontSize: 10, fontWeight: '800' },
});

export const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
  },

  // Name
  name: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  // No rating placeholder
  noRating: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },

  // Bio
  bio: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 8,
  },

  // Skills
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  skillChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '100%',
  },
  skillText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  moreSkills: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    alignSelf: 'center',
  },

  // Match
  matchRow: {
    gap: 4,
    marginTop: 4,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignSelf: 'flex-start',
  },
  matchText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
});
