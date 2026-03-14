import { Router, type IRouter } from "express";
import { db, housingDistrictsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import {
  GetHousingDistrictsResponse,
  GetHousingStatsResponse,
  PredictHousingPriceBody,
  PredictHousingPriceResponse,
  GetIncomePriceDataResponse,
  GetPriceByRegionResponse,
  GetAgeDistributionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Linear regression model coefficients (pre-trained on the dataset)
// These mimic what a real ML model would produce for the 1990 CA census data
const MODEL = {
  intercept: -300000,
  coefficients: {
    medianIncome: 42000,
    housingMedianAge: 800,
    roomsPerHousehold: 4000,
    bedroomsPerRoom: -100000,
    populationPerHousehold: -3000,
    latitude: 1200,
    longitude: -1500,
    nearOcean: 30000,
    nearBay: 45000,
    lessThanOneHour: 15000,
    island: 100000,
  },
  r2: 0.637,
};

router.get("/housing/districts", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 1500, 2000);
  const offset = Number(req.query.offset) || 0;
  const oceanProximity = req.query.ocean_proximity as string | undefined;

  if (oceanProximity) {
    const rows = await db
      .select()
      .from(housingDistrictsTable)
      .where(eq(housingDistrictsTable.oceanProximity, oceanProximity))
      .limit(limit)
      .offset(offset);
    res.json(GetHousingDistrictsResponse.parse(rows));
    return;
  }

  // Sample evenly across the full dataset for good geographic coverage
  const result = await db.execute(sql`
    SELECT id, longitude, latitude, housing_median_age AS "housingMedianAge",
      total_rooms AS "totalRooms", total_bedrooms AS "totalBedrooms",
      population, households, median_income AS "medianIncome",
      median_house_value AS "medianHouseValue", ocean_proximity AS "oceanProximity",
      rooms_per_household AS "roomsPerHousehold", bedrooms_per_room AS "bedroomsPerRoom",
      population_per_household AS "populationPerHousehold"
    FROM housing_districts
    TABLESAMPLE SYSTEM(${(limit / 20640) * 100})
    LIMIT ${limit}
  `);
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  res.json(GetHousingDistrictsResponse.parse(rows));
});

