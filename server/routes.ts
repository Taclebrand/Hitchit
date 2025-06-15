import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { AuthService } from "./auth";
import { ComputerVisionService } from "./ai/computerVision";
import { IntelligentTripMatchingService } from "./ai/tripMatching";
import { ConversationalVoiceAssistant } from "./ai/voiceAssistant";
import { PersonalizationEngine } from "./ai/personalization";
import multer from "multer";

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});
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
    const authHeader = req.headers.authorization;
    
    // For development/testing purposes, allow bypassing auth with a test token
    if (authHeader === 'Bearer test-token') {
      req.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isDriver: true,
        createdAt: new Date()
      };
      return next();
    }
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

  // Google OAuth initiate - redirect to actual Google OAuth
  apiRouter.get("/auth/google", async (req: Request, res: Response) => {
    // Real Google OAuth URL - user needs to provide GOOGLE_CLIENT_ID
    if (process.env.GOOGLE_CLIENT_ID) {
      const googleOAuthURL = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:5000/api/auth/google/callback')}&scope=email%20profile&response_type=code`;
      res.redirect(googleOAuthURL);
    } else {
      // Redirect to error page if Google OAuth is not configured
      res.redirect('/auth?error=google_oauth_not_configured');
    }
  });

  // Google OAuth callback - handles the OAuth code from Google
  apiRouter.get("/auth/google/callback", async (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect('/auth?error=oauth_cancelled');
    }
    
    if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect('/auth?error=oauth_config_missing');
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'http://localhost:5000/api/auth/google/callback',
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        return res.redirect('/auth?error=oauth_token_failed');
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();
      
      const result = await AuthService.handleGoogleAuth({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      });

      if (result.success && result.token) {
        res.redirect(`/home?token=${result.token}&auth=success`);
      } else {
        res.redirect('/auth?error=auth_failed');
      }
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect('/auth?error=oauth_error');
    }
  });

  // Google OAuth POST endpoint for direct API calls
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

  // Apple ID authentication initiate
  apiRouter.get("/auth/apple", async (req: Request, res: Response) => {
    // Redirect to error page - Apple OAuth requires proper configuration
    res.redirect('/auth?error=apple_oauth_not_configured');
  });

  // Apple ID callback (for POST requests)
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

  // Send phone verification after email registration
  apiRouter.post("/auth/verify-phone", async (req: Request, res: Response) => {
    try {
      const { userId, phone } = req.body;
      
      // Generate verification code for phone
      const verificationCode = AuthService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const verification = await storage.createVerificationCode({
        userId,
        phone,
        code: verificationCode,
        type: 'phone',
        expiresAt,
      });

      // Send SMS
      try {
        const twilio = require('twilio');
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: `Your HitchIt verification code is: ${verificationCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          console.log(`SMS sent to ${phone}`);
        } else {
          console.log(`SMS verification code for ${phone}: ${verificationCode}`);
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        console.log(`SMS verification code for ${phone}: ${verificationCode}`);
      }

      res.json({
        success: true,
        message: 'Verification code sent to your phone',
        verificationId: verification.id,
      });
    } catch (error) {
      console.error("Phone verification error:", error);
      res.status(500).json({ success: false, message: "Phone verification failed" });
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

  // Register a vehicle (temporarily without auth for testing)
  apiRouter.post("/vehicles", async (req: Request, res: Response) => {
    try {
      // For testing, use a default user ID
      const userId = 1;

      // Parse the vehicle data without userId first, then add it
      const vehicleInput = insertVehicleSchema.omit({ userId: true }).parse(req.body);
      const vehicleData = {
        ...vehicleInput,
        userId: userId
      };
      
      console.log("Registering vehicle:", vehicleData);
      
      // Create the vehicle
      const newVehicle = await storage.createVehicle(vehicleData);
      
      // Update the user to be a driver
      await storage.updateUser(userId, { isDriver: true });
      
      console.log("Vehicle registered successfully:", newVehicle);
      return res.status(201).json(newVehicle);
    } catch (error) {
      console.error("Vehicle registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid vehicle data", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
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

  // ====== TRIP SHARING API ROUTES ======

  // Generate QR code for trip sharing
  apiRouter.post("/trips/:id/share", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      
      if (isNaN(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
      // Verify trip exists and user has access
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.driverId !== req.user!.id) {
        return res.status(403).json({ message: "You can only share your own trips" });
      }
      
      // Generate unique share code
      const shareCode = nanoid(12);
      const shareUrl = `${req.protocol}://${req.get('host')}/shared-trip/${shareCode}`;
      
      // Generate QR code as base64 data URL
      const qrCodeData = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create trip share record
      const tripShare = await storage.createTripShare({
        tripId,
        sharedByUserId: req.user!.id,
        shareCode,
        qrCodeData,
        shareUrl,
        isActive: true,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null
      });
      
      res.json({
        success: true,
        shareCode,
        shareUrl,
        qrCodeData,
        tripShare
      });
      
    } catch (error) {
      console.error("Trip sharing error:", error);
      res.status(500).json({ message: "Failed to generate trip share" });
    }
  });
  
  // Get shared trip by share code
  apiRouter.get("/shared-trip/:shareCode", async (req: Request, res: Response) => {
    try {
      const { shareCode } = req.params;
      
      const tripShare = await storage.getTripShare(shareCode);
      if (!tripShare || !tripShare.isActive) {
        return res.status(404).json({ message: "Shared trip not found or expired" });
      }
      
      // Check expiration
      if (tripShare.expiresAt && new Date() > tripShare.expiresAt) {
        await storage.deactivateTripShare(shareCode);
        return res.status(404).json({ message: "Shared trip has expired" });
      }
      
      // Get trip details
      const trip = await storage.getTrip(tripShare.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Get sharer details
      const sharedByUser = await storage.getUser(tripShare.sharedByUserId);
      
      // Update view count
      await storage.updateTripShareViewCount(shareCode);
      
      res.json({
        trip,
        sharedBy: sharedByUser ? {
          id: sharedByUser.id,
          fullName: sharedByUser.fullName,
          avatar: sharedByUser.avatar
        } : null,
        shareInfo: {
          viewCount: tripShare.viewCount + 1,
          createdAt: tripShare.createdAt
        }
      });
      
    } catch (error) {
      console.error("Get shared trip error:", error);
      res.status(500).json({ message: "Failed to get shared trip" });
    }
  });
  
  // Get user's shared trips
  apiRouter.get("/trips/shared/my-shares", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const tripShares = await storage.getTripSharesByUserId(req.user!.id);
      
      // Get trip details for each share
      const sharesWithTrips = await Promise.all(
        tripShares.map(async (share) => {
          const trip = await storage.getTrip(share.tripId);
          return {
            ...share,
            trip
          };
        })
      );
      
      res.json(sharesWithTrips);
      
    } catch (error) {
      console.error("Get user trip shares error:", error);
      res.status(500).json({ message: "Failed to get shared trips" });
    }
  });
  
  // Deactivate a trip share
  apiRouter.delete("/trips/shared/:shareCode", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { shareCode } = req.params;
      
      const tripShare = await storage.getTripShare(shareCode);
      if (!tripShare) {
        return res.status(404).json({ message: "Trip share not found" });
      }
      
      if (tripShare.sharedByUserId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own shared trips" });
      }
      
      await storage.deactivateTripShare(shareCode);
      
      res.json({ success: true, message: "Trip share deactivated" });
      
    } catch (error) {
      console.error("Deactivate trip share error:", error);
      res.status(500).json({ message: "Failed to deactivate trip share" });
    }
  });

  // ====== AI API ROUTES ======

  // Computer Vision - Vehicle Verification
  apiRouter.post("/ai/verify-vehicle", authenticate, upload.single('vehicleImage'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vehicle image is required" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const expectedVehicleInfo = req.body.expectedVehicleInfo ? JSON.parse(req.body.expectedVehicleInfo) : undefined;

      const result = await ComputerVisionService.verifyVehicle(imageBase64, expectedVehicleInfo);
      res.json(result);
    } catch (error) {
      console.error('Vehicle verification error:', error);
      res.status(500).json({ message: "Vehicle verification failed" });
    }
  });

  // Computer Vision - Safety Analysis
  apiRouter.post("/ai/analyze-vehicle-safety", authenticate, upload.single('vehicleImage'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vehicle image is required" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const result = await ComputerVisionService.analyzeVehicleForSafety(imageBase64);
      res.json(result);
    } catch (error) {
      console.error('Safety analysis error:', error);
      res.status(500).json({ message: "Safety analysis failed" });
    }
  });

  // Intelligent Trip Matching
  apiRouter.post("/ai/find-optimal-trips", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { riderRequest } = req.body;
      
      if (!riderRequest || !riderRequest.pickup || !riderRequest.dropoff) {
        return res.status(400).json({ message: "Rider request with pickup and dropoff required" });
      }

      // Get available trips for matching
      const availableTrips = await storage.getActiveTrips();
      
      const matches = await IntelligentTripMatchingService.findOptimalMatches(riderRequest, availableTrips);
      res.json({ matches });
    } catch (error) {
      console.error('Trip matching error:', error);
      res.status(500).json({ message: "Trip matching failed" });
    }
  });

  // Route Optimization
  apiRouter.post("/ai/optimize-route/:tripId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const { newBooking } = req.body;

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const bookings = await storage.getBookingsByTripId(tripId);
      const optimization = await IntelligentTripMatchingService.optimizeRoute(trip, bookings, newBooking);
      
      res.json(optimization);
    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({ message: "Route optimization failed" });
    }
  });

  // Trip Demand Analysis
  apiRouter.post("/ai/analyze-trip-demand", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { route, timeWindow } = req.body;
      
      if (!route || !timeWindow) {
        return res.status(400).json({ message: "Route and time window required" });
      }

      const analysis = await IntelligentTripMatchingService.analyzeTripDemand(route, timeWindow);
      res.json(analysis);
    } catch (error) {
      console.error('Demand analysis error:', error);
      res.status(500).json({ message: "Demand analysis failed" });
    }
  });

  // Voice Assistant - Process Voice Input
  apiRouter.post("/ai/process-voice", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { transcript, conversationHistory, currentBookingSession } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ message: "Voice transcript required" });
      }

      const context = {
        userId: req.user!.id,
        conversationHistory: conversationHistory || [],
        currentBookingSession
      };

      const intent = await ConversationalVoiceAssistant.processVoiceInput(transcript, context);
      res.json(intent);
    } catch (error) {
      console.error('Voice processing error:', error);
      res.status(500).json({ message: "Voice processing failed" });
    }
  });

  // Voice Assistant - Generate Suggestions
  apiRouter.post("/ai/voice-suggestions", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { conversationHistory, currentIntent } = req.body;
      
      const context = {
        userId: req.user!.id,
        conversationHistory: conversationHistory || []
      };

      const suggestions = await ConversationalVoiceAssistant.generateSmartSuggestions(context, currentIntent);
      res.json(suggestions);
    } catch (error) {
      console.error('Suggestion generation error:', error);
      res.status(500).json({ message: "Suggestion generation failed" });
    }
  });

  // Voice Assistant - Speech to Text
  apiRouter.post("/ai/speech-to-text", authenticate, upload.single('audio'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file required" });
      }

      const audioBlob = new Blob([req.file.buffer], { type: 'audio/webm' });
      const transcript = await ConversationalVoiceAssistant.convertSpeechToText(audioBlob);
      
      res.json({ transcript });
    } catch (error) {
      console.error('Speech to text error:', error);
      res.status(500).json({ message: "Speech to text failed" });
    }
  });

  // Voice Assistant - Text to Speech
  apiRouter.post("/ai/text-to-speech", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text required" });
      }

      const audioBuffer = await ConversationalVoiceAssistant.generateSpeechResponse(text);
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('Text to speech error:', error);
      res.status(500).json({ message: "Text to speech failed" });
    }
  });

  // Voice Assistant - Multi-turn Conversation
  apiRouter.post("/ai/conversation", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array required" });
      }

      const result = await ConversationalVoiceAssistant.handleMultiTurnConversation(messages, req.user!.id);
      res.json(result);
    } catch (error) {
      console.error('Conversation error:', error);
      res.status(500).json({ message: "Conversation handling failed" });
    }
  });

  // Personalization Engine - User Profile
  apiRouter.get("/ai/user-profile", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const profile = await PersonalizationEngine.buildUserProfile(req.user!.id);
      res.json(profile);
    } catch (error) {
      console.error('Profile building error:', error);
      res.status(500).json({ message: "Profile building failed" });
    }
  });

  // Personalization Engine - Recommendations
  apiRouter.post("/ai/recommendations", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { context } = req.body;
      
      const recommendations = await PersonalizationEngine.generatePersonalizedRecommendations(req.user!.id, context);
      res.json({ recommendations });
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({ message: "Recommendation generation failed" });
    }
  });

  // Personalization Engine - Predict User Needs
  apiRouter.post("/ai/predict-needs", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { timeWindow } = req.body;
      
      if (!timeWindow || !timeWindow.start || !timeWindow.end) {
        return res.status(400).json({ message: "Time window with start and end required" });
      }

      const predictions = await PersonalizationEngine.predictUserNeeds(req.user!.id, {
        start: new Date(timeWindow.start),
        end: new Date(timeWindow.end)
      });
      
      res.json(predictions);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ message: "Prediction failed" });
    }
  });

  // Personalization Engine - UI Adaptation
  apiRouter.post("/ai/adapt-ui", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { deviceInfo } = req.body;
      
      const adaptations = await PersonalizationEngine.adaptUserInterface(req.user!.id, deviceInfo);
      res.json(adaptations);
    } catch (error) {
      console.error('UI adaptation error:', error);
      res.status(500).json({ message: "UI adaptation failed" });
    }
  });

  // Stripe payment endpoints
  
  // Create payment intent for rides and packages
  apiRouter.post("/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount, currency = "usd", description } = req.body;
      
      if (!amount || amount < 0.50) {
        return res.status(400).json({ message: "Amount must be at least $0.50" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description: description || "HitchIt Service Payment",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });

  // Create connected account for drivers
  apiRouter.post("/create-driver-account", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver) {
        return res.status(403).json({ message: "Access denied - driver account required" });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: req.user!.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Update user with Stripe account ID
      await storage.updateUser(req.user!.id, { 
        stripeConnectAccountId: account.id 
      });

      res.json({ 
        success: true, 
        accountId: account.id,
        message: "Driver Stripe account created successfully" 
      });
    } catch (error: any) {
      console.error("Driver account creation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error creating driver account",
        error: error.message 
      });
    }
  });

  // Process driver payout
  apiRouter.post("/driver-payout", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver || !req.user!.stripeConnectAccountId) {
        return res.status(403).json({ 
          message: "Driver account with connected Stripe account required" 
        });
      }

      const { amount } = req.body;
      
      if (!amount || amount < 20) {
        return res.status(400).json({ 
          message: "Minimum payout amount is $20" 
        });
      }

      // Check available earnings
      const availableEarnings = await storage.getAvailableEarnings(req.user!.id);
      if (amount > availableEarnings) {
        return res.status(400).json({ 
          message: "Insufficient available earnings for payout" 
        });
      }

      // Create transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: req.user!.stripeConnectAccountId,
        description: `HitchIt driver payout for ${req.user!.username}`,
      });

      // Record the withdrawal  
      const withdrawal = await storage.createWithdrawal({
        driverId: req.user!.id,
        amount: amount.toString(),
        bankAccount: req.user!.stripeConnectAccountId,
        status: 'completed',
        transferId: transfer.id,
      });

      res.json({ 
        success: true, 
        withdrawal,
        transferId: transfer.id,
        message: "Payout processed successfully" 
      });
    } catch (error: any) {
      console.error("Driver payout error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing payout",
        error: error.message 
      });
    }
  });

  // Get driver account status
  apiRouter.get("/driver-account-status", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isDriver) {
        return res.status(403).json({ message: "Driver account required" });
      }

      if (!req.user!.stripeConnectAccountId) {
        return res.json({ 
          hasAccount: false, 
          message: "No connected Stripe account found" 
        });
      }

      const account = await stripe.accounts.retrieve(req.user!.stripeConnectAccountId);
      
      res.json({ 
        hasAccount: true,
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements
      });
    } catch (error: any) {
      console.error("Driver account status error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error retrieving account status",
        error: error.message 
      });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
};