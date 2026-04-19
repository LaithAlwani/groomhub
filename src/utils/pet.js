/**
 * Calculate a human-readable age from a birthdate string (YYYY-MM-DD).
 * Returns null if no birthdate is provided.
 * - Under 1 month  → "< 1 month"
 * - Under 2 years  → "X months"
 * - 2 years+       → "X years"
 */
export function calcAge(birthdate) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;

  const now    = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (months < 1)  return "< 1 month";
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yrs`;
}
