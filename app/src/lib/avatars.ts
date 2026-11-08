// Avatar ids are stored in the database; the emoji is only how the app draws them.
export const AVATARS = [
  { id: 'lion', emoji: '🦁' },
  { id: 'giraffe', emoji: '🦒' },
  { id: 'zebra', emoji: '🦓' },
  { id: 'elephant', emoji: '🐘' },
  { id: 'gorilla', emoji: '🦍' },
  { id: 'leopard', emoji: '🐆' },
  { id: 'hippo', emoji: '🦛' },
  { id: 'cow', emoji: '🐄' },
] as const;

export function avatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? '🙂';
}
