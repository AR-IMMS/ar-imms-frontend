import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../src/auth/auth-context';
import { TicketNotificationProvider } from '../src/notifications/notification-context';
import { TicketNotificationSheet } from '../src/notifications/ticket-notification-sheet';
import { ThemeProvider, useTheme } from '../src/theme/theme-context';

function NavigationRoot() {
  const { colors, isDark } = useTheme();
  return (
    <AuthProvider>
      <TicketNotificationProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        <TicketNotificationSheet />
      </TicketNotificationProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
