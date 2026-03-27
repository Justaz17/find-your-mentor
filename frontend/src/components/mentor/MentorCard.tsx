import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MentorProfile } from '../../types/Mentor';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MentorCardProps {
  mentor: MentorProfile;
  onPress: () => void;
  matchReasons?: string[];
  matchScore?: number;
}

const AVATAR_COLORS = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

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

// ── Star rating ───────────────────────────────────────────────────────────
const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <View style={sr.row}>
      {Array.from({ length: full }).map((_, i) => (
        <MaterialCommunityIcons key={`f${i}`} name="star" size={12} color="#F59E0B" />
      ))}
      {half && <MaterialCommunityIcons name="star-half-full" size={12} color="#F59E0B" />}
      {Array.from({ length: empty }).map((_, i) => (
        <MaterialCommunityIcons key={`e${i}`} name="star-outline" size={12} color="#F59E0B" />
      ))}
      <Text style={sr.count}>
        {rating.toFixed(1)}
        <Text style={sr.reviews}> ({count})</Text>
      </Text>
    </View>
  );
};

const sr = StyleSheet.create({
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

// ── Match label ───────────────────────────────────────────────────────────
const MatchLabel = ({ score }: { score: number }) => {
  const clamped = Math.round(score);
  const { label, color, bg } =
    clamped >= 70 ? { label: 'Great match', color: '#059669', bg: '#ECFDF5' } :
    clamped >= 40 ? { label: 'Good match', color: Colors.primary, bg: Colors.primaryLight } :
                   { label: 'Explore', color: '#6C3AED', bg: '#EDE9FE' };
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

  // Trim bio to 2 lines worth — ~80 chars
  const bio = mentor.bio?.trim();
  const shortBio = bio && bio.length > 80 ? bio.slice(0, 78).trimEnd() + '…' : bio;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* Match label */}
      {matchScore != null && <MatchLabel score={matchScore} />}

      {/* Top row — avatar + price */}
      <View style={styles.topRow}>
        <View style={[styles.avatarWrap, { backgroundColor: avatarColor + '18' }]}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text style={styles.price}>€{mentor.hourly_rate}</Text>
          <Text style={styles.priceLabel}>/session</Text>
        </View>
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>{mentor.user_name}</Text>

      {/* Star rating */}
      {rating != null ? (
        <StarRating rating={rating} count={reviewCount} />
      ) : (
        <Text style={styles.noRating}>No reviews yet</Text>
      )}

      {/* Bio */}
      {shortBio ? (
        <Text style={styles.bio} numberOfLines={2}>{shortBio}</Text>
      ) : null}

      {/* Skills */}
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

export default MentorCard;