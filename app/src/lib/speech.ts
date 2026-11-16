import { apiRequest } from './api';

export interface SpeechResult {
  words: { word: string; heard: boolean }[];
  allHeard: boolean;
  transcript: string;
}

// The recording (a file on a phone, a blob in a browser) as base64 text for the API.
async function recordingAsBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// The API gives the speech service 20 s before it answers SPEECH_UNAVAILABLE. The app must wait
// longer than that, or it reports "Can't reach Ganira" while the answer is still on its way.
const SPEECH_TIMEOUT_MS = 25000;

// Sends what the learner said to the speech check; the answer says which words were heard.
export async function checkSpeech(uri: string, expected: string, token: string | null): Promise<SpeechResult> {
  const audio = await recordingAsBase64(uri);
  return apiRequest<SpeechResult>('/speech/check', {
    method: 'POST',
    token,
    body: { expected, audio },
    timeoutMs: SPEECH_TIMEOUT_MS,
  });
}
