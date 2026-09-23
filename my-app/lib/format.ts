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
