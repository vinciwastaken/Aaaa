import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "cittadino", "poliziotto", "medico", "pompiere", "meccanico", 
  "camionista", "chef", "insegnante", "giornalista", "avvocato",
  "amministratore", "super_admin"
]);

export const crimeTypeEnum = pgEnum("crime_type", [
  "furto", "rapina", "traffico_droga", "omicidio", "aggressione", 
  "guida_in_stato_di_ebbrezza", "eccesso_di_velocita", "altro"
]);

export const drugTypeEnum = pgEnum("drug_type", [
  "marijuana", "cocaina", "eroina", "metanfetamine", "ecstasy"
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "aperto", "in_corso", "risolto", "chiuso"
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "bassa", "media", "alta", "urgente"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  nickname: text("nickname"),
  role: userRoleEnum("role").default("cittadino").notNull(),
  isOnDuty: boolean("is_on_duty").default(false),
  criminalRecord: jsonb("criminal_record").$type<{
    arrests: number;
    fines: number;
    totalAmount: number;
    charges: string[];
  }>().default({ arrests: 0, fines: 0, totalAmount: 0, charges: [] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  insuranceExpiry: timestamp("insurance_expires"),
  isSeized: boolean("is_seized").default(false),
  seizedBy: varchar("seized_by").references(() => users.id),
  seizedReason: text("seized_reason"),
  seizedPhoto: text("seized_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Crimes table
export const crimes = pgTable("crimes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  suspectId: varchar("suspect_id").references(() => users.id).notNull(),
  officerId: varchar("officer_id").references(() => users.id).notNull(),
  type: crimeTypeEnum("type").notNull(),
  description: text("description").notNull(),
  sentence: text("sentence"),
  fine: integer("fine").default(0),
  mugshot: text("mugshot"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Drug activities table
export const drugActivities = pgTable("drug_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  drugType: drugTypeEnum("drug_type").notNull(),
  activity: text("activity").notNull(), // "raccolta" or "processo"
  isActive: boolean("is_active").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Robberies table
export const robberies = pgTable("robberies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emergency calls table
export const emergencyCalls = pgTable("emergency_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: varchar("caller_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "polizia", "medico", "pompieri"
  description: text("description").notNull(),
  location: text("location"),
  isResolved: boolean("is_resolved").default(false),
  responderId: varchar("responder_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default("aperto").notNull(),
  priority: ticketPriorityEnum("priority").default("media").notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Server settings table
export const serverSettings = pgTable("server_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work shifts table
export const workShifts = pgTable("work_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: userRoleEnum("role").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  crimes: many(crimes),
  drugActivities: many(drugActivities),
  robberies: many(robberies),
  emergencyCalls: many(emergencyCalls),
  tickets: many(tickets),
  workShifts: many(workShifts),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  owner: one(users, {
    fields: [vehicles.ownerId],
    references: [users.id],
  }),
  seizedByOfficer: one(users, {
    fields: [vehicles.seizedBy],
    references: [users.id],
  }),
}));

export const crimesRelations = relations(crimes, ({ one }) => ({
  suspect: one(users, {
    fields: [crimes.suspectId],
    references: [users.id],
  }),
  officer: one(users, {
    fields: [crimes.officerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertCrimeSchema = createInsertSchema(crimes).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDrugActivitySchema = createInsertSchema(drugActivities).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertCrime = z.infer<typeof insertCrimeSchema>;
export type Crime = typeof crimes.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertDrugActivity = z.infer<typeof insertDrugActivitySchema>;
export type DrugActivity = typeof drugActivities.$inferSelect;
export type Robbery = typeof robberies.$inferSelect;
export type EmergencyCall = typeof emergencyCalls.$inferSelect;
export type WorkShift = typeof workShifts.$inferSelect;
export type ServerSetting = typeof serverSettings.$inferSelect;
