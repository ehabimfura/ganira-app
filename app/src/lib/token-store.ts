import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// On phones the token lives in the Keychain (iOS) or Keystore (Android).
// The web build is only for testing on a laptop, so it uses localStorage there.
const KEY = 'ganira.token';

export async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.setItem(KEY, token);
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(KEY);
  await SecureStore.deleteItemAsync(KEY);
}