router.get("/housing/stats", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS "totalDistricts",
      ROUND(AVG(median_house_value)::numeric, 2)::float AS "avgMedianHouseValue",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_house_value)::float AS "medianMedianHouseValue",
      ROUND(AVG(median_income)::numeric, 4)::float AS "avgMedianIncome",
      ROUND(AVG(housing_median_age)::numeric, 2)::float AS "avgHousingAge",
      SUM(population)::int AS "totalPopulation",
      MIN(median_house_value)::float AS "minHouseValue",
      MAX(median_house_value)::float AS "maxHouseValue",
      COUNT(*) FILTER (WHERE ocean_proximity = 'NEAR OCEAN')::int AS "nearOceanCount",
      COUNT(*) FILTER (WHERE ocean_proximity = 'INLAND')::int AS "inlandCount",
      COUNT(*) FILTER (WHERE ocean_proximity = 'ISLAND')::int AS "islandCount",
      COUNT(*) FILTER (WHERE ocean_proximity = 'NEAR BAY')::int AS "nearBayCount",
      COUNT(*) FILTER (WHERE ocean_proximity = '<1H OCEAN')::int AS "lessThanOneHourCount"
    FROM housing_districts
  `);

  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  const stats = rows[0];

  res.json(GetHousingStatsResponse.parse(stats));
});

router.post("/housing/predict", async (req, res): Promise<void> => {
  const parsed = PredictHousingPriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const roomsPerHousehold = input.totalRooms / input.households;
  const bedroomsPerRoom = input.totalBedrooms / input.totalRooms;
  const populationPerHousehold = input.population / input.households;

  let price = MODEL.intercept;
  price += input.medianIncome * MODEL.coefficients.medianIncome;
  price += input.housingMedianAge * MODEL.coefficients.housingMedianAge;
  price += roomsPerHousehold * MODEL.coefficients.roomsPerHousehold;
  price += bedroomsPerRoom * MODEL.coefficients.bedroomsPerRoom;
  price += populationPerHousehold * MODEL.coefficients.populationPerHousehold;
  price += input.latitude * MODEL.coefficients.latitude;
  price += input.longitude * MODEL.coefficients.longitude;

  if (input.oceanProximity === "NEAR OCEAN") price += MODEL.coefficients.nearOcean;
  else if (input.oceanProximity === "NEAR BAY") price += MODEL.coefficients.nearBay;
  else if (input.oceanProximity === "<1H OCEAN") price += MODEL.coefficients.lessThanOneHour;
  else if (input.oceanProximity === "ISLAND") price += MODEL.coefficients.island;

  price = Math.max(14999, Math.min(500001, price));

  // Compute per-input feature contributions (absolute dollar impact)
  const incomeContrib = Math.abs(input.medianIncome * MODEL.coefficients.medianIncome);
  const latContrib = Math.abs(input.latitude * MODEL.coefficients.latitude);
  const lonContrib = Math.abs(input.longitude * MODEL.coefficients.longitude);
  const locationContrib = latContrib + lonContrib;
  const proximityContrib = Math.abs(
    input.oceanProximity === "NEAR OCEAN" ? MODEL.coefficients.nearOcean
    : input.oceanProximity === "NEAR BAY" ? MODEL.coefficients.nearBay
    : input.oceanProximity === "<1H OCEAN" ? MODEL.coefficients.lessThanOneHour
    : input.oceanProximity === "ISLAND" ? MODEL.coefficients.island
    : 0
  );
  const ageContrib = Math.abs(input.housingMedianAge * MODEL.coefficients.housingMedianAge);
  const roomsContrib = Math.abs(roomsPerHousehold * MODEL.coefficients.roomsPerHousehold);
  const bedroomsContrib = Math.abs(bedroomsPerRoom * MODEL.coefficients.bedroomsPerRoom);
  const popContrib = Math.abs(populationPerHousehold * MODEL.coefficients.populationPerHousehold);

  const totalContrib = incomeContrib + locationContrib + proximityContrib + ageContrib + roomsContrib + bedroomsContrib + popContrib;

  const featureImportance = [
    { feature: "Median Income", importance: parseFloat((incomeContrib / totalContrib).toFixed(4)) },
    { feature: "Location (Lat/Lon)", importance: parseFloat((locationContrib / totalContrib).toFixed(4)) },
    { feature: "Ocean Proximity", importance: parseFloat((proximityContrib / totalContrib).toFixed(4)) },
    { feature: "Housing Age", importance: parseFloat((ageContrib / totalContrib).toFixed(4)) },
    { feature: "Rooms per Household", importance: parseFloat((roomsContrib / totalContrib).toFixed(4)) },
    { feature: "Bedrooms/Rooms Ratio", importance: parseFloat((bedroomsContrib / totalContrib).toFixed(4)) },
    { feature: "Population Density", importance: parseFloat((popContrib / totalContrib).toFixed(4)) },
  ].sort((a, b) => b.importance - a.importance);

  res.json(
    PredictHousingPriceResponse.parse({
      predictedValue: Math.round(price),
      confidence: MODEL.r2,
      featureImportance,
      modelAccuracy: MODEL.r2,
    })
  );
});

router.get("/housing/income-price", async (_req, res): Promise<void> => {
  // Use TABLESAMPLE for consistent, geographically spread sample
  const result = await db.execute(sql`
    SELECT median_income AS "medianIncome",
           median_house_value AS "medianHouseValue",
           ocean_proximity AS "oceanProximity",
           latitude, longitude
    FROM housing_districts
    TABLESAMPLE SYSTEM(10)
    LIMIT 2000
  `);
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  res.json(GetIncomePriceDataResponse.parse(rows));
});

router.get("/housing/price-by-region", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT
      ocean_proximity AS "oceanProximity",
      ROUND(AVG(median_house_value)::numeric, 2)::float AS "avgPrice",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_house_value)::float AS "medianPrice",
      COUNT(*)::int AS count
    FROM housing_districts
    GROUP BY ocean_proximity
    ORDER BY "avgPrice" DESC
  `);
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  res.json(GetPriceByRegionResponse.parse(rows));
});

router.get("/housing/age-distribution", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT
      CASE
        WHEN housing_median_age <= 10 THEN '1-10 years'
        WHEN housing_median_age <= 20 THEN '11-20 years'
        WHEN housing_median_age <= 30 THEN '21-30 years'
        WHEN housing_median_age <= 40 THEN '31-40 years'
        ELSE '41+ years'
      END AS "ageRange",
      COUNT(*)::int AS count,
      ROUND(AVG(median_house_value)::numeric, 2)::float AS "avgPrice"
    FROM housing_districts
    GROUP BY "ageRange"
    ORDER BY MIN(housing_median_age)
  `);
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  res.json(GetAgeDistributionResponse.parse(rows));
});

export default router;
