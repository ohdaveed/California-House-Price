import { Router, type IRouter } from "express";
import { db, starbucksLocationsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  GetStarbucksLocationsResponse,
  GetStarbucksPriceImpactResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/starbucks/locations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(starbucksLocationsTable).orderBy(starbucksLocationsTable.openYear);
  res.json(GetStarbucksLocationsResponse.parse(rows));
});

router.get("/starbucks/price-impact", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    WITH sbux_years AS (
      SELECT DISTINCT open_year, COUNT(*) as cnt
      FROM starbucks_locations
      WHERE open_year IS NOT NULL
      GROUP BY open_year
    ),
    nearby_prices AS (
      SELECT
        sy.open_year,
        AVG(h.median_house_value) as avg_nearby,
        sy.cnt
      FROM sbux_years sy
      JOIN starbucks_locations sl ON sl.open_year = sy.open_year
      JOIN housing_districts h ON (
        ABS(h.latitude - sl.latitude) < 0.15 AND ABS(h.longitude - sl.longitude) < 0.15
      )
      GROUP BY sy.open_year, sy.cnt
    ),
    overall_avg AS (
      SELECT AVG(median_house_value) as avg_all FROM housing_districts
    )
    SELECT
      np.open_year AS "openYear",
      ROUND(np.avg_nearby::numeric, 2)::float AS "avgPriceNearby",
      ROUND(oa.avg_all::numeric, 2)::float AS "avgPriceOther",
      ROUND(((np.avg_nearby - oa.avg_all) / oa.avg_all * 100)::numeric, 2)::float AS "percentDiff",
      np.cnt::int AS "starbucksCount",
      (np.open_year::text || ': ' || np.cnt::text || ' location(s) opened') AS label
    FROM nearby_prices np
    CROSS JOIN overall_avg oa
    ORDER BY np.open_year
  `);

  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows ?? [];
  res.json(GetStarbucksPriceImpactResponse.parse(rows));
});

export default router;
