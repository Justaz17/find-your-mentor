/**
 * Validate an email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password meets minimum requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
};

/**
 * Get detailed password validation feedback
 */
export const getPasswordValidationErrors = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/\d/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('One special character (!@#$% etc)');
  return errors;
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
  if (!isValidPassword(password)) {
    const errors = getPasswordValidationErrors(password);
    return `Password needs: ${errors.join(', ')}`;
  }
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

/**
 * Check if passwords match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  if (!password || !confirmPassword) return true; // Don't show error if either is empty
  return password === confirmPassword;
};

/**
 * Get detailed email validation feedback
 */
export const getEmailValidationError = (email: string): string | null => {
  if (!email) return null;
  if (!isValidEmail(email)) return 'Invalid email format';
  return null;
};