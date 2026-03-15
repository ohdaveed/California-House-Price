export type OceanProximity = "<1H OCEAN" | "INLAND" | "ISLAND" | "NEAR BAY" | "NEAR OCEAN";

export type CaCity = {
  name: string;
  latitude: number;
  longitude: number;
  oceanProximity: OceanProximity;
  totalRooms: number;
  totalBedrooms: number;
  population: number;
  households: number;
};

export const CA_CITIES: CaCity[] = [
  { name: "San Francisco", latitude: 37.77, longitude: -122.42, oceanProximity: "NEAR BAY", totalRooms: 2800, totalBedrooms: 580, population: 1100, households: 420 },
  { name: "Los Angeles", latitude: 34.05, longitude: -118.24, oceanProximity: "<1H OCEAN", totalRooms: 2200, totalBedrooms: 490, population: 1350, households: 390 },
  { name: "San Diego", latitude: 32.72, longitude: -117.16, oceanProximity: "<1H OCEAN", totalRooms: 2100, totalBedrooms: 460, population: 1200, households: 380 },
  { name: "San Jose", latitude: 37.34, longitude: -121.89, oceanProximity: "<1H OCEAN", totalRooms: 2500, totalBedrooms: 520, population: 1300, households: 410 },
  { name: "Sacramento", latitude: 38.58, longitude: -121.49, oceanProximity: "INLAND", totalRooms: 1900, totalBedrooms: 430, population: 1050, households: 360 },
  { name: "Oakland", latitude: 37.80, longitude: -122.27, oceanProximity: "NEAR BAY", totalRooms: 2300, totalBedrooms: 510, population: 1150, households: 400 },
  { name: "Berkeley", latitude: 37.87, longitude: -122.27, oceanProximity: "NEAR BAY", totalRooms: 2600, totalBedrooms: 550, population: 950, households: 390 },
  { name: "Fresno", latitude: 36.74, longitude: -119.79, oceanProximity: "INLAND", totalRooms: 1700, totalBedrooms: 400, population: 1100, households: 340 },
  { name: "Bakersfield", latitude: 35.37, longitude: -119.02, oceanProximity: "INLAND", totalRooms: 1600, totalBedrooms: 380, population: 1050, households: 330 },
  { name: "Long Beach", latitude: 33.77, longitude: -118.19, oceanProximity: "<1H OCEAN", totalRooms: 2000, totalBedrooms: 450, population: 1200, households: 370 },
  { name: "Anaheim", latitude: 33.84, longitude: -117.91, oceanProximity: "<1H OCEAN", totalRooms: 1950, totalBedrooms: 440, population: 1180, households: 365 },
  { name: "Santa Ana", latitude: 33.75, longitude: -117.87, oceanProximity: "<1H OCEAN", totalRooms: 1850, totalBedrooms: 430, population: 1250, households: 360 },
  { name: "Riverside", latitude: 33.98, longitude: -117.37, oceanProximity: "INLAND", totalRooms: 1800, totalBedrooms: 410, population: 1100, households: 350 },
  { name: "Stockton", latitude: 37.96, longitude: -121.29, oceanProximity: "INLAND", totalRooms: 1700, totalBedrooms: 400, population: 1080, households: 340 },
  { name: "Santa Barbara", latitude: 34.42, longitude: -119.70, oceanProximity: "NEAR OCEAN", totalRooms: 2200, totalBedrooms: 470, population: 980, households: 370 },
  { name: "Santa Cruz", latitude: 36.97, longitude: -122.03, oceanProximity: "NEAR OCEAN", totalRooms: 2100, totalBedrooms: 450, population: 920, households: 355 },
  { name: "Monterey", latitude: 36.60, longitude: -121.89, oceanProximity: "NEAR OCEAN", totalRooms: 2000, totalBedrooms: 440, population: 900, households: 345 },
  { name: "Malibu", latitude: 34.03, longitude: -118.68, oceanProximity: "NEAR OCEAN", totalRooms: 2900, totalBedrooms: 580, population: 750, households: 290 },
  { name: "Santa Rosa", latitude: 38.44, longitude: -122.71, oceanProximity: "<1H OCEAN", totalRooms: 2000, totalBedrooms: 440, population: 1050, households: 360 },
  { name: "Napa", latitude: 38.30, longitude: -122.29, oceanProximity: "NEAR BAY", totalRooms: 2100, totalBedrooms: 450, population: 980, households: 355 },
];

export const OCEAN_PROXIMITY_LABELS: Record<OceanProximity, string> = {
  "<1H OCEAN": "Within 1 hour of ocean",
  "INLAND": "Inland",
  "ISLAND": "Island",
  "NEAR BAY": "Near bay",
  "NEAR OCEAN": "Near ocean (coastal)",
};

export const BEDROOM_PRESETS: { label: string; rooms: number; bedrooms: number }[] = [
  { label: "Studio / 1 bed", rooms: 900, bedrooms: 180 },
  { label: "2 bedrooms", rooms: 1600, bedrooms: 320 },
  { label: "3 bedrooms", rooms: 2200, bedrooms: 460 },
  { label: "4 bedrooms", rooms: 3000, bedrooms: 620 },
  { label: "5+ bedrooms", rooms: 4200, bedrooms: 900 },
];

export const DISTRICT_SIZE_PRESETS: { label: string; population: number; households: number }[] = [
  { label: "Small (quiet area)", population: 500, households: 180 },
  { label: "Medium", population: 1100, households: 380 },
  { label: "Large (busy area)", population: 2200, households: 700 },
  { label: "Very large (dense urban)", population: 4000, households: 1300 },
];
