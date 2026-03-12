export interface Booking {
  id: number;
  learner_id: number;
  learner_name: string;
  mentor_service_id: number;
  service_title: string;
  availability_slot_id: number;
  slot_start: string;
  slot_end: string;
  learner_note?: string;
  status: 'confirmed' | 'completed' | 'cancelled_by_learner' | 'cancelled_by_mentor' | 'no_show';
  payment_status: 'paid' | 'pending' | 'refunded' | 'partial_refund';
  amount_paid: number;
  created_at: string;
}