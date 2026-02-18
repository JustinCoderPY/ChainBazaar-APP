import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from './AuthContext';


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          {/* ADD THESE TWO NEW SCREENS */}
          <Stack.Screen name="auth/login" options={{ presentation: 'modal', title: 'Login' }} />
          <Stack.Screen name="auth/signup" options={{ presentation: 'modal', title: 'Sign Up' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}