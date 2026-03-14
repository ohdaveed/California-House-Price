import { pgTable, serial, real, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const housingDistrictsTable = pgTable("housing_districts", {
  id: serial("id").primaryKey(),
  longitude: real("longitude").notNull(),
  latitude: real("latitude").notNull(),
  housingMedianAge: real("housing_median_age").notNull(),
  totalRooms: real("total_rooms").notNull(),
  totalBedrooms: real("total_bedrooms"),
  population: real("population").notNull(),
  households: real("households").notNull(),
  medianIncome: real("median_income").notNull(),
  medianHouseValue: real("median_house_value").notNull(),
  oceanProximity: text("ocean_proximity").notNull(),
  roomsPerHousehold: real("rooms_per_household").notNull(),
  bedroomsPerRoom: real("bedrooms_per_room"),
  populationPerHousehold: real("population_per_household").notNull(),
});

export const insertHousingDistrictSchema = createInsertSchema(housingDistrictsTable).omit({ id: true });
export type InsertHousingDistrict = z.infer<typeof insertHousingDistrictSchema>;
export type HousingDistrict = typeof housingDistrictsTable.$inferSelect;

export const starbucksLocationsTable = pgTable("starbucks_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city").notNull(),
  openYear: integer("open_year"),
});

export const insertStarbucksLocationSchema = createInsertSchema(starbucksLocationsTable).omit({ id: true });
export type InsertStarbucksLocation = z.infer<typeof insertStarbucksLocationSchema>;
export type StarbucksLocation = typeof starbucksLocationsTable.$inferSelect;
