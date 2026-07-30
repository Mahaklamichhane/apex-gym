/**
 * Minimum duration for a session to count toward stats (streak, workout count,
 * weekly volume, leaderboard). Shorter sessions are still saved and shown in
 * history — they just don't count. Kept in sync with the 1800s used in
 * database/migrations/0004_leaderboard.sql.
 */
export const MIN_WORKOUT_SECONDS = 30 * 60;
