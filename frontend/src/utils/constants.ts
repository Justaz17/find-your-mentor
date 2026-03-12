// Update this to your machine's local IP when testing on physical device
// e.g., 'http://192.168.1.100:8000'
// Use 'http://10.0.2.2:8000' for Android emulator
export const API_BASE_URL = 'http://10.0.15.34:8000';
// export const API_BASE_URL = 'http://10.0.15.208:8000';

// Colors derived from the design chapter wireframes (purple/indigo primary)
export const Colors = {
  primary: '#6C3AED',       // Main purple — buttons, nav, accents
  primaryDark: '#5B21B6',   // Darker purple — pressed states
  primaryLight: '#EDE9FE',  // Light purple — backgrounds, chips
  secondary: '#10B981',     // Green — success, confirmed status
  background: '#FFFFFF',
  surface: '#F9FAFB',       // Light gray — card backgrounds
  text: '#111827',          // Near-black — primary text
  textSecondary: '#6B7280', // Gray — secondary text, labels
  textLight: '#FFFFFF',     // White text on dark backgrounds
  border: '#E5E7EB',        // Light border
  error: '#EF4444',         // Red — errors, cancel
  warning: '#F59E0B',       // Amber — pending status
  star: '#F59E0B',          // Rating star color
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
};

// Popular categories for the home screen (matches design wireframe)
export const CATEGORIES = [
  { name: 'Technology', icon: 'laptop', color: '#6C3AED' },
  { name: 'Business & Career', icon: 'briefcase', color: '#8B5CF6' },
  { name: 'Finance', icon: 'cash', color: '#10B981' },
  { name: 'Fitness', icon: 'dumbbell', color: '#EF4444' },
  { name: 'Languages', icon: 'translate', color: '#3B82F6' },
  { name: 'Design', icon: 'palette', color: '#F59E0B' },
  { name: 'Creative Arts', icon: 'camera', color: '#F97316' },
  { name: 'Personal Development', icon: 'brain', color: '#14B8A6' },
];