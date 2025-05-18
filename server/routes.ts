import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertUserSchema, 
  insertTripSchema,
  insertVehicleSchema,
  insertBookingSchema,
  users
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  app.use((req, _res, next) => {
    // Add basic request logging
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    return res.status(500).json({ message: "An unexpected error occurred" });
  });

  // User session authentication middleware
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // This is a simple authentication check using session data
    // In a real app, you'd want to use a proper auth system
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Register a new user
  apiRouter.post("/users/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to register user" });
    }
  });

  // User login
  apiRouter.post("/users/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would use a proper session management and not send the password back
      const { password: _, ...userWithoutPassword } = user;
      
      // Set user in session
      req.user = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Get a user by ID
  apiRouter.get("/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send back the password
      const { password, ...userWithoutPassword } = user;
      
      // If user is a driver, include their vehicles
      if (user.isDriver) {
        const vehicles = await storage.getVehiclesByUserId(userId);
        return res.status(200).json({ ...userWithoutPassword, vehicles });
      }
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Register a vehicle
  apiRouter.post("/vehicles", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set the user ID to the current user
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Set user as a driver if not already
      if (!req.user.isDriver) {
        await storage.updateUser(req.user.id, { isDriver: true });
      }
      
      const newVehicle = await storage.createVehicle(vehicleData);
      
      return res.status(201).json(newVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to register vehicle" });
    }
  });

  // Get vehicles by user ID
  apiRouter.get("/vehicles/user/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const vehicles = await storage.getVehiclesByUserId(userId);
      
      return res.status(200).json(vehicles);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get vehicles" });
    }
  });

  // Create a new trip
  apiRouter.post("/trips", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set the driver ID to the current user
      const tripData = insertTripSchema.parse({
        ...req.body,
        driverId: req.user.id
      });
      
      // Ensure user is a driver
      if (!req.user.isDriver) {
        return res.status(403).json({ message: "User is not registered as a driver" });
      }
      
      // Ensure vehicle belongs to the user
      const vehicle = await storage.getVehicle(tripData.vehicleId);
      if (!vehicle || vehicle.userId !== req.user.id) {
        return res.status(403).json({ message: "Vehicle does not belong to the user" });
      }
      
      const newTrip = await storage.createTrip(tripData);
      
      return res.status(201).json(newTrip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Get all active trips
  apiRouter.get("/trips", async (req: Request, res: Response) => {
    try {
      const trips = await storage.getActiveTrips();
      
      return res.status(200).json(trips);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get trips" });
    }
  });

  // Get a trip by ID
  apiRouter.get("/trips/:id", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      
      if (isNaN(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get trip" });
    }
  });

  // Update trip status
  apiRouter.patch("/trips/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      
      if (isNaN(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
      const { status } = req.body;
      
      if (!status || !["active", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Ensure trip belongs to the user
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (req.user && trip.driverId !== req.user.id) {
        return res.status(403).json({ message: "Trip does not belong to the user" });
      }
      
      const updatedTrip = await storage.updateTripStatus(tripId, status);
      
      return res.status(200).json(updatedTrip);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // Search for trips by cities
  apiRouter.post("/trips/search/bookings", async (req: Request, res: Response) => {
    try {
      const { 
        origin, 
        destination, 
        departureDate,
        radiusMiles = 5 // Default to 5 miles radius
      } = req.body;
      
      if (!origin || !destination || !departureDate) {
        return res.status(400).json({ 
          message: "Origin, destination and departureDate are required" 
        });
      }
      
      if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        return res.status(400).json({ 
          message: "Origin and destination must include lat and lng coordinates" 
        });
      }
      
      const parsedDate = new Date(departureDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid departure date" });
      }
      
      const trips = await storage.findMatchingTripsForBooking(
        origin,
        destination,
        parsedDate,
        radiusMiles
      );
      
      return res.status(200).json(trips);
    } catch (error) {
      return res.status(500).json({ message: "Failed to search for trips" });
    }
  });

  // Create a booking
  apiRouter.post("/bookings", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set the rider ID to the current user
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        riderId: req.user.id
      });
      
      // Ensure trip exists and has enough available seats
      const trip = await storage.getTrip(bookingData.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.availableSeats < bookingData.seats) {
        return res.status(400).json({ message: "Not enough available seats" });
      }
      
      // Create the booking
      const newBooking = await storage.createBooking(bookingData);
      
      // Reduce available seats
      await storage.updateTripAvailableSeats(
        trip.id, 
        trip.availableSeats - bookingData.seats
      );
      
      return res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get bookings by rider ID
  apiRouter.get("/bookings/rider", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookings = await storage.getBookingsByRiderId(req.user.id);
      
      return res.status(200).json(bookings);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  // Get bookings by trip ID
  apiRouter.get("/bookings/trip/:tripId", authenticate, async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      
      if (isNaN(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
      // Ensure trip belongs to the user
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (req.user && trip.driverId !== req.user.id) {
        return res.status(403).json({ message: "Trip does not belong to the user" });
      }
      
      const bookings = await storage.getBookingsByTripId(tripId);
      
      return res.status(200).json(bookings);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  // Update booking status
  apiRouter.patch("/bookings/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const { status } = req.body;
      
      if (!status || !["pending", "approved", "rejected", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get the trip
      const trip = await storage.getTrip(booking.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // If user is the driver of the trip, they can update the status
      // If user is the rider who made the booking, they can only cancel
      if (req.user) {
        const isDriver = trip.driverId === req.user.id;
        const isRider = booking.riderId === req.user.id;
        
        if (!isDriver && (!isRider || status !== "cancelled")) {
          return res.status(403).json({ message: "Unauthorized to update this booking" });
        }
      }
      
      // Handle seat changes based on status change
      if (booking.status !== status) {
        if (status === "cancelled" || status === "rejected") {
          // Add seats back to trip
          await storage.updateTripAvailableSeats(
            trip.id,
            trip.availableSeats + booking.seats
          );
        } else if (booking.status === "cancelled" || booking.status === "rejected") {
          // Reduce available seats if coming from cancelled/rejected status
          await storage.updateTripAvailableSeats(
            trip.id,
            trip.availableSeats - booking.seats
          );
        }
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      return res.status(200).json(updatedBooking);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Add method to update user (to support updating isDriver status)
  storage.updateUser = async (id: number, data: Partial<{ isDriver: boolean }>) => {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  };

  // Mount API router
  app.use("/api", apiRouter);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
};