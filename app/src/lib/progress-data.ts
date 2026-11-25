import { apiRequest } from './api';

// What the progress screen shows for the profile open on this phone.
export interface ProgressSummary {
  streakDays: number;
  practisedToday: boolean;
  minutesPractised: number;
  lessonsDone: number;
  lessonsTotal: number;
  phrasesLearned: number;
}

export interface SavedItems {
  lessons: string[];
  phrases: string[];
}

export function fetchProgress(token: string): Promise<ProgressSummary> {
  return apiRequest<ProgressSummary>('/progress', { token });
}

export function fetchSaved(token: string): Promise<SavedItems> {
  return apiRequest<SavedItems>('/saved', { token });
}

export async function setLessonSaved(token: string, lessonId: string, saved: boolean): Promise<void> {
  await apiRequest<void>(`/saved/lesson/${encodeURIComponent(lessonId)}`, {
    method: saved ? 'PUT' : 'DELETE',
    token,
  });
}

// A child's progress and settings, as the parent sees them (FR 10.1).
export interface ChildProgress extends ProgressSummary {
  nickname: string;
  avatar: string;
  dailyGoalMinutes: number;
  // "HH:MM" in Kigali time, or null for no reminder.
  reminderTime: string | null;
}

export function fetchChildProgress(token: string, profileId: number): Promise<ChildProgress> {
  return apiRequest<ChildProgress>(`/profiles/${profileId}/progress`, { token });
}

export interface ChildSettingsChange {
  dailyGoalMinutes?: number;
  reminderTime?: string | null;
}

// A parent changes a child's daily goal or reminder time (FR 10.2).
export async function updateChildSettings(token: string, profileId: number, change: ChildSettingsChange): Promise<void> {
  await apiRequest<void>(`/profiles/${profileId}/settings`, { method: 'PATCH', token, body: change });
}
