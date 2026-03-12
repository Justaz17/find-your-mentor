import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Colors } from './constants';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    onPrimary: Colors.textLight,
    onBackground: Colors.text,
    onSurface: Colors.text,
    outline: Colors.border,
    surfaceVariant: Colors.surface,
  },
  roundness: 14,
};