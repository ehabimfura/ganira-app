// Talks to the speech service (speech/server.py), which turns a recording into text.

export type Transcribe = (audio: Buffer) => Promise<string>;

export class UnreadableAudioError extends Error {
  constructor() {
    super("The speech service could not read the recording");
  }
}

const TIMEOUT_MS = 20000;

export function createSpeechClient(baseUrl: string): Transcribe {
  return async (audio) => {
    const res = await fetch(`${baseUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
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
