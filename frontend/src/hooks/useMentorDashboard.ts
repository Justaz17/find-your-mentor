import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getMentorBookings } from '../services/bookingService';
import { approveBooking, denyBooking, completeBooking } from '../services/bookingService';

export interface MentorBooking {
  id: number;
  learner_name: string;
  service_title: string;
  slot_start: string;
  slot_end: string;
  status: string;
  amount_paid: number;
  learner_note?: string | null;
  mentor_note?: string | null;
}

export interface DashboardStats {
  upcoming: MentorBooking[];
  pending: MentorBooking[];
  completed: MentorBooking[];
  totalEarned: number;
}

export const useMentorDashboard = () => {
  const [bookings, setBookings] = useState<MentorBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getMentorBookings();
      setBookings(data as MentorBooking[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    load();
  }, [load]));

  const refresh = () => {
    setIsRefreshing(true);
    load();
  };

  const approve = async (bookingId: number) => {
    await approveBooking(bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
  };

  const deny = async (bookingId: number) => {
    await denyBooking(bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled_by_mentor' } : b));
  };

  const complete = async (bookingId: number) => {
    await completeBooking(bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
  };

  const now = new Date();
  const stats: DashboardStats = {
    upcoming: bookings.filter(b =>
      new Date(b.slot_start) > now && ['pending', 'confirmed'].includes(b.status)
    ),
    pending: bookings.filter(b => b.status === 'pending'),
    completed: bookings.filter(b => b.status === 'completed'),
    totalEarned: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.amount_paid, 0),
  };

  return {
    bookings,
    stats,
    isLoading,
    isRefreshing,
    error,
    refresh,
    approve,
    deny,
    complete,
  };
};