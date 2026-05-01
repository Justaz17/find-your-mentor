import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Avatar,
  Divider,
  Surface,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { MentorProfile, Review, AvailabilitySlot } from '../../types/Mentor';
import { getMentorById, getMentorAvailability } from '../../services/mentorService';
import { getMentorReviews, createReview } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { Colours, Spacing } from '../../utils/constants';
import AvailabilityCalendar from '../../components/mentor/AvailabilityCalendar';
import { styles } from '../../styles/MentorProfileScreen.styles';

type MentorProfileRouteProp = RouteProp<RootStackParamList, 'MentorProfile'>;

// Star rating display
const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push('★');
    } else if (i - 0.5 <= rating) {
      stars.push('★');
    } else {
      stars.push('☆');
    }
  }
  return (
    <Text style={{ fontSize: size, color: Colours.star, letterSpacing: 2 }}>
      {stars.join('')}
    </Text>
  );
};

// Tappable star rating input
const StarRatingInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <View style={styles.starInputRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <IconButton
        key={star}
        icon={star <= value ? 'star' : 'star-outline'}
        iconColor={star <= value ? Colours.star : Colours.border}
        size={32}
        onPress={() => onChange(star)}
      />
    ))}
  </View>
);

const MentorProfileScreen = () => {
  const route = useRoute<MentorProfileRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { mentorId } = route.params;

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateFromCalendar, setSelectedDateFromCalendar] = useState<string | undefined>(undefined);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [mentorData, reviewsData, slotsData] = await Promise.all([
        getMentorById(mentorId),
        getMentorReviews(mentorId),
        getMentorAvailability(mentorId),
      ]);
      setMentor(mentorData);
      setReviews(reviewsData);
      setSlots(slotsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load mentor profile');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAll();
  };

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    setReviewError(null);
    try {
      await createReview(mentorId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      // Refresh to get updated data
      fetchAll();
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalendarDateSelect = (date: string) => {
    setSelectedDateFromCalendar(date);
    if (!isAuthenticated) {
      navigation.navigate('Auth');
    } else {
      navigation.navigate('BookSession', { mentorId: mentor?.id || mentorId, preselectedDate: date });
    }
  };

  // Check if current user already reviewed this mentor
  const hasReviewed = reviews.some((r) => r.reviewer_id === user?.id);
  const isOwnProfile = mentor?.user_id === user?.id;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colours.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !mentor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>.</Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error || 'Mentor not found'}
        </Text>
        <Button mode="contained" onPress={() => { setIsLoading(true); fetchAll(); }}>
          Try Again
        </Button>
      </View>
    );
  }

  const initials = mentor.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColours = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  const avatarColour = avatarColours[mentor.user_name.length % avatarColours.length];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colours.primary} />
      }
    >
      {/* Header */}
      <Surface style={styles.headerCard} elevation={0}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: avatarColour }}
            labelStyle={styles.avatarLabel}
          />
          <Text variant="headlineSmall" style={styles.name}>{mentor.user_name}</Text>

          {mentor.average_rating && (
            <View style={styles.ratingRow}>
              <StarRating rating={mentor.average_rating} size={18} />
              <Text variant="bodyMedium" style={styles.ratingText}>
                {mentor.average_rating} ({mentor.total_reviews} review{mentor.total_reviews !== 1 ? 's' : ''})
              </Text>
            </View>
          )}

          <View style={styles.rateRow}>
            <Text variant="headlineMedium" style={styles.rate}>€{mentor.hourly_rate}</Text>
            <Text variant="bodyMedium" style={styles.rateLabel}> / session</Text>
          </View>
        </View>
      </Surface>

      {/* Skills */}
      {mentor.skills.length > 0 && (
        <Card mode="outlined" style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.chipRow}>
              {mentor.skills.map((skill) => (
                <Chip key={skill.id} mode="flat" style={styles.skillChip} textStyle={styles.chipText}>
                  {skill.name}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Bio */}
      {!!mentor.bio && (
        <Card mode="outlined" style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
            <Text variant="bodyLarge" style={styles.bioText}>{mentor.bio}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Availability Calendar */}
      {slots.length === 0 ? (
        <Card mode="outlined" style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Available Slots</Text>
            <Text variant="bodyMedium" style={styles.placeholderText}>
              No availability set yet. Check back later.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <AvailabilityCalendar
          slots={slots}
          onDateSelect={handleCalendarDateSelect}
          selectedDate={selectedDateFromCalendar}
        />
      )}

      {/* Reviews */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.reviewsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reviews ({reviews.length})
            </Text>
            {isAuthenticated && !isOwnProfile && !hasReviewed && (
              <Button
                mode="outlined"
                compact
                onPress={() => setShowReviewForm(!showReviewForm)}
                style={styles.writeReviewBtn}
              >
                Write review
              </Button>
            )}
          </View>

          {/* Review form */}
          {showReviewForm && (
            <Surface style={styles.reviewForm} elevation={0}>
              <Text variant="bodyMedium" style={styles.reviewFormLabel}>Your rating</Text>
              <StarRatingInput value={reviewRating} onChange={setReviewRating} />

              <TextInput
                mode="outlined"
                label="Comment (optional)"
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                style={styles.reviewInput}
                outlineColor={Colours.border}
                activeOutlineColor={Colours.primary}
              />

              {reviewError && (
                <Text variant="bodySmall" style={styles.reviewFormError}>{reviewError}</Text>
              )}

              <View style={styles.reviewFormActions}>
                <Button
                  mode="text"
                  onPress={() => {
                    setShowReviewForm(false);
                    setReviewError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmitReview}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Submit
                </Button>
              </View>
            </Surface>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <Text variant="bodyMedium" style={styles.placeholderText}>
              No reviews yet. Be the first to share your experience.
            </Text>
          ) : (
            reviews.map((review, index) => (
              <View key={review.id}>
                {index > 0 && <Divider style={styles.reviewDivider} />}
                <View style={styles.reviewItem}>
                  <View style={styles.reviewTopRow}>
                    <Text variant="bodyMedium" style={styles.reviewerName}>
                      {review.reviewer_name}
                    </Text>
                    <StarRating rating={review.rating} size={14} />
                  </View>
                  {!!review.comment && (
                    <Text variant="bodyMedium" style={styles.reviewComment}>
                      {review.comment}
                    </Text>
                  )}
                  <Text variant="bodySmall" style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('en-IE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Book Button */}
      {!isOwnProfile && (
        <View style={styles.bookSection}>
          <Button
            mode="contained"
            onPress={() => {
              if (!isAuthenticated) {
                navigation.navigate('Auth');
              } else {
                navigation.navigate('BookSession', { mentorId: mentor.id });
              }
            }}
            style={styles.bookButton}
            contentStyle={styles.bookButtonContent}
            labelStyle={styles.bookButtonLabel}
          >
            Book a Session — €{mentor.hourly_rate}
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default MentorProfileScreen;