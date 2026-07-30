/**
 * Name-based auth: Supabase Auth needs an email, but we only ask users for a
 * name + password. We derive a stable hidden email from the name so the whole
 * email/password + RLS machinery works unchanged. The real name is stored on
 * the profile (display_name).
 */
export function usernameToEmail(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${slug}@apex-gym.app`;
}

/** True if the name yields a usable handle (at least one letter/number). */
export function isValidUsername(name: string): boolean {
  return /[a-z0-9]/i.test(name);
}
