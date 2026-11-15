// Talks to the speech service (speech/server.py), which turns a recording into text.

export type Transcribe = (audio: Buffer) => Promise<string>;

export class UnreadableAudioError extends Error {
  constructor() {
    super("The speech service could not read the recording");
  }
}

const TIMEOUT_MS = 20000;

// On Azure the speech service has a public address, so it only answers callers with its key.
export function createSpeechClient(baseUrl: string, key?: string): Transcribe {
  const headers: Record<string, string> = { "Content-Type": "application/octet-stream" };
  if (key) headers["X-Speech-Key"] = key;
  return async (audio) => {
    const res = await fetch(`${baseUrl}/transcribe`, {
      method: "POST",
      headers,
      body: new Uint8Array(audio),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 400) throw new UnreadableAudioError();
    if (!res.ok) throw new Error(`Speech service answered ${res.status}`);
    const data = (await res.json()) as { text?: unknown };
    if (typeof data.text !== "string") throw new Error("Speech service sent no text");
    return data.text;
  };
}

// Used when no speech service is set up: every check answers "unavailable".
export const noSpeechService: Transcribe = async () => {
  throw new Error("No speech service configured");
};
