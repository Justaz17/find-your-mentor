// Currently set to local development IP (update to your machine's IP when testing)
// Android emulator: use 'http://10.0.2.2:8000'
// iOS simulator: use 'http://localhost:8000'
// export const API_BASE_URL = 'http://192.168.1.17:8000';
export const API_BASE_URL = 'http://172.20.10.8:8000';

// Colours derived from the design chapter wire frames (purple/indigo primary)
export const Colours = {
  primary: '#6C3AED',       // Main purple - buttons, nav, accents
  primaryDark: '#5B21B6',   // Darker purple - pressed states
  primaryLight: '#EDE9FE',  // Light purple - backgrounds, chips
  secondary: '#10B981',     // Green - success, confirmed status
  background: '#FFFFFF',
  surface: '#F9FAFB',       // Light gray - card backgrounds
  text: '#111827',          // Near-black - primary text
  textSecondary: '#6B7280', // Gray - secondary text, labels
  textLight: '#FFFFFF',     // White text on dark backgrounds
  border: '#E5E7EB',        // Light border
  error: '#EF4444',         // Red - errors, cancel
  warning: '#F59E0B',       // Amber - pending status
  star: '#F59E0B',          // Rating star colour
  
  // Additional category colours
  purple: '#8B5CF6',
  blue: '#3B82F6',
  orange: '#F97316',
  teal: '#14B8A6',
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

export const CATEGORIES = [
  { name: 'Technology', icon: 'laptop', color: Colours.primary },
  { name: 'Business & Career', icon: 'briefcase', color: Colours.purple },
  { name: 'Finance', icon: 'cash', color: Colours.secondary },
  { name: 'Fitness', icon: 'dumbbell', color: Colours.error },
  { name: 'Languages', icon: 'translate', color: Colours.blue },
  { name: 'Design', icon: 'palette', color: Colours.warning },
  { name: 'Creative Arts', icon: 'camera', color: Colours.orange },
  { name: 'Personal Development', icon: 'brain', color: Colours.teal },
];