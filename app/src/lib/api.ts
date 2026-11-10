import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Talks to the Ganira API. Every screen goes through here, so errors look the same everywhere.
const DEV_API_PORT = 3000;
const TIMEOUT_MS = 10000;

// EXPO_PUBLIC_API_URL wins when set (e.g. the Azure address). Otherwise, in development,
// the API is assumed to run on the same computer that serves the app, so a Wi-Fi change
// never leaves the phone pointing at an old address.
function resolveApiUrl(): string | undefined {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (!__DEV__) return undefined;
  const host =
    Constants.expoConfig?.hostUri?.split(':')[0] ??
    (Platform.OS === 'web' ? globalThis.location?.hostname : undefined);
  return host ? `http://${host}:${DEV_API_PORT}` : undefined;
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

const MESSAGES: Record<string, string> = {
  WRONG_LOGIN_OR_PASSWORD: 'That email, username or password is not right.',
  TOO_MANY_ATTEMPTS: 'Too many tries. Please wait 15 minutes and try again.',
  EMAIL_TAKEN: 'An account with this email already exists. Try signing in.',
  USERNAME_TAKEN: 'That username is taken. Please choose another one.',
  UNDER_AGE: 'Only adults aged 18 or over can create an account.',
  INVALID_INPUT: 'Please check the details you entered.',
  NOT_SIGNED_IN: 'Please sign in again.',
  WRONG_PIN: "That PIN isn't right.",
  WRONG_PASSWORD: "That password isn't right.",
  TOO_MANY_PROFILES: 'You can have up to 6 child profiles.',
  PARENT_MODE_REQUIRED: 'Only the parent can do this.',
  PROFILE_NOT_FOUND: 'That profile was not found.',
  LESSON_LOCKED: 'Finish the lesson before this one first.',
  LESSON_NOT_FOUND: 'That lesson was not found.',
  NO_ACTIVE_PROFILE: 'Choose who is learning first.',
  NETWORK: "Can't reach Ganira. Check your internet connection.",
  NOT_CONFIGURED: 'The app is missing its server address (EXPO_PUBLIC_API_URL).',
};

export function messageFor(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code] ?? 'Something went wrong. Please try again.';
  return 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  if (!API_URL) throw new ApiError('NOT_CONFIGURED', 0);

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError('NETWORK', 0);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'SERVER_ERROR', res.status);
  return data as T;
}
