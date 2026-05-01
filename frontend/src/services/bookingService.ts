import axios from './api';

interface CreateBookingPayload {
  mentor_service_id: number;
  availability_slot_id?: number;
  start_time?: string; // ISO datetime
  end_time?: string; // ISO datetime
  learner_note?: string;
}

interface BookingResponse {
  id: number;
  learner_id: number;
  learner_name: string;
  mentor_service_id: number;
  service_title: string;
  availability_slot_id: number;
  slot_start: string;
  slot_end: string;
  learner_note?: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  created_at: string;
}

/**
 * Create a new booking with timeline start/end times
 */
export const createBooking = async (payload: CreateBookingPayload): Promise<BookingResponse> => {
  try {
    const response = await axios.post<BookingResponse>('/bookings', {
      mentor_service_id: payload.mentor_service_id,
      availability_slot_id: payload.availability_slot_id || null,
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      learner_note: payload.learner_note || null,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to create booking');
  }
};

/**
 * Get all bookings for current learner
 */
export const getMyBookings = async (): Promise<BookingResponse[]> => {
  try {
    const response = await axios.get<BookingResponse[]>('/bookings/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch bookings');
  }
};

/**
 * Get all bookings for current mentor
 */
export const getMentorBookings = async (): Promise<BookingResponse[]> => {
  try {
    const response = await axios.get<BookingResponse[]>('/bookings/mentor/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch mentor bookings');
  }
};

/**
 * Mentor approves a pending booking
 */
export const approveBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/approve`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to approve booking');
  }
};

/**
 * Mentor denies a pending booking (learner gets refund)
 */
export const denyBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/deny`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to deny booking');
  }
};

/**
 * Learner cancels their booking
 */
export const cancelBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to cancel booking');
  }
};

/**
 * Mentor marks booking as completed (payment finalizes)
 */
export const completeBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/complete`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to complete booking');
  }
};
export const learnerConfirmBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/learner-confirm`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to confirm attendance');
  }
};

export const mentorConfirmBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/mentor-confirm`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to confirm session');
  }
};