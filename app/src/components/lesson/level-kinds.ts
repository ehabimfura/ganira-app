import { Dumbbell, MessagesSquare, Star, type LucideIcon } from 'lucide-react-native';
import type { LevelKind } from '@/content/unit1';

// Each kind of level has its own icon on the path, as in Duolingo:
// a star for a lesson, a dumbbell for practice, speech bubbles for a roleplay.
export const LEVEL_ICONS: Record<LevelKind, LucideIcon> = {
  lesson: Star,
  practice: Dumbbell,
  roleplay: MessagesSquare,
};

export const LEVEL_LABELS: Record<LevelKind, string> = { lesson: 'Lesson', practice: 'Practice', roleplay: 'Roleplay' };
