// frontend/src/utils/formatDate.ts

/**
 * Format ISO datetime to readable time (HH:MM)
 */
export const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format ISO datetime to readable date (Mon, Jan 15)
 */
export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-IE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format ISO datetime to full datetime (Mon, Jan 15 at 2:30 PM)
 */
export const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('en-IE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if date is today
 */
export const isToday = (iso: string): boolean => {
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (iso: string): boolean => {
  const date = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * Get relative date label (Today, Tomorrow, or formatted date)
 */
export const getRelativeDateLabel = (iso: string): string => {
  if (isToday(iso)) return 'Today';
  if (isTomorrow(iso)) return 'Tomorrow';
  return formatDate(iso);
};