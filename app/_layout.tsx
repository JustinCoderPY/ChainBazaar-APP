import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ChainBazaarNavTheme } from '@/constants/theme';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={ChainBazaarNavTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              title: 'Settings',
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="account-settings" options={{ headerShown: false }} />
          <Stack.Screen name="connect-wallet" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="auth/login"
            options={{
              presentation: 'modal',
              title: 'Login',
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#FFFFFF',
            }}
          />
          <Stack.Screen
            name="auth/signup"
            options={{
              presentation: 'modal',
              title: 'Sign Up',
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#FFFFFF',
            }}
          />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
