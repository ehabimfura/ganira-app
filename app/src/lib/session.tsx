import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiRequest } from './api';
import { readJson, writeJson } from './offline-store';
import { clearToken, readToken, saveToken } from './token-store';

export interface Profile {
  id: number;
  kind: 'SELF' | 'CHILD';
  nickname: string;
  avatar: string;
  path: 'FAMILY' | 'ADULT' | null;
  level: 'NEW' | 'FEW_WORDS' | 'SHORT_CHAT' | null;
  dailyGoalMinutes: number;
  // "HH:MM" in Kigali time, or null for no reminder.
  reminderTime: string | null;
  hasPin: boolean;
  // Level ids finished by this profile, in path order.
  completedLessons: string[];
  // Days in a row with practice (Kigali days), and whether today counts yet.
  streak: { days: number; practisedToday: boolean };
}

export interface Me {
  account: { id: number; email: string; username: string; kind: 'PARENT' | 'LEARNER' };
  profiles: Profile[];
  activeProfileId: number | null;
}

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionValue {
  status: Status;
  me: Me | null;
  token: string | null;
  signIn(login: string, password: string): Promise<void>;
  signUp(body: Record<string, unknown>): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  // Marks a lesson done on this phone straight away, for a lesson finished without internet.
  completeLessonLocally(lessonId: string): void;
}

// The profile data from the last time the phone was online, so the app opens without internet.
const ME_FILE = 'me.json';

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const signOutLocally = useCallback(async () => {
    await clearToken();
    writeJson(ME_FILE, null);
    setToken(null);
    setMe(null);
    setStatus('signedOut');
  }, []);

  // Loads /me for a token. A token the server no longer accepts is thrown away.
  // With no internet, the profile data from the last online visit is used instead.
  const loadMe = useCallback(
    async (newToken: string) => {
      try {
        const data = await apiRequest<Me>('/me', { token: newToken });
        writeJson(ME_FILE, data);
        setToken(newToken);
        setMe(data);
        setStatus('signedIn');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await signOutLocally();
          return;
        }
        const cached = readJson<Me | null>(ME_FILE, null);
        if (error instanceof ApiError && error.code === 'NETWORK' && cached) {
          setToken(newToken);
          setMe(cached);
          setStatus('signedIn');
          return;
        }
        throw error;
      }
    },
    [signOutLocally],
  );

  // On launch: a saved token that still works goes straight to Home.
  useEffect(() => {
    readToken()
      .then((saved) => (saved ? loadMe(saved) : signOutLocally()))
      .catch(signOutLocally);
  }, [loadMe, signOutLocally]);

  const completeLessonLocally = useCallback((lessonId: string) => {
    setMe((current) => {
      if (!current) return current;
      const profiles = current.profiles.map((profile) =>
        profile.id === current.activeProfileId && !profile.completedLessons.includes(lessonId)
          ? { ...profile, completedLessons: [...profile.completedLessons, lessonId] }
          : profile,
      );
      const next = { ...current, profiles };
      writeJson(ME_FILE, next);
      return next;
    });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      me,
      token,
      async signIn(login, password) {
        const res = await apiRequest<{ token: string }>('/auth/signin', {
          method: 'POST',
          body: { login, password },
        });
        await saveToken(res.token);
        await loadMe(res.token);
      },
      async signUp(body) {
        const res = await apiRequest<{ token: string }>('/auth/signup', { method: 'POST', body });
        await saveToken(res.token);
        await loadMe(res.token);
      },
      async signOut() {
        // Even if the server can't be reached, the phone forgets the token.
        await apiRequest('/auth/signout', { method: 'POST', token }).catch(() => {});
        await signOutLocally();
      },
      async refresh() {
        if (token) await loadMe(token);
      },
      completeLessonLocally,
    }),
    [status, me, token, loadMe, signOutLocally, completeLessonLocally],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
