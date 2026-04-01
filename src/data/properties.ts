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

// Curated Unsplash photos per property type
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

// Seeded random for reproducible data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = seededRandom(42);

const streets = [
  "Rue de la Loi",
  "Avenue Louise",
  "Boulevard Anspach",
  "Rue Neuve",
  "Avenue de Tervueren",
  "Rue Royale",
  "Chaussée de Waterloo",
  "Rue du Bailli",
  "Avenue Franklin Roosevelt",
  "Rue de Flandre",
  "Rue Haute",
  "Boulevard du Jardin Botanique",
  "Avenue de la Couronne",
  "Rue de Namur",
  "Chaussée d'Ixelles",
  "Rue du Midi",
  "Avenue Brugmann",
  "Rue de l'Ecuyer",
  "Boulevard de Waterloo",
  "Rue des Chartreux",
  "Avenue du Diamant",
  "Rue Marie-Christine",
  "Chaussée de Louvain",
  "Avenue Jean Volders",
  "Rue de Laeken",
  "Boulevard Léopold II",
  "Rue Dansaert",
  "Avenue de Stalingrad",
  "Rue du Marché aux Herbes",
  "Chaussée de Charleroi",
];

const types: Property["type"][] = ["apartment", "house", "studio"];

// Brussels center approx 50.8503, 4.3517
const BRUSSELS_CENTER_LAT = 50.8503;
const BRUSSELS_CENTER_LNG = 4.3517;

function getPropertyImages(index: number, type: Property["type"]): string[] {
  const pool = photosByType[type];
  const count = 4 + (index % 3);
  const images: string[] = [];
  for (let j = 0; j < count; j++) {
    images.push(pool[(index + j) % pool.length]);
  }
  return images;
}

export const properties: Property[] = Array.from({ length: 200 }, (_, i) => {
  const type = types[Math.floor(rand() * types.length)];
  const transaction: TransactionType = rand() < 0.6 ? "buy" : "rent";
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
    // Monthly rent: 500-2500€
    const baseRent = type === "studio" ? 500 : type === "apartment" ? 700 : 1200;
    price = Math.round((baseRent + surface * 5 + rand() * 500) / 50) * 50;
  } else {
    const basePrice = type === "studio" ? 150000 : type === "apartment" ? 200000 : 350000;
    price = Math.round((basePrice + surface * 1500 + rand() * 200000) / 1000) * 1000;
  }

  return {
    id: i + 1,
    lat: BRUSSELS_CENTER_LAT + (rand() - 0.5) * 0.08,
    lng: BRUSSELS_CENTER_LNG + (rand() - 0.5) * 0.12,
    price,
    address: `${Math.floor(rand() * 200) + 1} ${streets[Math.floor(rand() * streets.length)]}`,
    postalCode: `${1000 + (i % 200)} Bruxelles`,
    type,
    transaction,
    bedrooms,
    surface,
    images: getPropertyImages(i, type),
  };
});

// Price bounds per transaction type
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
