import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Colours } from './constants';

export const theme = {
  ...MD3LightTheme,
  Colours: {
    ...MD3LightTheme.Colours,
    primary: Colours.primary,
    primaryContainer: Colours.primaryLight,
    secondary: Colours.secondary,
    background: Colours.background,
    surface: Colours.surface,
    error: Colours.error,
    onPrimary: Colours.textLight,
    onBackground: Colours.text,
    onSurface: Colours.text,
    outline: Colours.border,
    surfaceVariant: Colours.surface,
  },
  roundness: 14,
};