import {
  users, vehicles, crimes, tickets, drugActivities, robberies, emergencyCalls, workShifts, serverSettings,
  type User, type InsertUser, type Vehicle, type InsertVehicle, type Crime, type InsertCrime,
  type Ticket, type InsertTicket, type DrugActivity, type InsertDrugActivity,
  type Robbery, type EmergencyCall, type WorkShift, type ServerSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Vehicles
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleByPlate(licensePlate: string): Promise<Vehicle | undefined>;
  getVehiclesByOwner(ownerId: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
  
  // Crimes
  getCrime(id: string): Promise<Crime | undefined>;
  getCrimesByUser(userId: string): Promise<Crime[]>;
  createCrime(crime: InsertCrime): Promise<Crime>;
  updateCrime(id: string, updates: Partial<Crime>): Promise<Crime>;
  
  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  getOpenTickets(): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;
  
  // Drug Activities
  getDrugActivitiesByUser(userId: string): Promise<DrugActivity[]>;
  getActiveDrugActivities(): Promise<DrugActivity[]>;
  createDrugActivity(activity: InsertDrugActivity): Promise<DrugActivity>;
  updateDrugActivity(id: string, updates: Partial<DrugActivity>): Promise<DrugActivity>;
  
  // Robberies
  getActiveRobberies(): Promise<Robbery[]>;
  createRobbery(robbery: Omit<Robbery, 'id' | 'createdAt'>): Promise<Robbery>;
  updateRobbery(id: string, updates: Partial<Robbery>): Promise<Robbery>;
  
  // Emergency Calls
  getActiveEmergencyCalls(): Promise<EmergencyCall[]>;
  createEmergencyCall(call: Omit<EmergencyCall, 'id' | 'createdAt'>): Promise<EmergencyCall>;
  updateEmergencyCall(id: string, updates: Partial<EmergencyCall>): Promise<EmergencyCall>;
  
  // Work Shifts
  getActiveWorkShifts(): Promise<WorkShift[]>;
  getUserWorkShifts(userId: string): Promise<WorkShift[]>;
  createWorkShift(shift: Omit<WorkShift, 'id'>): Promise<WorkShift>;
  updateWorkShift(id: string, updates: Partial<WorkShift>): Promise<WorkShift>;
  
  // Server Settings
  getSetting(key: string): Promise<ServerSetting | undefined>;
  setSetting(key: string, value: any): Promise<ServerSetting>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Vehicles
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleByPlate(licensePlate: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.licensePlate, licensePlate));
    return vehicle || undefined;
  }

  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.ownerId, ownerId));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return vehicle;
  }

  // Crimes
  async getCrime(id: string): Promise<Crime | undefined> {
    const [crime] = await db.select().from(crimes).where(eq(crimes.id, id));
    return crime || undefined;
  }

  async getCrimesByUser(userId: string): Promise<Crime[]> {
    return await db.select().from(crimes).where(eq(crimes.suspectId, userId)).orderBy(desc(crimes.createdAt));
  }

  async createCrime(crime: InsertCrime): Promise<Crime> {
    const [newCrime] = await db.insert(crimes).values(crime).returning();
    return newCrime;
  }

  async updateCrime(id: string, updates: Partial<Crime>): Promise<Crime> {
    const [crime] = await db.update(crimes).set(updates).where(eq(crimes.id, id)).returning();
    return crime;
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getOpenTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).where(or(eq(tickets.status, 'aperto'), eq(tickets.status, 'in_corso'))).orderBy(desc(tickets.priority), desc(tickets.createdAt));
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db.update(tickets).set({ ...updates, updatedAt: new Date() }).where(eq(tickets.id, id)).returning();
    return ticket;
  }

  // Drug Activities
  async getDrugActivitiesByUser(userId: string): Promise<DrugActivity[]> {
    return await db.select().from(drugActivities).where(eq(drugActivities.userId, userId)).orderBy(desc(drugActivities.startedAt));
  }

  async getActiveDrugActivities(): Promise<DrugActivity[]> {
    return await db.select().from(drugActivities).where(eq(drugActivities.isActive, true));
  }

  async createDrugActivity(activity: InsertDrugActivity): Promise<DrugActivity> {
    const [newActivity] = await db.insert(drugActivities).values({ ...activity, startedAt: new Date() }).returning();
    return newActivity;
  }

  async updateDrugActivity(id: string, updates: Partial<DrugActivity>): Promise<DrugActivity> {
    const [activity] = await db.update(drugActivities).set(updates).where(eq(drugActivities.id, id)).returning();
    return activity;
  }

  // Robberies
  async getActiveRobberies(): Promise<Robbery[]> {
    return await db.select().from(robberies).where(eq(robberies.isActive, true)).orderBy(desc(robberies.createdAt));
  }

  async createRobbery(robbery: Omit<Robbery, 'id' | 'createdAt'>): Promise<Robbery> {
    const [newRobbery] = await db.insert(robberies).values(robbery).returning();
    return newRobbery;
  }

  async updateRobbery(id: string, updates: Partial<Robbery>): Promise<Robbery> {
    const [robbery] = await db.update(robberies).set(updates).where(eq(robberies.id, id)).returning();
    return robbery;
  }

  // Emergency Calls
  async getActiveEmergencyCalls(): Promise<EmergencyCall[]> {
    return await db.select().from(emergencyCalls).where(eq(emergencyCalls.isResolved, false)).orderBy(desc(emergencyCalls.createdAt));
  }

  async createEmergencyCall(call: Omit<EmergencyCall, 'id' | 'createdAt'>): Promise<EmergencyCall> {
    const [newCall] = await db.insert(emergencyCalls).values(call).returning();
    return newCall;
  }

  async updateEmergencyCall(id: string, updates: Partial<EmergencyCall>): Promise<EmergencyCall> {
    const [call] = await db.update(emergencyCalls).set(updates).where(eq(emergencyCalls.id, id)).returning();
    return call;
  }

  // Work Shifts
  async getActiveWorkShifts(): Promise<WorkShift[]> {
    return await db.select().from(workShifts).where(eq(workShifts.isActive, true));
  }

  async getUserWorkShifts(userId: string): Promise<WorkShift[]> {
    return await db.select().from(workShifts).where(eq(workShifts.userId, userId)).orderBy(desc(workShifts.startTime));
  }

  async createWorkShift(shift: Omit<WorkShift, 'id'>): Promise<WorkShift> {
    const [newShift] = await db.insert(workShifts).values(shift).returning();
    return newShift;
  }

  async updateWorkShift(id: string, updates: Partial<WorkShift>): Promise<WorkShift> {
    const [shift] = await db.update(workShifts).set(updates).where(eq(workShifts.id, id)).returning();
    return shift;
  }

  // Server Settings
  async getSetting(key: string): Promise<ServerSetting | undefined> {
    const [setting] = await db.select().from(serverSettings).where(eq(serverSettings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: any): Promise<ServerSetting> {
    const [setting] = await db.insert(serverSettings).values({ key, value }).onConflictDoUpdate({
      target: serverSettings.key,
      set: { value, updatedAt: new Date() }
    }).returning();
    return setting;
  }
}

export const storage = new DatabaseStorage();
