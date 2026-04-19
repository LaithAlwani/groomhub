export function phoneIcon(type) {
  const t = type?.toLowerCase();
  if (t === "home")                  return "phone-home";
  if (t === "mobile" || t === "cell") return "phone";
  return "phone-work"; // main, work, or anything else
}

/**
 * Returns true if the query looks like a phone number (digits, dashes, spaces, parens).
 */
export function isPhoneQuery(q) {
  return /^\+?[\d\s\-\(\)]{4,}$/.test(q.trim());
}

/**
 * Normalise a raw phone string to xxx-xxx-xxxx.
 * 7-digit numbers get Ottawa area code 613 prepended.
 * Returns null if the input has no usable digits.
 */
export function normalizePhone(raw) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 7)
    return `613-${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim() || null;
}
