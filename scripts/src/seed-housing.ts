import { db, housingDistrictsTable, starbucksLocationsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding housing districts...");

  await db.delete(housingDistrictsTable);
  await db.delete(starbucksLocationsTable);

  // Generate synthetic 1990 California census housing data
  // Based on the real dataset distribution
  const oceanProximities = ["NEAR BAY", "NEAR OCEAN", "INLAND", "<1H OCEAN", "ISLAND"];
  const proximityWeights = [0.18, 0.20, 0.32, 0.29, 0.01];

  // California bounding box roughly: lat 32.5-42, lon -124 to -114
  const regions = [
    // Bay Area
    { latMin: 37.2, latMax: 38.0, lonMin: -122.8, lonMax: -121.7, proximity: "NEAR BAY", priceBase: 280000, incomeBase: 4.5 },
    // LA Coast
    { latMin: 33.7, latMax: 34.4, lonMin: -118.6, lonMax: -117.8, proximity: "NEAR OCEAN", priceBase: 320000, incomeBase: 4.2 },
    // San Diego coast
    { latMin: 32.6, latMax: 33.3, lonMin: -117.4, lonMax: -116.9, proximity: "NEAR OCEAN", priceBase: 265000, incomeBase: 3.8 },
    // Central Valley (inland)
    { latMin: 35.0, latMax: 38.0, lonMin: -121.5, lonMax: -119.0, proximity: "INLAND", priceBase: 115000, incomeBase: 2.5 },
    // North Coast (near ocean)
    { latMin: 38.5, latMax: 41.0, lonMin: -124.0, lonMax: -123.0, proximity: "NEAR OCEAN", priceBase: 155000, incomeBase: 2.8 },
    // LA suburbs
    { latMin: 33.8, latMax: 34.2, lonMin: -118.4, lonMax: -117.5, proximity: "<1H OCEAN", priceBase: 210000, incomeBase: 3.6 },
    // Sacramento area
    { latMin: 38.3, latMax: 38.8, lonMin: -121.6, lonMax: -121.0, proximity: "INLAND", priceBase: 130000, incomeBase: 3.0 },
    // Orange County
    { latMin: 33.5, latMax: 33.9, lonMin: -118.1, lonMax: -117.5, proximity: "<1H OCEAN", priceBase: 260000, incomeBase: 4.0 },
    // SF Peninsula
    { latMin: 37.4, latMax: 37.8, lonMin: -122.5, lonMax: -122.0, proximity: "NEAR BAY", priceBase: 420000, incomeBase: 6.5 },
    // San Jose area
    { latMin: 37.1, latMax: 37.5, lonMin: -122.1, lonMax: -121.6, proximity: "NEAR BAY", priceBase: 330000, incomeBase: 5.5 },
    // Inland Empire
    { latMin: 33.8, latMax: 34.2, lonMin: -117.6, lonMax: -116.8, proximity: "INLAND", priceBase: 140000, incomeBase: 2.8 },
    // Fresno area
    { latMin: 36.5, latMax: 37.1, lonMin: -120.2, lonMax: -119.5, proximity: "INLAND", priceBase: 95000, incomeBase: 2.2 },
  ];

  const districts = [];
  const numDistricts = 20640; // matches real dataset size

  for (let i = 0; i < numDistricts; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
    const lon = region.lonMin + Math.random() * (region.lonMax - region.lonMin);
    const age = Math.max(1, Math.min(52, Math.round(1 + Math.random() * 51)));
    const households = Math.round(200 + Math.random() * 1800);
    const rooms = Math.round(households * (3 + Math.random() * 6));
    const bedrooms = Math.random() < 0.01 ? null : Math.round(rooms * (0.15 + Math.random() * 0.12));
    const population = Math.round(households * (2 + Math.random() * 3));
    const income = Math.max(0.5, region.incomeBase + (Math.random() - 0.5) * 3);
    
    // Price model: income is main driver + location + age + random noise
    const priceFromIncome = income * 42000;
    const agePenalty = age > 30 ? -age * 1000 : 0;
    const noise = (Math.random() - 0.5) * 80000;
    let price = Math.max(14999, Math.min(500001, region.priceBase + priceFromIncome * 0.5 + agePenalty + noise));
    // 500001 is census cap
    if (Math.random() < 0.04) price = 500001;

    districts.push({
      longitude: lon,
      latitude: lat,
      housingMedianAge: age,
      totalRooms: rooms,
      totalBedrooms: bedrooms,
      population,
      households,
      medianIncome: parseFloat(income.toFixed(4)),
      medianHouseValue: Math.round(price),
      oceanProximity: region.proximity,
      roomsPerHousehold: parseFloat((rooms / households).toFixed(4)),
      bedroomsPerRoom: bedrooms != null ? parseFloat((bedrooms / rooms).toFixed(4)) : null,
      populationPerHousehold: parseFloat((population / households).toFixed(4)),
    });
  }

  // Batch insert in chunks of 500
  for (let i = 0; i < districts.length; i += 500) {
    await db.insert(housingDistrictsTable).values(districts.slice(i, i + 500));
    if (i % 5000 === 0) console.log(`  Inserted ${i + 500} / ${districts.length}`);
  }

  console.log(`Seeded ${districts.length} housing districts`);

  // Seed realistic Starbucks locations in California with opening years
  // Starbucks expanded aggressively 1994-2006 in California
  const starbucksData = [
    // Bay Area locations
    { name: "Starbucks - Union Square SF", latitude: 37.7878, longitude: -122.4074, city: "San Francisco", openYear: 1994 },
    { name: "Starbucks - Market St SF", latitude: 37.7749, longitude: -122.4194, city: "San Francisco", openYear: 1995 },
    { name: "Starbucks - Castro SF", latitude: 37.7608, longitude: -122.4350, city: "San Francisco", openYear: 1996 },
    { name: "Starbucks - Mission SF", latitude: 37.7599, longitude: -122.4148, city: "San Francisco", openYear: 1997 },
    { name: "Starbucks - Haight St SF", latitude: 37.7692, longitude: -122.4481, city: "San Francisco", openYear: 1998 },
    { name: "Starbucks - North Beach SF", latitude: 37.8006, longitude: -122.4103, city: "San Francisco", openYear: 1999 },
    { name: "Starbucks - Downtown Oakland", latitude: 37.8044, longitude: -122.2712, city: "Oakland", openYear: 1996 },
    { name: "Starbucks - Temescal Oakland", latitude: 37.8358, longitude: -122.2697, city: "Oakland", openYear: 2000 },
    { name: "Starbucks - Berkeley Downtown", latitude: 37.8716, longitude: -122.2727, city: "Berkeley", openYear: 1995 },
    { name: "Starbucks - Telegraph Ave Berkeley", latitude: 37.8585, longitude: -122.2603, city: "Berkeley", openYear: 1997 },
    { name: "Starbucks - Palo Alto", latitude: 37.4419, longitude: -122.1430, city: "Palo Alto", openYear: 1994 },
    { name: "Starbucks - Stanford Shopping Center", latitude: 37.4436, longitude: -122.1699, city: "Palo Alto", openYear: 1998 },
    { name: "Starbucks - Mountain View", latitude: 37.3861, longitude: -122.0839, city: "Mountain View", openYear: 1999 },
    { name: "Starbucks - Sunnyvale", latitude: 37.3688, longitude: -122.0363, city: "Sunnyvale", openYear: 2000 },
    { name: "Starbucks - San Jose Downtown", latitude: 37.3382, longitude: -121.8863, city: "San Jose", openYear: 1996 },
    { name: "Starbucks - Santana Row San Jose", latitude: 37.3177, longitude: -121.9477, city: "San Jose", openYear: 2002 },
    { name: "Starbucks - Saratoga Ave San Jose", latitude: 37.3239, longitude: -121.9795, city: "San Jose", openYear: 2003 },
    { name: "Starbucks - Los Gatos", latitude: 37.2358, longitude: -121.9624, city: "Los Gatos", openYear: 2001 },
    { name: "Starbucks - Walnut Creek", latitude: 37.9101, longitude: -122.0652, city: "Walnut Creek", openYear: 1997 },
    { name: "Starbucks - Pleasanton", latitude: 37.6624, longitude: -121.8747, city: "Pleasanton", openYear: 2001 },
    { name: "Starbucks - Fremont", latitude: 37.5485, longitude: -121.9886, city: "Fremont", openYear: 2000 },
    // LA Area
    { name: "Starbucks - Hollywood Blvd", latitude: 34.1016, longitude: -118.3267, city: "Los Angeles", openYear: 1994 },
    { name: "Starbucks - Santa Monica 3rd St", latitude: 34.0195, longitude: -118.4912, city: "Santa Monica", openYear: 1995 },
    { name: "Starbucks - Venice Beach", latitude: 33.9850, longitude: -118.4695, city: "Venice", openYear: 1999 },
    { name: "Starbucks - Beverly Hills", latitude: 34.0669, longitude: -118.4034, city: "Beverly Hills", openYear: 1996 },
    { name: "Starbucks - Westwood", latitude: 34.0636, longitude: -118.4469, city: "Los Angeles", openYear: 1997 },
    { name: "Starbucks - Silver Lake", latitude: 34.0875, longitude: -118.2720, city: "Los Angeles", openYear: 2001 },
    { name: "Starbucks - Culver City", latitude: 34.0211, longitude: -118.3965, city: "Culver City", openYear: 2000 },
    { name: "Starbucks - Pasadena", latitude: 34.1478, longitude: -118.1445, city: "Pasadena", openYear: 1998 },
    { name: "Starbucks - Burbank", latitude: 34.1808, longitude: -118.3090, city: "Burbank", openYear: 1999 },
    { name: "Starbucks - Glendale", latitude: 34.1425, longitude: -118.2551, city: "Glendale", openYear: 2000 },
    { name: "Starbucks - Torrance", latitude: 33.8358, longitude: -118.3406, city: "Torrance", openYear: 2001 },
    { name: "Starbucks - Long Beach", latitude: 33.7701, longitude: -118.1937, city: "Long Beach", openYear: 1998 },
    { name: "Starbucks - Encino", latitude: 34.1577, longitude: -118.5011, city: "Encino", openYear: 2002 },
    { name: "Starbucks - Sherman Oaks", latitude: 34.1503, longitude: -118.4493, city: "Sherman Oaks", openYear: 2003 },
    // Orange County
    { name: "Starbucks - Irvine Spectrum", latitude: 33.6459, longitude: -117.7431, city: "Irvine", openYear: 1999 },
    { name: "Starbucks - Newport Beach", latitude: 33.6189, longitude: -117.9298, city: "Newport Beach", openYear: 1997 },
    { name: "Starbucks - Laguna Beach", latitude: 33.5427, longitude: -117.7854, city: "Laguna Beach", openYear: 2001 },
    { name: "Starbucks - Huntington Beach", latitude: 33.6595, longitude: -118.0000, city: "Huntington Beach", openYear: 2000 },
    { name: "Starbucks - Anaheim", latitude: 33.8353, longitude: -117.9145, city: "Anaheim", openYear: 1998 },
    { name: "Starbucks - Costa Mesa", latitude: 33.6411, longitude: -117.9187, city: "Costa Mesa", openYear: 2002 },
    // San Diego
    { name: "Starbucks - Gaslamp Quarter", latitude: 32.7102, longitude: -117.1595, city: "San Diego", openYear: 1995 },
    { name: "Starbucks - La Jolla", latitude: 32.8328, longitude: -117.2713, city: "La Jolla", openYear: 1996 },
    { name: "Starbucks - Mission Valley", latitude: 32.7673, longitude: -117.1630, city: "San Diego", openYear: 2000 },
    { name: "Starbucks - North Park SD", latitude: 32.7415, longitude: -117.1292, city: "San Diego", openYear: 2002 },
    { name: "Starbucks - Pacific Beach", latitude: 32.7997, longitude: -117.2388, city: "San Diego", openYear: 2001 },
    { name: "Starbucks - Chula Vista", latitude: 32.6401, longitude: -117.0842, city: "Chula Vista", openYear: 2003 },
    // Sacramento
    { name: "Starbucks - Sacramento Downtown", latitude: 38.5816, longitude: -121.4944, city: "Sacramento", openYear: 1996 },
    { name: "Starbucks - Midtown Sacramento", latitude: 38.5752, longitude: -121.4829, city: "Sacramento", openYear: 1999 },
    { name: "Starbucks - Folsom", latitude: 38.6779, longitude: -121.1761, city: "Folsom", openYear: 2002 },
    { name: "Starbucks - Roseville", latitude: 38.7521, longitude: -121.2880, city: "Roseville", openYear: 2001 },
    // Central Valley
    { name: "Starbucks - Fresno Downtown", latitude: 36.7378, longitude: -119.7871, city: "Fresno", openYear: 2000 },
    { name: "Starbucks - Stockton", latitude: 37.9577, longitude: -121.2908, city: "Stockton", openYear: 2001 },
    { name: "Starbucks - Modesto", latitude: 37.6391, longitude: -120.9969, city: "Modesto", openYear: 2002 },
    { name: "Starbucks - Bakersfield", latitude: 35.3733, longitude: -119.0187, city: "Bakersfield", openYear: 2003 },
    // Wine Country / North Bay
    { name: "Starbucks - Napa", latitude: 38.2975, longitude: -122.2869, city: "Napa", openYear: 2000 },
    { name: "Starbucks - Santa Rosa", latitude: 38.4404, longitude: -122.7141, city: "Santa Rosa", openYear: 1999 },
    { name: "Starbucks - San Rafael", latitude: 37.9735, longitude: -122.5311, city: "San Rafael", openYear: 1998 },
    // Santa Barbara / Central Coast
    { name: "Starbucks - Santa Barbara State St", latitude: 34.4208, longitude: -119.6982, city: "Santa Barbara", openYear: 1997 },
    { name: "Starbucks - San Luis Obispo", latitude: 35.2828, longitude: -120.6596, city: "San Luis Obispo", openYear: 2001 },
    { name: "Starbucks - Ventura", latitude: 34.2746, longitude: -119.2290, city: "Ventura", openYear: 2000 },
  ];

  await db.insert(starbucksLocationsTable).values(starbucksData);
  console.log(`Seeded ${starbucksData.length} Starbucks locations`);

  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
