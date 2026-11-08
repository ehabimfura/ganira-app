// Same rule as the API (api/src/auth/age.ts). The API has the final say;
// this copy only lets the app show the right screen without a round trip.
export const ADULT_AGE = 18;
export const EARLIEST_BIRTH_YEAR = 1900;

export function isAdult(birthYear: number, today = new Date()): boolean {
  return today.getFullYear() - birthYear >= ADULT_AGE;
}

export function parseBirthYear(text: string, today = new Date()): number | null {
  if (!/^\d{4}$/.test(text)) return null;
  const year = Number(text);
  return year >= EARLIEST_BIRTH_YEAR && year <= today.getFullYear() ? year : null;
}
