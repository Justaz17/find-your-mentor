import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import ScreenHeader from '../../components/common/ScreenHeader';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getMentorReviews } from '../../services/reviewService';

interface ReviewItem {
  id: number;
  mentor_profile_id: number;
  reviewer_id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  mentor_reply: string | null;
  mentor_replied_at: string | null;
  is_disputed: string | null;
}

const StarRow = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <MaterialCommunityIcons key={`f${i}`} name="star" size={14} color="#F59E0B" />
      ))}
      {half && <MaterialCommunityIcons name="star-half-full" size={14} color="#F59E0B" />}
      {Array.from({ length: empty }).map((_, i) => (
        <MaterialCommunityIcons key={`e${i}`} name="star-outline" size={14} color="#F59E0B" />
      ))}
    </View>
  );
};

const ReviewsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mentorProfileId, setMentorProfileId] = useState<number | null>(null);

  // Reply modal
  const [replyModalId, setReplyModalId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Dispute modal
  const [disputeModalId, setDisputeModalId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const load = useCallback(async () => {
    try {
      // Get mentor profile id first
      const profileRes = await api.get('/mentors/me/profile').catch(() => null);
      if (profileRes?.data?.id) {
        setMentorProfileId(profileRes.data.id);
        const data = await getMentorReviews(profileRes.data.id);
        setReviews(data as any);
      }
    } catch {}
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); load(); }, [load]));

  const handleReply = async () => {
    if (!replyModalId || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await api.post(`/reviews/${replyModalId}/reply`, { mentor_reply: replyText.trim() });
      setReviews(prev => prev.map(r =>
        r.id === replyModalId
          ? { ...r, mentor_reply: replyText.trim(), mentor_replied_at: new Date().toISOString() }
          : r
      ));
      setReplyModalId(null);
      setReplyText('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit reply');
    } finally { setSubmittingReply(false); }
  };

  const handleDispute = async () => {
    if (!disputeModalId || !disputeReason.trim()) return;
    setSubmittingDispute(true);
    try {
      await api.post(`/reviews/${disputeModalId}/dispute`, { dispute_reason: disputeReason.trim() });
      setReviews(prev => prev.map(r =>
        r.id === disputeModalId ? { ...r, is_disputed: 'pending' } : r
      ));
      setDisputeModalId(null);
      setDisputeReason('');
      Alert.alert('Dispute submitted', 'We\'ll review your case and get back to you.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit dispute');
    } finally { setSubmittingDispute(false); }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isLoading) return (
    <View style={styles.centred}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reviews</Text>
        {avgRating != null && (
          <View style={styles.headerRating}>
            <Text style={styles.headerRatingValue}>{avgRating.toFixed(1)}</Text>
            <StarRow rating={avgRating} />
            <Text style={styles.headerRatingCount}>({reviews.length})</Text>
          </View>
        )}
      </View>

      <FlatList
        data={reviews}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="star-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySub}>Reviews from learners will appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Review header */}
            <View style={styles.cardTop}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>
                  {item.reviewer_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewerName}>{item.reviewer_name}</Text>
                <View style={styles.ratingRow}>
                  <StarRow rating={item.rating} />
                  <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
              {item.is_disputed === 'pending' && (
                <View style={styles.disputedBadge}>
                  <Text style={styles.disputedText}>Disputed</Text>
                </View>
              )}
            </View>

            {/* Comment */}
            {item.comment && (
              <Text style={styles.comment}>{item.comment}</Text>
            )}

            {/* Mentor reply */}
            {item.mentor_reply && (
              <View style={styles.replyBox}>
                <View style={styles.replyHeader}>
                  <MaterialCommunityIcons name="reply" size={14} color={Colors.primary} />
                  <Text style={styles.replyLabel}>Your reply</Text>
                  <Text style={styles.replyDate}>
                    {item.mentor_replied_at ? formatDate(item.mentor_replied_at) : ''}
                  </Text>
                </View>
                <Text style={styles.replyText}>{item.mentor_reply}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {!item.mentor_reply && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => { setReplyModalId(item.id); setReplyText(''); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="reply-outline" size={14} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Reply</Text>
                </TouchableOpacity>
              )}
              {!item.is_disputed && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => { setDisputeModalId(item.id); setDisputeReason(''); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="flag-outline" size={14} color={Colors.error} />
                  <Text style={[styles.actionBtnText, { color: Colors.error }]}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Reply modal */}
      <Modal visible={replyModalId !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReplyModalId(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reply to review</Text>
            <TouchableOpacity onPress={() => setReplyModalId(null)}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHint}>
              Your reply will be visible to everyone who views this review.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a professional, helpful reply..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={5}
              maxLength={500}
              autoFocus
            />
            <Text style={styles.charCount}>{replyText.length}/500</Text>
            <TouchableOpacity
              style={[styles.submitBtn, !replyText.trim() && styles.submitBtnDisabled]}
              onPress={handleReply}
              disabled={!replyText.trim() || submittingReply}
              activeOpacity={0.85}
            >
              {submittingReply
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Submit reply</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Dispute modal */}
      <Modal visible={disputeModalId !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDisputeModalId(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report review</Text>
            <TouchableOpacity onPress={() => setDisputeModalId(null)}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHint}>
              Explain why you believe this review violates our guidelines. Our team will review your case within 48 hours.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="e.g. This learner never attended the session and I have proof..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={5}
              maxLength={1000}
              autoFocus
            />
            <Text style={styles.charCount}>{disputeReason.length}/1000</Text>
            <TouchableOpacity
              style={[styles.submitBtn, styles.submitBtnDanger, !disputeReason.trim() && styles.submitBtnDisabled]}
              onPress={handleDispute}
              disabled={!disputeReason.trim() || submittingDispute}
              activeOpacity={0.85}
            >
              {submittingDispute
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Submit report</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 4,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  headerRating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRatingValue: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text },
  headerRatingCount: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.background, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewerInitial: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  reviewerName: { fontSize: FontSize.sm, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  disputedBadge: {
    backgroundColor: Colors.warning + '20', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.warning,
  },
  disputedText: { fontSize: 10, fontWeight: '800', color: Colors.warning },
  comment: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    lineHeight: 20, fontStyle: 'italic',
  },
  replyBox: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30',
    gap: 4,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replyLabel: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary, flex: 1 },
  replyDate: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  replyText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnDanger: { backgroundColor: '#FEF2F2', borderColor: Colors.error + '40' },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  modalContent: { padding: Spacing.lg, gap: Spacing.md },
  modalHint: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', lineHeight: 20 },
  modalInput: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: Colors.text, fontWeight: '600',
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'right' },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnDanger: { backgroundColor: Colors.error },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: FontSize.md },
});

export default ReviewsScreen;