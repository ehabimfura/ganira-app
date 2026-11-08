// Talks to the Ganira API. Every screen goes through here, so errors look the same everywhere.
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 10000;

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
