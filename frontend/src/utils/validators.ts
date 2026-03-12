/**
 * Validate an email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password meets minimum requirements
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate name is not empty and reasonable length
 */
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

/**
 * Get validation error message for registration
 */
export const getRegistrationErrors = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): string | null => {
  if (!isValidName(name)) return 'Name must be between 2 and 50 characters';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  if (!isValidPassword(password)) return 'Password must be at least 6 characters';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

/**
 * Get validation error message for login
 */
export const getLoginErrors = (email: string, password: string): string | null => {
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  if (!password) return 'Please enter your password';
  return null;
};