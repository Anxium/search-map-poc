import { properties, Property, Bounds, filterByBounds, TransactionType } from "@/data/properties";

export type SortOption = "relevance" | "priceLowToHigh" | "priceHighToLow" | "surfaceLargest";

export interface SearchParams {
  bounds: Bounds;
  transaction: TransactionType;
  types?: Property["type"][];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sort?: SortOption;
}

export interface SearchResult {
  properties: Property[];
  total: number;
}

const SIMULATED_DELAY_MS = 800;

// Relevance score: weighted combination of price proximity to median, completeness, and recency
function computeRelevanceScore(p: Property, medianPrice: number): number {
  // Price proximity to median (0-40 points): closer to median = higher score
  const priceDiff = Math.abs(p.price - medianPrice) / medianPrice;
  const priceScore = Math.max(0, 40 * (1 - priceDiff));

  // Completeness (0-30 points): more data = higher score
  let completeness = 0;
  completeness += p.images.length >= 4 ? 15 : p.images.length * 3;
  completeness += p.bedrooms > 0 ? 5 : 0;
  completeness += p.surface > 0 ? 5 : 0;
  completeness += p.address ? 5 : 0;

  // Recency (0-30 points): lower ID = "older", higher ID = "newer"
  const recencyScore = (p.id / 1500) * 30;

  return priceScore + completeness + recencyScore;
}

function sortProperties(results: Property[], sort: SortOption): Property[] {
  const sorted = [...results];

  switch (sort) {
    case "priceLowToHigh":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "priceHighToLow":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "surfaceLargest":
      sorted.sort((a, b) => b.surface - a.surface);
      break;
    case "relevance": {
      const prices = sorted.map((p) => p.price).sort((a, b) => a - b);
      const medianPrice = prices[Math.floor(prices.length / 2)] || 1;
      sorted.sort((a, b) => computeRelevanceScore(b, medianPrice) - computeRelevanceScore(a, medianPrice));
      break;
    }
  }

  return sorted;
}

export async function fetchProperties(params: SearchParams): Promise<SearchResult> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  let results = filterByBounds(properties, params.bounds);

  results = results.filter((p) => {
    if (p.transaction !== params.transaction) return false;
    if (params.minPrice != null && p.price < params.minPrice) return false;
    if (params.maxPrice != null && p.price > params.maxPrice) return false;
    if (params.types && params.types.length > 0 && !params.types.includes(p.type)) return false;
    if (params.minBedrooms != null && p.bedrooms < params.minBedrooms) return false;
    return true;
  });

  results = sortProperties(results, params.sort ?? "relevance");

  return {
    properties: results,
    total: results.length,
  };
}
