// Somali mobile numbers are +252 followed by a 2-digit carrier prefix and a
// 7-digit subscriber number (9 digits total). Source: Wikipedia "Telephone
// numbers in Somalia".
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

export interface NormalizedSomaliPhone {
  e164: string;
  prefix: string;
  provider: string | null;
}

/**
 * Accepts a Somali mobile number in any common shape (+252XXXXXXXXX,
 * 252XXXXXXXXX, 0XXXXXXXXX, or the bare 9-digit national number) and
 * normalizes it to E.164 with the detected carrier, or null if it isn't a
 * 9-digit Somali national number.
 */
export function normalizeSomaliPhone(raw: string): NormalizedSomaliPhone | null {
  const digits = raw.replace(/\D/g, "");

  let national: string | null = null;
  if (digits.startsWith("252") && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  }

  if (!national) return null;

  const prefix = national.slice(0, 2);
  return { e164: `+252${national}`, prefix, provider: SOMALI_CARRIERS[prefix] ?? null };
}
