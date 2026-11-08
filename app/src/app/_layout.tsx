import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/theme';

function RootStack() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const signedIn = status === 'signedIn';
  return (
    <Stack screenOptions={{ headerTintColor: colors.primary, headerTitle: '', headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Signed-out screens disappear from history as soon as someone signs in, and the reverse. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="who" />
        <Stack.Screen name="birth-year" />
        <Stack.Screen name="under-age" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="home" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootStack />
    </SessionProvider>
  );
}
