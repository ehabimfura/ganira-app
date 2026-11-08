export const ADULT_AGE = 18;

// Simple subtraction on the birth year, as most apps do.
export function isAdult(birthYear: number, today = new Date()): boolean {
  return today.getUTCFullYear() - birthYear >= ADULT_AGE;
}
