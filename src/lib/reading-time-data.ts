export const READING_REWARD_HOURS = 10;
export const READING_REWARD_ETB = 100;
export const READING_REWARD_TARGET_SECONDS = READING_REWARD_HOURS * 60 * 60;
/** Matches 100 ETB at 8 XP = 1 ETB */
export const READING_REWARD_XP = 800;

export function formatReadingDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function readingProgressPercent(totalSeconds: number): number {
  if (READING_REWARD_TARGET_SECONDS <= 0) return 0;
  return Math.min(100, Math.round((totalSeconds / READING_REWARD_TARGET_SECONDS) * 100));
}

export function readingHoursRemaining(totalSeconds: number): number {
  const remaining = Math.max(0, READING_REWARD_TARGET_SECONDS - totalSeconds);
  return Math.ceil(remaining / 3600);
}
