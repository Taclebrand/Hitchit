import express, { type Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertLocationSchema, 
  insertRideSchema, 
  insertPackageSchema 
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Seed the database with initial data
  await seedDatabase();

  // Users API
  apiRouter.post("/users/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  apiRouter.post("/users/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Error logging in" });
    }
  });

  // Locations API
  apiRouter.get("/locations", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const locations = await storage.getLocationsByUserId(userId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching locations" });
    }
  });

  apiRouter.post("/locations", async (req: Request, res: Response) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json({ location });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating location" });
      }
    }
  });

  // Ride Types API
  apiRouter.get("/ride-types", async (_req: Request, res: Response) => {
    try {
      const rideTypes = await storage.getRideTypes();
      res.json(rideTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ride types" });
    }
  });

  // Delivery Options API
  apiRouter.get("/delivery-options", async (_req: Request, res: Response) => {
    try {
      const deliveryOptions = await storage.getDeliveryOptions();
      res.json(deliveryOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching delivery options" });
    }
  });

  // Rides API
  apiRouter.post("/rides", async (req: Request, res: Response) => {
    try {
      const rideData = insertRideSchema.parse(req.body);
      const ride = await storage.createRide(rideData);
      res.status(201).json({ ride });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating ride" });
      }
    }
  });

  apiRouter.get("/rides", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const rides = await storage.getRidesByUserId(userId);
      res.json(rides);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rides" });
    }
  });

  // Packages API
  apiRouter.post("/packages", async (req: Request, res: Response) => {
    try {
      const packageData = insertPackageSchema.parse(req.body);
      // Add tracking number
      const trackingNumber = `HITCH${nanoid(8).toUpperCase()}`;
      const packageWithTracking = { ...packageData, trackingNumber };
      const pkg = await storage.createPackage(packageWithTracking);
      res.status(201).json({ package: pkg });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating package" });
      }
    }
  });

  apiRouter.get("/packages", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const packages = await storage.getPackagesByUserId(userId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching packages" });
    }
  });

  // Prefix all routes with /api
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

// Seed initial data
async function seedDatabase() {
  // Create default user
  const userExists = await storage.getUserByUsername("demo");
  if (!userExists) {
    await storage.createUser({
      username: "demo",
      password: "password123",
      fullName: "Demo User",
      email: "demo@hitchit.com",
      phone: "555-123-4567",
      avatar: ""
    });
  }

  // Create ride types
  const rideTypes = await storage.getRideTypes();
  if (rideTypes.length === 0) {
    await storage.createRideType({
      name: "Economy",
      description: "Affordable rides for everyday use",
      basePrice: 5.0,
      pricePerMile: 1.5,
      icon: "car",
      capacity: 4,
      active: true
    });

    await storage.createRideType({
      name: "Comfort",
      description: "More spacious cars with extra legroom",
      basePrice: 8.0,
      pricePerMile: 2.25,
      icon: "car",
      capacity: 4,
      active: true
    });

    await storage.createRideType({
      name: "Premium",
      description: "Luxury vehicles for special occasions",
      basePrice: 12.0,
      pricePerMile: 3.0,
      icon: "car",
      capacity: 4,
      active: true
    });
  }

  // Create delivery options
  const deliveryOptions = await storage.getDeliveryOptions();
  if (deliveryOptions.length === 0) {
    await storage.createDeliveryOption({
      name: "Standard",
      description: "Regular delivery within 2-3 hours",
      basePrice: 6.0,
      pricePerMile: 0.5,
      estimatedTime: "2-3 hours",
      icon: "truck",
      active: true
    });

    await storage.createDeliveryOption({
      name: "Express",
      description: "Fast delivery in 1 hour or less",
      basePrice: 10.0,
      pricePerMile: 1.0,
      estimatedTime: "1 hour or less",
      icon: "flash",
      active: true
    });

    await storage.createDeliveryOption({
      name: "Scheduled",
      description: "Plan delivery for a specific time",
      basePrice: 8.0,
      pricePerMile: 0.5,
      estimatedTime: "Pick a time",
      icon: "calendar",
      active: true
    });
  }
}
