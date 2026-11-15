import { apiRequest } from '@/lib/api';

// One answered exercise for the spaced review: the phrase's Kinyarwanda text and
// whether the learner got it right (api/src/practice).
export interface PracticeResult {
  phrase: string;
  correct: boolean;
}

export interface DuePhrase {
  phrase: string;
  recall: number;
}

// Phrases most likely forgotten by the open profile, weakest first.
export async function fetchReview(token: string | null): Promise<DuePhrase[]> {
  const { due } = await apiRequest<{ due: DuePhrase[] }>('/practice/review', { token });
  return due;
}

export function saveReview(token: string | null, results: PracticeResult[]): Promise<void> {
  return apiRequest('/practice/results', { method: 'POST', token, body: { results } });
}
