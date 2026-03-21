/**
 * Format an event price with currency, avoiding redundancy.
 * - "Gratuit" or empty → "Gratuit" (no currency)
 * - "10 000" + "CDF" → "10 000 CDF" (no double currency)
 */
export function formatEventPrice(price: string | null | undefined, currency?: string): string {
  if (!price || price.toLowerCase() === "gratuit") return "Gratuit";

  // Normalize currency: use CDF if FCFA or empty
  const cur = currency && currency !== "FCFA" ? currency : "CDF";

  // Check if price already contains a currency string to avoid "10 000 CDF CDF"
  const knownCurrencies = ["CDF", "FCFA", "USD", "EUR", "$", "€"];
  const priceUpper = price.toUpperCase();
  const alreadyHasCurrency = knownCurrencies.some((c) => priceUpper.includes(c));

  return alreadyHasCurrency ? price : `${price} ${cur}`;
}
