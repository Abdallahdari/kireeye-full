// Kept in sync with backend/src/utils/somaliPhone.ts — Somali mobile numbers
// are +252 followed by a 2-digit carrier prefix and a 7-digit subscriber
// number (9 digits total).
export const SOMALI_CARRIERS: Record<string, string> = {
  "61": "Hormuud",
  "77": "Hormuud",
  "62": "Somtel",
  "65": "Somtel",
  "66": "Somtel",
  "63": "Telesom",
  "64": "SomLink",
  "68": "SomNet",
  "69": "NationLink",
  "71": "Amtel",
  "90": "Golis",
};

export const SOMALI_NATIONAL_NUMBER_LENGTH = 9;

/** Distinct network names, e.g. for a "phone provider" filter. */
export const SOMALI_PROVIDERS = [...new Set(Object.values(SOMALI_CARRIERS))];

export function detectSomaliProvider(nationalDigits: string): string | null {
  if (nationalDigits.length < 2) return null;
  return SOMALI_CARRIERS[nationalDigits.slice(0, 2)] ?? null;
}

/** Strips any +252/252/0 prefix a user might paste in, leaving the 9-digit national number. */
export function toSomaliNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("252")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, SOMALI_NATIONAL_NUMBER_LENGTH);
}

export function formatSomaliNationalDigits(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)].filter(Boolean).join(" ");
}

/**
 * For displaying an already-stored phone number. Only reformats numbers that
 * are actually in +252 form (all new registrations are); anything else —
 * e.g. legacy/seed data in another format — is shown as stored, untouched.
 */
export function describeSomaliPhone(stored: string): { formatted: string; provider: string | null } {
  const digits = stored.replace(/\D/g, "");
  if (!digits.startsWith("252") || digits.length !== 3 + SOMALI_NATIONAL_NUMBER_LENGTH) {
    return { formatted: stored, provider: null };
  }

  const national = digits.slice(3);
  return { formatted: `+252 ${formatSomaliNationalDigits(national)}`, provider: detectSomaliProvider(national) };
}
