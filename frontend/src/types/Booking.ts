export interface Booking {
  id: number;
  learner_id: number;
  learner_name: string;
  mentor_id: number;           // ← added — lets us navigate to mentor profile
  mentor_service_id: number;
  service_title: string;
  availability_slot_id: number;
  slot_start: string;
  slot_end: string;
  learner_note: string | null;
  status: string;
  payment_status: string;
  amount_paid: number;
  created_at: string;
}