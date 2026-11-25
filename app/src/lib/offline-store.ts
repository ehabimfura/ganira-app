import { File, Paths } from 'expo-file-system';

// Small JSON files kept on the phone, so the app works without internet:
// the last profile data (so launch works offline) and progress waiting to be sent.
// If a file can't be read or written, the app carries on as if it were empty.

function fileNamed(name: string): File {
  return new File(Paths.document, name);
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    const file = fileNamed(name);
    if (!file.exists) return fallback;
    return JSON.parse(file.textSync()) as T;
  } catch (error) {
    console.warn(`Could not read ${name}`, error);
    return fallback;
  }
}

export function writeJson(name: string, value: unknown): void {
  try {
    fileNamed(name).write(JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${name}`, error);
  }
}
