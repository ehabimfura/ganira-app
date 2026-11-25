import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

// Sound and vibration can be switched off on the profile screen (FR 5.6).
// Kept on the phone only; the web build (for testing on a laptop) uses localStorage.
export interface Settings {
  sound: boolean;
  vibration: boolean;
}

const KEY = 'ganira.settings';
const DEFAULTS: Settings = { sound: true, vibration: true };

let current: Settings = DEFAULTS;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getSettings(): Settings {
  return current;
}

// Loads the saved choices at launch. A missing or unreadable value keeps the defaults.
export async function loadSettings(): Promise<void> {
  try {
    const raw =
      Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
    if (raw) current = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (error) {
    console.warn('Could not read settings', error);
  }
  notify();
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  current = { ...current, ...patch };
  notify();
  const raw = JSON.stringify(current);
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, raw);
    else await SecureStore.setItemAsync(KEY, raw);
  } catch (error) {
    console.warn('Could not save settings', error);
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
