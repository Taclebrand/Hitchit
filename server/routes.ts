import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { db } from "./db";
import { AuthService } from "./auth";
import { eq } from "drizzle-orm";
import { 
  insertUserSchema, 
  insertTripSchema,
  insertVehicleSchema,
  insertBookingSchema,
  insertPaymentMethodSchema,
  insertVerificationCodeSchema,
  users,
  User
} from "@shared/schema";
import { z } from "zod";

// Authentication middleware
interface AuthRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

  // Real authentication middleware
  const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const decoded = AuthService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // Authentication Routes
  
  // Register with email/password
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, phone, password, fullName, isDriver } = req.body;
      
      const result = await AuthService.registerWithEmail({
        username,
        email,
        phone,
        password,
        fullName,
        isDriver: isDriver || false,
      });

      res.json(result);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Login with email/password
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginWithEmail(email, password);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  // Register/Login with phone
  apiRouter.post("/auth/phone", async (req: Request, res: Response) => {
    try {
      const { phone, fullName, isDriver } = req.body;
      const result = await AuthService.registerWithPhone(phone, fullName, isDriver || false);
      res.json(result);
    } catch (error) {
      console.error("Phone auth error:", error);
      res.status(500).json({ success: false, message: "Phone authentication failed" });
    }
  });

  // Google OAuth callback
  apiRouter.post("/auth/google", async (req: Request, res: Response) => {
    try {
      const { id, email, name, picture } = req.body;
      const result = await AuthService.handleGoogleAuth({ id, email, name, picture });
      res.json(result);
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ success: false, message: "Google authentication failed" });
    }
  });

  // Apple ID callback
  apiRouter.post("/auth/apple", async (req: Request, res: Response) => {
    try {
      const { id, email, name } = req.body;
      const result = await AuthService.handleAppleAuth({ id, email, name });
      res.json(result);
    } catch (error) {
      console.error("Apple auth error:", error);
      res.status(500).json({ success: false, message: "Apple authentication failed" });
    }
  });

  // Verify code (email/phone/apple)
  apiRouter.post("/auth/verify", async (req: Request, res: Response) => {
    try {
      const { verificationId, code } = req.body;
      const result = await AuthService.verifyCode(verificationId, code);
      res.json(result);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ success: false, message: "Verification failed" });
    }
  });

  // Get current user
  apiRouter.get("/auth/me", authenticate, async (req: AuthRequest, res: Response) => {
    res.json({ success: true, user: req.user });
  });

  // Payment Methods Routes
  
  // Get user's payment methods
  apiRouter.get("/payment-methods", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const methods = await storage.getPaymentMethods(req.user!.id);
      res.json({ success: true, paymentMethods: methods });
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch payment methods" });
    }
  });

  // Add payment method
  apiRouter.post("/payment-methods", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;
      const method = await storage.createPaymentMethod({
        ...data,
        userId: req.user!.id,
      });
      res.json({ success: true, paymentMethod: method });
    } catch (error) {
      console.error("Add payment method error:", error);
      res.status(500).json({ success: false, message: "Failed to add payment method" });
    }
  });

  // Set default payment method
  apiRouter.put("/payment-methods/:id/default", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const methodId = parseInt(req.params.id);
      await storage.setDefaultPaymentMethod(req.user!.id, methodId);
      res.json({ success: true, message: "Default payment method updated" });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ success: false, message: "Failed to update default payment method" });
    }
  });

  // Delete payment method
  apiRouter.delete("/payment-methods/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const methodId = parseInt(req.params.id);
      await storage.deletePaymentMethod(methodId);
      res.json({ success: true, message: "Payment method deleted" });
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({ success: false, message: "Failed to delete payment method" });
    }
  });

  // Driver Earnings Routes

  // Get driver earnings
  apiRouter.get("/driver/earnings", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      
      const earnings = await storage.getDriverEarnings(req.user!.id);
      const availableAmount = await storage.getAvailableEarnings(req.user!.id);
      
      res.json({ 
        success: true, 
        earnings, 
        availableAmount,
        canWithdraw: availableAmount >= 20 
      });
    } catch (error) {
      console.error("Get driver earnings error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch earnings" });
    }
  });

  // Request withdrawal
  apiRouter.post("/driver/withdraw", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const { amount, bankAccount } = req.body;
      const availableAmount = await storage.getAvailableEarnings(req.user!.id);

      if (amount < 20) {
        return res.status(400).json({ success: false, message: "Minimum withdrawal amount is $20" });
      }

      if (amount > availableAmount) {
        return res.status(400).json({ success: false, message: "Insufficient available earnings" });
      }

      const withdrawal = await storage.createWithdrawal({
        driverId: req.user!.id,
        amount: amount.toString(),
        bankAccount,
      });

      res.json({ success: true, withdrawal });
    } catch (error) {
      console.error("Withdrawal request error:", error);
      res.status(500).json({ success: false, message: "Withdrawal request failed" });
    }
  });

  // Get driver withdrawals
  apiRouter.get("/driver/withdrawals", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      
      const withdrawals = await storage.getDriverWithdrawals(req.user!.id);
      res.json({ success: true, withdrawals });
    } catch (error) {
      console.error("Get withdrawals error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
    }
  });

  // Pricing Suggestions Routes

  // Get pricing suggestion
  apiRouter.post("/pricing/suggest", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { originLat, originLng, destinationLat, destinationLng } = req.body;
      
      let suggestion = await storage.getPricingSuggestion(originLat, originLng, destinationLat, destinationLng);
      
      if (!suggestion) {
        // Calculate new pricing suggestion
        const distance = calculateDistance(originLat, originLng, destinationLat, destinationLng);
        const duration = Math.round(distance * 2); // Rough estimate: 2 minutes per mile
        
        const baseFare = 2.50;
        const perMileRate = 1.25;
        const perMinuteRate = 0.15;
        
        const calculatedPrice = baseFare + (distance * perMileRate) + (duration * perMinuteRate);
        const suggestedMinPrice = Math.round((calculatedPrice * 0.8) * 100) / 100;
        const suggestedMaxPrice = Math.round((calculatedPrice * 1.2) * 100) / 100;
        
        suggestion = await storage.createPricingSuggestion({
          originLat: originLat.toString(),
          originLng: originLng.toString(),
          destinationLat: destinationLat.toString(),
          destinationLng: destinationLng.toString(),
          distance: distance.toString(),
          duration,
          baseFare: baseFare.toString(),
          suggestedMinPrice: suggestedMinPrice.toString(),
          suggestedMaxPrice: suggestedMaxPrice.toString(),
          demandMultiplier: "1.0",
        });
      }
      
      res.json({ success: true, suggestion });
    } catch (error) {
      console.error("Pricing suggestion error:", error);
      res.status(500).json({ success: false, message: "Failed to get pricing suggestion" });
    }
  });

  // Helper function for distance calculation
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

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

  // Register a vehicle - temporarily allowing unauthenticated requests for demo purposes
  apiRouter.post("/vehicles", async (req: Request, res: Response) => {
    try {
      // Parse the vehicle data directly from the request body
      const vehicleData = insertVehicleSchema.parse(req.body);
      
      // Create the vehicle
      const newVehicle = await storage.createVehicle(vehicleData);
      
      // Update the user to be a driver if user ID is provided
      if (vehicleData.userId) {
        await storage.updateUser(vehicleData.userId, { isDriver: true });
      }
      
      return res.status(201).json(newVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Vehicle registration error:", error);
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
        riderId: req.user.id,
        seats: req.body.seats || 1 // Default to 1 seat if not specified
      });
      
      // Ensure trip exists and has enough available seats
      const trip = await storage.getTrip(bookingData.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const seatsRequested = bookingData.seats ?? 1; // Use nullish coalescing to default to 1
      if (trip.availableSeats < seatsRequested) {
        return res.status(400).json({ message: "Not enough available seats" });
      }
      
      // Create the booking with the fixed seats value
      const newBooking = await storage.createBooking({
        ...bookingData,
        seats: seatsRequested
      });
      
      // Reduce available seats
      await storage.updateTripAvailableSeats(
        trip.id, 
        trip.availableSeats - seatsRequested
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

  // We no longer need to add the updateUser method here since it's now properly defined in the storage class

  // Mount API router
  app.use("/api", apiRouter);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
};