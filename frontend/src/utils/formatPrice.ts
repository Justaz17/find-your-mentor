/**
 * Format price in euros (€15.99)
 */
export const formatPrice = (price: number): string => {
  if (price === 0) return 'Free';
  return `€${price.toFixed(2)}`;
};

/**
 * Format price for display with currency (€15)
 */
export const formatPriceShort = (price: number): string => {
  if (price === 0) return 'Free';
  return `€${Math.round(price)}`;
};

/**
 * Format hourly rate (€15/hour)
 */
export const formatHourlyRate = (price: number): string => {
  if (price === 0) return 'Free';
  return `€${price.toFixed(2)}/hour`;
};

/**
 * Calculate total price for session
 */
export const calculateSessionPrice = (hourlyRate: number, durationMinutes: number): number => {
  const hours = durationMinutes / 60;
  return hourlyRate * hours;
};

/**
 * Format total price for booking confirmation
 */
export const formatTotalPrice = (price: number): string => {
  if (price === 0) return 'Free';
  return `€${price.toFixed(2)}`;
};