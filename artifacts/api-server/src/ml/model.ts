import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export const FEATURE_NAMES = [
  "Median Income",
  "Housing Age",
  "Rooms per Household",
  "Bedrooms/Rooms Ratio",
  "Population Density",
  "Latitude",
  "Longitude",
  "Near Ocean",
  "Near Bay",
  "<1H Ocean",
  "Island",
] as const;

export type TrainedModel = {
  intercept: number;
  coefficients: {
    medianIncome: number;
    housingMedianAge: number;
    roomsPerHousehold: number;
    bedroomsPerRoom: number;
    populationPerHousehold: number;
    latitude: number;
    longitude: number;
    nearOcean: number;
    nearBay: number;
    lessThanOneHour: number;
    island: number;
  };
  r2: number;
  featureImportance: { feature: string; importance: number }[];
  trainedOn: number;
};

function buildRow(row: {
  medianIncome: number;
  housingMedianAge: number;
  roomsPerHousehold: number;
  bedroomsPerRoom: number | null;
  populationPerHousehold: number;
  latitude: number;
  longitude: number;
  oceanProximity: string;
}): number[] {
  return [
    1,
    row.medianIncome,
    row.housingMedianAge,
    row.roomsPerHousehold,
    row.bedroomsPerRoom ?? 0,
    row.populationPerHousehold,
    row.latitude,
    row.longitude,
    row.oceanProximity === "NEAR OCEAN" ? 1 : 0,
    row.oceanProximity === "NEAR BAY" ? 1 : 0,
    row.oceanProximity === "<1H OCEAN" ? 1 : 0,
    row.oceanProximity === "ISLAND" ? 1 : 0,
  ];
}

function solveNormalEquations(XtX: number[][], Xty: number[]): number[] {
  const p = XtX.length;
  const aug: number[][] = XtX.map((row, i) => [...row, Xty[i]]);

  for (let col = 0; col < p; col++) {
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < p; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= p; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const beta = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-12) continue;
    beta[i] = aug[i][p];
    for (let j = i + 1; j < p; j++) {
      beta[i] -= aug[i][j] * beta[j];
    }
    beta[i] /= aug[i][i];
  }

  return beta;
}

let cachedModel: TrainedModel | null = null;

export async function trainModel(): Promise<TrainedModel> {
  const result = await db.execute(sql`
    SELECT median_income AS "medianIncome",
           housing_median_age AS "housingMedianAge",
           rooms_per_household AS "roomsPerHousehold",
           bedrooms_per_room AS "bedroomsPerRoom",
           population_per_household AS "populationPerHousehold",
           latitude, longitude,
           ocean_proximity AS "oceanProximity",
           median_house_value AS "medianHouseValue"
    FROM housing_districts
  `);

  type HousingRow = {
    medianIncome: number;
    housingMedianAge: number;
    roomsPerHousehold: number;
    bedroomsPerRoom: number | null;
    populationPerHousehold: number;
    latitude: number;
    longitude: number;
    oceanProximity: string;
    medianHouseValue: number;
  };

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? []) as HousingRow[];
  const n = rows.length;
  const p = 12;

  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty: number[] = new Array(p).fill(0);

  let sumY = 0;
  let sumY2 = 0;

  const featureSumSq: number[] = new Array(p).fill(0);
  const featureSum: number[] = new Array(p).fill(0);

  for (const row of rows) {
    const x = buildRow(row);
    const y = row.medianHouseValue;
    sumY += y;
    sumY2 += y * y;
    for (let i = 0; i < p; i++) {
      Xty[i] += x[i] * y;
      featureSum[i] += x[i];
      featureSumSq[i] += x[i] * x[i];
      for (let j = 0; j < p; j++) {
        XtX[i][j] += x[i] * x[j];
      }
    }
  }

  const beta = solveNormalEquations(XtX, Xty);

  const meanY = sumY / n;
  const SStot = sumY2 - n * meanY * meanY;

  let SSres = 0;
  for (const row of rows) {
    const x = buildRow(row);
    const yHat = beta.reduce((acc, b, i) => acc + b * x[i], 0);
    const err = row.medianHouseValue - yHat;
    SSres += err * err;
  }

  const r2 = Math.max(0, 1 - SSres / SStot);

  const featureStdDevs = featureSumSq.map((sq, i) => {
    const mean = featureSum[i] / n;
    return Math.sqrt(sq / n - mean * mean);
  });

  const stdY = Math.sqrt(sumY2 / n - meanY * meanY);

  const rawImportances = beta.slice(1).map((coeff, i) => {
    const featureStd = featureStdDevs[i + 1];
    return Math.abs(coeff * featureStd) / stdY;
  });

  const totalImportance = rawImportances.reduce((a, b) => a + b, 0) || 1;
  const featureImportance = rawImportances
    .map((imp, i) => ({
      feature: FEATURE_NAMES[i],
      importance: parseFloat((imp / totalImportance).toFixed(4)),
    }))
    .sort((a, b) => b.importance - a.importance);

  cachedModel = {
    intercept: beta[0],
    coefficients: {
      medianIncome: beta[1],
      housingMedianAge: beta[2],
      roomsPerHousehold: beta[3],
      bedroomsPerRoom: beta[4],
      populationPerHousehold: beta[5],
      latitude: beta[6],
      longitude: beta[7],
      nearOcean: beta[8],
      nearBay: beta[9],
      lessThanOneHour: beta[10],
      island: beta[11],
    },
    r2: parseFloat(r2.toFixed(4)),
    featureImportance,
    trainedOn: n,
  };

  console.log(`[ML] Linear regression trained on ${n} rows. R² = ${r2.toFixed(4)}`);
  return cachedModel;
}

export async function getModel(): Promise<TrainedModel> {
  if (!cachedModel) {
    return trainModel();
  }
  return cachedModel;
}
