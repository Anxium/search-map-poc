import { properties, Property, Bounds, filterByBounds, TransactionType } from "@/data/properties";

export interface SearchParams {
  bounds: Bounds;
  transaction: TransactionType;
  types?: Property["type"][];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
}

export interface SearchResult {
  properties: Property[];
  total: number;
}

const SIMULATED_DELAY_MS = 800;

export async function fetchProperties(params: SearchParams): Promise<SearchResult> {
  // Simulate network latency
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

  return {
    properties: results,
    total: results.length,
  };
}
