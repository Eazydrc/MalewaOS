import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation';
import { useAuthStore } from './src/store/auth.store';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function AppContent() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { colors, themeKey } = useTheme();
  useEffect(() => { fetchMe(); }, []);
  return (
    <>
      <StatusBar
        barStyle={themeKey === 'AURORE' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.bg}
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
