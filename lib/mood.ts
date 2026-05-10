import { RouteMood } from './types';

export type MoodMeta = {
  id: RouteMood;
  label: string;
  /** Ionicons icon name */
  icon: string;
};

export const MOOD_LIST: MoodMeta[] = [
  { id: 'RELAXED',  label: 'Relaxed',    icon: 'cafe-outline' },
  { id: 'HURRY',    label: 'In a hurry', icon: 'timer-outline' },
  { id: 'EXERCISE', label: 'Exercise',   icon: 'barbell-outline' },
  { id: 'CHEAPEST', label: 'Cheapest',   icon: 'wallet-outline' },
];

export function getMoodMeta(mood: RouteMood): MoodMeta | undefined {
  return MOOD_LIST.find((m) => m.id === mood);
}
