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
  trainR2: number;
  testR2: number;
  testMae: number;
  featureImportance: { feature: string; importance: number }[];
  trainedOn: number;
  testedOn: number;
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

function computeR2(rows: { x: number[]; y: number }[], beta: number[]): number {
  const n = rows.length;
  let sumY = 0;
  let sumY2 = 0;
  let SSres = 0;

  for (const { x, y } of rows) {
    sumY += y;
    sumY2 += y * y;
  }
  const meanY = sumY / n;
  const SStot = sumY2 - n * meanY * meanY;

  for (const { x, y } of rows) {
    const yHat = beta.reduce((acc, b, i) => acc + b * x[i], 0);
    const err = y - yHat;
    SSres += err * err;
  }

  return Math.max(0, 1 - SSres / SStot);
}

function computeMae(rows: { x: number[]; y: number }[], beta: number[]): number {
  let sumAbs = 0;
  for (const { x, y } of rows) {
    const yHat = beta.reduce((acc, b, i) => acc + b * x[i], 0);
    sumAbs += Math.abs(y - yHat);
  }
  return sumAbs / rows.length;
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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

  const allRows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? []) as HousingRow[];

  const shuffled = shuffleWithSeed(allRows, 42);
  const splitIdx = Math.floor(shuffled.length * 0.8);
  const trainRows = shuffled.slice(0, splitIdx);
  const testRows = shuffled.slice(splitIdx);

  const nTrain = trainRows.length;
  const p = 12;

  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty: number[] = new Array(p).fill(0);

  let sumY = 0;
  let sumY2 = 0;
  const featureSumSq: number[] = new Array(p).fill(0);
  const featureSum: number[] = new Array(p).fill(0);

  for (const row of trainRows) {
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

  const trainPairs = trainRows.map((row) => ({ x: buildRow(row), y: row.medianHouseValue }));
  const testPairs = testRows.map((row) => ({ x: buildRow(row), y: row.medianHouseValue }));

  const trainR2 = computeR2(trainPairs, beta);
  const testR2 = computeR2(testPairs, beta);
  const testMae = computeMae(testPairs, beta);

  const meanY = sumY / nTrain;
  const stdY = Math.sqrt(sumY2 / nTrain - meanY * meanY);
  const featureStdDevs = featureSumSq.map((sq, i) => {
    const mean = featureSum[i] / nTrain;
    return Math.sqrt(sq / nTrain - mean * mean);
  });

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

  console.log(
    `[ML] Trained on ${nTrain} rows, tested on ${testRows.length} rows. ` +
    `Train R² = ${trainR2.toFixed(4)}, Test R² = ${testR2.toFixed(4)}, ` +
    `Test MAE = $${Math.round(testMae).toLocaleString()}`
  );

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
    r2: parseFloat(testR2.toFixed(4)),
    trainR2: parseFloat(trainR2.toFixed(4)),
    testR2: parseFloat(testR2.toFixed(4)),
    testMae: Math.round(testMae),
    featureImportance,
    trainedOn: nTrain,
    testedOn: testRows.length,
  };

  return cachedModel;
}

export async function getModel(): Promise<TrainedModel> {
  if (!cachedModel) {
    return trainModel();
  }
  return cachedModel;
}
