export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Same normalization as the frontend: drop a leading 252 / 0 so "0615…" matches "+252615…". */
export function nationalDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("252")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}
