import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertCrimeSchema, insertTicketSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard Statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const openTickets = await storage.getOpenTickets();
      const activeRobberies = await storage.getActiveRobberies();
      const activeDrugActivities = await storage.getActiveDrugActivities();
      
      const stats = {
        activeUsers: users.filter(u => u.isOnDuty).length,
        totalUsers: users.length,
        openTickets: openTickets.length,
        activeRobberies: activeRobberies.length,
        activeDrugActivities: activeDrugActivities.length,
        commandsExecuted: 8934, // This would come from logs in production
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });

  // Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero degli utenti" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      // Validate and set defaults for required fields
      const userInput = {
        ...req.body,
        isOnDuty: req.body.isOnDuty || false,
        criminalRecord: req.body.criminalRecord || {
          arrests: 0,
          fines: 0,
          totalAmount: 0,
          charges: []
        }
      };
      const userData = insertUserSchema.parse(userInput);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella creazione dell'utente" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      // Validate updates
      const updates = { ...req.body };
      if (updates.criminalRecord && typeof updates.criminalRecord === 'object') {
        // Ensure criminal record has the right structure
        updates.criminalRecord = {
          arrests: updates.criminalRecord.arrests || 0,
          fines: updates.criminalRecord.fines || 0,
          totalAmount: updates.criminalRecord.totalAmount || 0,
          charges: updates.criminalRecord.charges || []
        };
      }
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento dell'utente" });
    }
  });

  // Vehicles endpoints
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { ownerId } = req.query;
      if (ownerId) {
        const vehicles = await storage.getVehiclesByOwner(ownerId as string);
        res.json(vehicles);
      } else {
        res.status(400).json({ message: "ownerId è richiesto" });
      }
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei veicoli" });
    }
  });

  app.get("/api/vehicles/search/:plate", async (req, res) => {
    try {
      const vehicle = await storage.getVehicleByPlate(req.params.plate);
      if (!vehicle) {
        return res.status(404).json({ message: "Veicolo non trovato" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Errore nella ricerca del veicolo" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella registrazione del veicolo" });
    }
  });

  app.patch("/api/vehicles/:id/seize", upload.single('photo'), async (req, res) => {
    try {
      const { seizedBy, reason } = req.body;
      const photoPath = req.file?.path;
      
      const vehicle = await storage.updateVehicle(req.params.id, {
        isSeized: true,
        seizedBy,
        seizedReason: reason,
        seizedPhoto: photoPath
      });
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Errore nel sequestro del veicolo" });
    }
  });

  // Crimes endpoints
  app.get("/api/crimes/:userId", async (req, res) => {
    try {
      const crimes = await storage.getCrimesByUser(req.params.userId);
      res.json(crimes);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei crimini" });
    }
  });

  app.post("/api/crimes", upload.single('mugshot'), async (req, res) => {
    try {
      const crimeData = insertCrimeSchema.parse(req.body);
      const mugshotPath = req.file?.path;
      
      const crime = await storage.createCrime({
        ...crimeData,
        mugshot: mugshotPath
      });
      
      // Update user's criminal record
      const user = await storage.getUser(crimeData.suspectId);
      if (user) {
        const newRecord = {
          ...user.criminalRecord,
          arrests: user.criminalRecord.arrests + 1,
          totalAmount: user.criminalRecord.totalAmount + (crimeData.fine || 0),
          charges: [...user.criminalRecord.charges, crimeData.description]
        };
        
        await storage.updateUser(crimeData.suspectId, { criminalRecord: newRecord });
      }
      
      res.status(201).json(crime);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella registrazione del crimine" });
    }
  });

  // Tickets endpoints
  app.get("/api/tickets", async (req, res) => {
    try {
      const { status } = req.query;
      if (status === 'open') {
        const tickets = await storage.getOpenTickets();
        res.json(tickets);
      } else {
        const tickets = await storage.getAllTickets();
        res.json(tickets);
      }
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei ticket" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella creazione del ticket" });
    }
  });

  app.patch("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.updateTicket(req.params.id, req.body);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento del ticket" });
    }
  });

  // Emergency calls
  app.get("/api/emergency-calls", async (req, res) => {
    try {
      const calls = await storage.getActiveEmergencyCalls();
      res.json(calls);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle chiamate di emergenza" });
    }
  });

  app.post("/api/emergency-calls", async (req, res) => {
    try {
      const call = await storage.createEmergencyCall(req.body);
      res.status(201).json(call);
    } catch (error) {
      res.status(500).json({ message: "Errore nella creazione della chiamata di emergenza" });
    }
  });

  // Drug activities
  app.get("/api/drug-activities", async (req, res) => {
    try {
      const activities = await storage.getActiveDrugActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle attività di droga" });
    }
  });

  // Robberies
  app.get("/api/robberies", async (req, res) => {
    try {
      const robberies = await storage.getActiveRobberies();
      res.json(robberies);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle rapine" });
    }
  });

  app.post("/api/robberies", async (req, res) => {
    try {
      const robbery = await storage.createRobbery(req.body);
      res.status(201).json(robbery);
    } catch (error) {
      res.status(500).json({ message: "Errore nella registrazione della rapina" });
    }
  });

  // Work shifts
  app.get("/api/work-shifts", async (req, res) => {
    try {
      const shifts = await storage.getActiveWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei turni di lavoro" });
    }
  });

  app.post("/api/work-shifts", async (req, res) => {
    try {
      const shift = await storage.createWorkShift(req.body);
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ message: "Errore nella creazione del turno di lavoro" });
    }
  });

  // Server settings
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Impostazione non trovata" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dell'impostazione" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      const setting = await storage.setSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Errore nel salvataggio dell'impostazione" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
