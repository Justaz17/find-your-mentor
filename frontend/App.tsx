import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppProvider';
import AppNavigator from './src/navigation/AppNavigator';
import { Colours } from './src/utils/constants';
import { theme } from './src/utils/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppProvider>
          <StatusBar barStyle="dark-content" backgroundColor={Colours.background} />
          <AppNavigator />
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}