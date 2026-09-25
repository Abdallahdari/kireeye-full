const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats a US-dollar amount; "—" for listings created before prices existed. */
export function formatUsd(amount: number | null | undefined): string {
  return typeof amount === "number" ? usd.format(amount) : "—";
}

const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  // Fixed zone so the server and browser render the same text (no hydration mismatch).
  timeZone: "UTC",
});

/** "Sep 23, 2026"; "" when there's no date. */
export function formatDate(value: string | null | undefined): string {
  return value ? longDate.format(new Date(value)) : "";
}
