import { createElement, type ReactElement } from 'react';
import { Dumbbell, MessagesSquare, Star, Video, type LucideIcon } from 'lucide-react-native';
import type { LevelKind } from '@/content/unit1';

// Each kind of level has its own icon on the path, as in Duolingo:
// a star for a lesson, a dumbbell for practice, speech bubbles for a roleplay.
export const LEVEL_ICONS: Record<LevelKind, LucideIcon> = {
  lesson: Star,
  practice: Dumbbell,
  roleplay: MessagesSquare,
};

// A level can show its own icon (the video lesson shows a video). Otherwise its kind decides.
export function levelIcon(level: { kind: LevelKind; icon?: 'video' }): LucideIcon {
  return level.icon === 'video' ? Video : LEVEL_ICONS[level.kind];
}

// The level's icon as an element, so screens can place it without defining a component during render.
export function levelIconElement(
  level: { kind: LevelKind; icon?: 'video' },
  props: { size: number; color: string; strokeWidth: number },
): ReactElement {
  return createElement(levelIcon(level), props);
}

export const LEVEL_LABELS: Record<LevelKind, string> = { lesson: 'Lesson', practice: 'Practice', roleplay: 'Roleplay' };
