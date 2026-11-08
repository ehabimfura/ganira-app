export const ADULT_AGE = 18;

// We store only the birth year, so someone born this year minus 18 may still
// be 17. To be safe, they count as an adult only once they are surely 18.
export function isSurelyAdult(birthYear: number, today = new Date()): boolean {
  const youngestPossibleAge = today.getUTCFullYear() - birthYear - 1;
  return youngestPossibleAge >= ADULT_AGE;
}
