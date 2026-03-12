import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MentorProfile } from '../types/Mentor';
import { Colors, Spacing, FontSize } from '../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MentorCardProps {
  mentor: MentorProfile;
  onPress: () => void;
  matchReasons?: string[];
  matchScore?: number;
}

const AVATAR_COLORS = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

// Condenses backend reason strings to a single short label
const shortenReason = (reason: string): string => {
  const r = reason.toLowerCase();
  if (r.includes('budget') || r.includes('price') || r.includes('rate')) return 'Budget';
  if (r.includes('language')) return 'Language';
  if (r.includes('format') || r.includes('online') || r.includes('person')) return 'Format';
  if (r.includes('availability') || r.includes('available')) return 'Available';
  if (r.includes('experience') || r.includes('level')) return 'Level';
  if (r.includes('goal')) return 'Goals';
  if (r.includes('rating') || r.includes('rated')) return 'Top rated';
  const skillMatch = reason.match(/your (.+?) interest/i) ?? reason.match(/offers (.+)/i);
  if (skillMatch) return skillMatch[1].trim().split(' ')[0];
  const words = reason.replace(/matches?|your|offers?|within/gi, '').trim().split(/\s+/);
  return words[0].charAt(0).toUpperCase() + words[0].slice(1);
};

// ── Match label ───────────────────────────────────────────────────────────
const MatchLabel = ({ score }: { score: number }) => {
  const clamped = Math.round(score);
  const { label, color, bg } =
    clamped >= 70 ? { label: 'Great match', color: '#059669', bg: '#ECFDF5' } :
    clamped >= 40 ? { label: 'Good match',  color: Colors.primary, bg: Colors.primaryLight } :
                   { label: 'Explore',      color: '#6C3AED', bg: '#EDE9FE' };
  return (
    <View style={[ml.wrap, { backgroundColor: bg }]}>
      <Text style={[ml.text, { color }]}>{label}</Text>
    </View>
  );
};

const ml = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  text: { fontSize: 10, fontWeight: '800' },
});

// ── Main card ─────────────────────────────────────────────────────────────
const MentorCard = ({ mentor, onPress, matchReasons, matchScore }: MentorCardProps) => {
  const initials = mentor.user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = AVATAR_COLORS[mentor.user_name.length % AVATAR_COLORS.length];

  const rating = mentor.average_rating ?? null;
  const reviewCount = mentor.total_reviews ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* Match label */}
      {matchScore != null && <MatchLabel score={matchScore} />}

      {/* Avatar */}
      <View style={[styles.avatarWrap, { backgroundColor: avatarColor + '18' }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Name + rating */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{mentor.user_name}</Text>
      </View>

      {rating != null && (
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>
      )}

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>€{mentor.hourly_rate}</Text>
        <Text style={styles.priceLabel}>/session</Text>
      </View>

      {/* Top 2 skills */}
      {mentor.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {mentor.skills.slice(0, 2).map(skill => (
            <View key={skill.id} style={styles.skillChip}>
              <Text style={styles.skillText} numberOfLines={1}>{skill.name}</Text>
            </View>
          ))}
          {mentor.skills.length > 2 && (
            <Text style={styles.moreSkills}>+{mentor.skills.length - 2}</Text>
          )}
        </View>
      )}

      {/* Match reason ticks */}
      {matchReasons && matchReasons.length > 0 && (
        <View style={styles.matchRow}>
          {matchReasons.slice(0, 3).map((reason, i) => (
            <View key={i} style={styles.matchChip}>
              <MaterialCommunityIcons name="check-circle" size={11} color="#10B981" />
              <Text style={styles.matchText}>{shortenReason(reason)}</Text>
            </View>
          ))}
        </View>
      )}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    minHeight: 200,
  },

  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  nameRow: { marginBottom: 2 },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.2,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 8,
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

  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
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

  matchRow: {
    gap: 4,
    marginTop: 'auto' as any,
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

export default MentorCard;