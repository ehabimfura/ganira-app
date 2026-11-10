import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { OnboardingDraftProvider } from '@/lib/onboarding-draft';
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
      <Stack.Screen name="credits" />
      {/* The first lesson is part of sign-up and also Lesson 1 on the path. */}
      <Stack.Screen name="first-lesson" />
      {/* Signed-out screens disappear from history as soon as someone signs in, and the reverse. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="who" />
        <Stack.Screen name="birth-year" />
        <Stack.Screen name="level" />
        <Stack.Screen name="daily-goal" />
        <Stack.Screen name="under-age" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="add-child" />
        <Stack.Screen name="pin" />
        <Stack.Screen name="parent-unlock" />
        <Stack.Screen name="lesson/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Lessons should be heard even when the iPhone's silent switch is on,
    // and the microphone must be usable for the speech check.
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => {});
  }, []);

  return (
    <SessionProvider>
      <OnboardingDraftProvider>
        <StatusBar style="dark" />
        <RootStack />
      </OnboardingDraftProvider>
    </SessionProvider>
  );
}
