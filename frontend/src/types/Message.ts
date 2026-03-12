export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: number;
  participant_ids: number[];
  last_message?: Message;
  last_message_at: string;
  created_at: string;
}