const priceFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

export function formatShortPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M €`;
  return `${Math.round(price / 1000)}k €`;
}
