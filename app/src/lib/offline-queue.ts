import { apiRequest, ApiError } from './api';
import type { PracticeResult } from './practice';
import { readJson, writeJson } from './offline-store';

// A lesson finished without internet. It waits here and is sent when the phone is back online (FR 4.7).
export interface PendingCompletion {
  lessonId: string;
  results: PracticeResult[];
  seconds: number;
}

const FILE = 'pending-progress.json';

export function pendingCompletions(): PendingCompletion[] {
  return readJson<PendingCompletion[]>(FILE, []);
}

export function queueCompletion(item: PendingCompletion): void {
  writeJson(FILE, [...pendingCompletions(), item]);
}

// Sends the waiting lessons in order. Stops at the first lost connection, and drops a lesson
// the server refuses for good (for example a lesson that is still locked), so the queue can't jam.
export async function sendPending(token: string): Promise<void> {
  let queue = pendingCompletions();
  while (queue.length > 0) {
    const [next, ...rest] = queue;
    try {
      await apiRequest(`/lessons/${next.lessonId}/complete`, {
        method: 'POST',
        token,
        body: { results: next.results, seconds: next.seconds },
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK') return;
      console.warn('Dropped a saved lesson the server refused', error);
    }
    queue = rest;
    writeJson(FILE, queue);
  }
}
