export type TransactionType = "buy" | "rent";

export interface Property {
  id: number;
  lat: number;
  lng: number;
  price: number;
  address: string;
  postalCode: string;
  type: "apartment" | "house" | "studio";
  transaction: TransactionType;
  bedrooms: number;
  surface: number;
  images: string[];
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function filterByBounds(list: Property[], bounds: Bounds): Property[] {
  return list.filter(
    (p) =>
      p.lat >= bounds.south &&
      p.lat <= bounds.north &&
      p.lng >= bounds.west &&
      p.lng <= bounds.east,
  );
}

// Photos per property type
const photosByType: Record<string, string[]> = {
  house: [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1602343168117-bb8bbe3ce6e3?w=400&h=300&fit=crop",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=300&fit=crop",
  ],
  studio: [
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
  ],
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = seededRandom(42);

interface CityDef {
  name: string;
  lat: number;
  lng: number;
  weight: number;
  postalPrefix: number;
  streets: string[];
}

const BELGIUM_CITIES: CityDef[] = [
  {
    name: "Bruxelles", lat: 50.8503, lng: 4.3517, weight: 0.25, postalPrefix: 1000,
    streets: ["Rue de la Loi", "Avenue Louise", "Boulevard Anspach", "Rue Neuve", "Rue Royale", "Chaussée de Waterloo", "Rue du Bailli", "Avenue Franklin Roosevelt", "Rue de Flandre", "Rue Haute", "Avenue de la Couronne", "Rue Dansaert", "Rue du Marché aux Herbes"],
  },
  {
    name: "Antwerpen", lat: 51.2194, lng: 4.4025, weight: 0.15, postalPrefix: 2000,
    streets: ["Meir", "Nationalestraat", "Kammenstraat", "Kloosterstraat", "Lange Gasthuisstraat", "Frankrijklei", "Italië lei", "Schuttershofstraat"],
  },
  {
    name: "Gent", lat: 51.0543, lng: 3.7174, weight: 0.10, postalPrefix: 9000,
    streets: ["Veldstraat", "Korenmarkt", "Graslei", "Vrijdagmarkt", "Coupure", "Sint-Pietersnieuwstraat", "Overpoortstraat"],
  },
  {
    name: "Bruges", lat: 51.2093, lng: 3.2247, weight: 0.07, postalPrefix: 8000,
    streets: ["Steenstraat", "Markt", "Langestraat", "Noordzandstraat", "Smedenstraat", "Katelijnestraat"],
  },
  {
    name: "Liège", lat: 50.6326, lng: 5.5797, weight: 0.10, postalPrefix: 4000,
    streets: ["Rue de la Cathédrale", "Boulevard d'Avroy", "Rue Saint-Gilles", "Place Saint-Lambert", "Rue Hors-Château", "Quai de la Batte"],
  },
  {
    name: "Namur", lat: 50.4674, lng: 4.8712, weight: 0.07, postalPrefix: 5000,
    streets: ["Rue de l'Ange", "Rue de Fer", "Place d'Armes", "Rue de Bruxelles", "Boulevard Cauchy", "Rue Emile Cuvelier"],
  },
  {
    name: "Charleroi", lat: 50.4108, lng: 4.4446, weight: 0.07, postalPrefix: 6000,
    streets: ["Boulevard Tirou", "Rue de la Montagne", "Boulevard Devreux", "Rue de Marcinelle", "Place Charles II"],
  },
  {
    name: "Leuven", lat: 50.8798, lng: 4.7005, weight: 0.07, postalPrefix: 3000,
    streets: ["Bondgenotenlaan", "Naamsestraat", "Tiensestraat", "Brusselsestraat", "Diestsestraat", "Parijsstraat"],
  },
];

// Belgium boundary polygon [lng, lat] from natural earth data
const BELGIUM_POLYGON: [number, number][] = [
  [3.314971,51.345781],[4.047071,51.267259],[4.973991,51.475024],[5.606976,51.037298],
  [6.156658,50.803721],[6.043073,50.128052],[5.782417,50.090328],[5.674052,49.529484],
  [4.799222,49.985373],[4.286023,49.907497],[3.588184,50.378992],[3.123252,50.780363],
  [2.658422,50.796848],[2.513573,51.148506],[3.314971,51.345781],
];

// Ray-casting point-in-polygon (lng, lat order to match the polygon)
function isInBelgium(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = BELGIUM_POLYGON.length - 1; i < BELGIUM_POLYGON.length; j = i++) {
    const [xi, yi] = BELGIUM_POLYGON[i];
    const [xj, yj] = BELGIUM_POLYGON[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const RURAL_WEIGHT = 0.12;
const TOTAL_PROPERTIES = 1500;

const types: Property["type"][] = ["apartment", "house", "studio"];

function pickCity(): CityDef | null {
  const r = rand();
  if (r < RURAL_WEIGHT) return null; // rural scatter
  let cumulative = RURAL_WEIGHT;
  for (const city of BELGIUM_CITIES) {
    cumulative += city.weight;
    if (r < cumulative) return city;
  }
  return BELGIUM_CITIES[0];
}

function getPropertyImages(index: number, type: Property["type"]): string[] {
  const pool = photosByType[type];
  const count = 4 + (index % 3);
  const images: string[] = [];
  for (let j = 0; j < count; j++) {
    images.push(pool[(index + j) % pool.length]);
  }
  return images;
}

export const properties: Property[] = Array.from({ length: TOTAL_PROPERTIES }, (_, i) => {
  const city = pickCity();
  const type = types[Math.floor(rand() * types.length)];
  const transaction: TransactionType = rand() < 0.6 ? "buy" : "rent";

  let lat: number, lng: number, postalCode: string, address: string;

  if (city) {
    lat = city.lat + (rand() - 0.5) * 0.06;
    lng = city.lng + (rand() - 0.5) * 0.08;
    postalCode = `${city.postalPrefix + Math.floor(rand() * 50)} ${city.name}`;
    address = `${Math.floor(rand() * 200) + 1} ${city.streets[Math.floor(rand() * city.streets.length)]}`;
  } else {
    // Rural: scatter within Belgium using actual boundary polygon
    do {
      lat = 49.5 + rand() * 2.0;
      lng = 2.5 + rand() * 3.7;
    } while (!isInBelgium(lat, lng));
    postalCode = `${Math.floor(1000 + rand() * 8000)} Belgique`;
    const ruralStreets = ["Rue Principale", "Grand-Route", "Chaussée de", "Steenweg", "Dorpsstraat", "Kerkstraat"];
    address = `${Math.floor(rand() * 200) + 1} ${ruralStreets[Math.floor(rand() * ruralStreets.length)]}`;
  }

  const bedrooms =
    type === "studio" ? 0 : type === "apartment" ? 1 + Math.floor(rand() * 3) : 2 + Math.floor(rand() * 4);
  const surface =
    type === "studio"
      ? 20 + Math.floor(rand() * 30)
      : type === "apartment"
        ? 40 + Math.floor(rand() * 80)
        : 80 + Math.floor(rand() * 150);

  let price: number;
  if (transaction === "rent") {
    const baseRent = type === "studio" ? 500 : type === "apartment" ? 700 : 1200;
    price = Math.round((baseRent + surface * 5 + rand() * 500) / 50) * 50;
  } else {
    const basePrice = type === "studio" ? 150000 : type === "apartment" ? 200000 : 350000;
    price = Math.round((basePrice + surface * 1500 + rand() * 200000) / 1000) * 1000;
  }

  return {
    id: i + 1,
    lat,
    lng,
    price,
    address,
    postalCode,
    type,
    transaction,
    bedrooms,
    surface,
    images: getPropertyImages(i, type),
  };
});

const buyProperties = properties.filter((p) => p.transaction === "buy");
const rentProperties = properties.filter((p) => p.transaction === "rent");

export const BUY_MIN_PRICE = Math.min(...buyProperties.map((p) => p.price));
export const BUY_MAX_PRICE = Math.max(...buyProperties.map((p) => p.price));
export const RENT_MIN_PRICE = Math.min(...rentProperties.map((p) => p.price));
export const RENT_MAX_PRICE = Math.max(...rentProperties.map((p) => p.price));

export function getPriceRange(transaction: TransactionType) {
  return transaction === "buy"
    ? { min: BUY_MIN_PRICE, max: BUY_MAX_PRICE }
    : { min: RENT_MIN_PRICE, max: RENT_MAX_PRICE };
}
