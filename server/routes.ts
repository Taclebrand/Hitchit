import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertDriverSchema,
  insertTripSchema,
  insertLocationSchema,
  insertVehicleTypeSchema,
  insertBookingSchema,
  insertPackageSchema,
  insertReviewSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Seed the database with initial data
  await seedDatabase();

  // Authentication middleware
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers["user-id"];
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(Number(userId));
      
      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  };

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

  apiRouter.get("/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Driver API
  apiRouter.post("/drivers", authenticate, async (req: Request, res: Response) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      
      // Check if user already has a driver profile
      const existingDriver = await storage.getDriverByUserId(driverData.userId);
      
      if (existingDriver) {
        return res.status(400).json({ message: "Driver profile already exists" });
      }
      
      // Create driver profile
      const driver = await storage.createDriver(driverData);
      
      // Update user role to driver
      await storage.updateUserRole(driverData.userId, "driver");
      
      res.status(201).json({ driver });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating driver profile" });
      }
    }
  });

  apiRouter.get("/drivers/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Error fetching driver profile" });
    }
  });

  // Admin-only endpoint to approve drivers
  apiRouter.patch("/drivers/:id/approve", authenticate, async (req: Request, res: Response) => {
    try {
      // Check if the user is an admin
      if (req.user.userRole !== 'admin') {
        return res.status(403).json({ message: "Only admins can approve drivers" });
      }
      
      const driverId = Number(req.params.id);
      const { isApproved } = req.body;
      
      if (typeof isApproved !== 'boolean') {
        return res.status(400).json({ message: "isApproved must be a boolean" });
      }
      
      const driver = await storage.approveDriver(driverId, isApproved);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Send notification to driver
      await storage.createNotification({
        userId: driver.userId,
        title: isApproved ? "Driver Approved" : "Driver Application Rejected",
        message: isApproved 
          ? "Your driver application has been approved! You can now post trips." 
          : "Your driver application has been rejected. Please contact support for more information.",
        type: "driver_approval"
      });
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Error updating driver approval status" });
    }
  });

  // Trip API
  apiRouter.post("/trips", authenticate, async (req: Request, res: Response) => {
    try {
      // Verify that the user is an approved driver
      const driver = await storage.getDriverByUserId(req.user.id);
      
      if (!driver) {
        return res.status(403).json({ message: "You must be a driver to post trips" });
      }
      
      if (!driver.isApproved) {
        return res.status(403).json({ message: "Your driver account must be approved to post trips" });
      }
      
      const tripData = insertTripSchema.parse({
        ...req.body,
        driverId: driver.id
      });
      
      const trip = await storage.createTrip(tripData);
      res.status(201).json({ trip });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating trip" });
      }
    }
  });

  apiRouter.get("/trips", async (req: Request, res: Response) => {
    try {
      let trips;
      
      if (req.query.driverId) {
        // Get trips by driver
        trips = await storage.getTripsByDriverId(Number(req.query.driverId));
      } else if (req.query.departureCity && req.query.destinationCity) {
        // Get trips by cities
        trips = await storage.getTripsByCities(
          req.query.departureCity as string,
          req.query.destinationCity as string
        );
      } else {
        // Get all active trips
        trips = await storage.getActiveTrips();
      }
      
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trips" });
    }
  });

  apiRouter.get("/trips/:id", async (req: Request, res: Response) => {
    try {
      const tripId = Number(req.params.id);
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trip" });
    }
  });

  apiRouter.patch("/trips/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const tripId = Number(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the trip
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Verify the user is the driver of this trip
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver || driver.id !== trip.driverId) {
        return res.status(403).json({ message: "Only the trip driver can update status" });
      }
      
      const updatedTrip = await storage.updateTripStatus(tripId, status);
      
      // If trip is completed or cancelled, notify passengers with bookings
      if (status === 'completed' || status === 'cancelled') {
        const bookings = await storage.getBookingsByTripId(tripId);
        
        for (const booking of bookings) {
          if (booking.status === 'approved') {
            await storage.createNotification({
              userId: booking.userId,
              title: status === 'completed' ? "Trip Completed" : "Trip Cancelled",
              message: status === 'completed' 
                ? "Your trip has been marked as completed by the driver." 
                : "Your trip has been cancelled by the driver.",
              type: "trip_status",
              relatedId: tripId
            });
            
            // Update booking status too
            await storage.updateBookingStatus(
              booking.id, 
              status === 'completed' ? 'completed' : 'cancelled'
            );
          }
        }
        
        // Also handle packages
        const packages = await storage.getPackagesByTripId(tripId);
        
        for (const pkg of packages) {
          if (['approved', 'in_transit'].includes(pkg.status)) {
            await storage.createNotification({
              userId: pkg.userId,
              title: status === 'completed' ? "Package Delivered" : "Package Delivery Cancelled",
              message: status === 'completed' 
                ? "Your package has been marked as delivered by the driver." 
                : "Your package delivery has been cancelled by the driver.",
              type: "package_status",
              relatedId: pkg.id
            });
            
            // Update package status too
            await storage.updatePackageStatus(
              pkg.id, 
              status === 'completed' ? 'delivered' : 'cancelled'
            );
          }
        }
      }
      
      res.json(updatedTrip);
    } catch (error) {
      res.status(500).json({ message: "Error updating trip status" });
    }
  });

  // Search for matching trips
  apiRouter.post("/trips/search/bookings", async (req: Request, res: Response) => {
    try {
      const { pickup, dropoff, departureDate, radiusMiles = 10 } = req.body;
      
      if (!pickup || !pickup.lat || !pickup.lng || 
          !dropoff || !dropoff.lat || !dropoff.lng ||
          !departureDate) {
        return res.status(400).json({ 
          message: "Missing required parameters (pickup, dropoff, departureDate)" 
        });
      }
      
      const matchingTrips = await storage.findMatchingTripsForBooking(
        pickup,
        dropoff,
        new Date(departureDate),
        Number(radiusMiles)
      );
      
      res.json(matchingTrips);
    } catch (error) {
      res.status(500).json({ message: "Error searching for trips" });
    }
  });

  // Search for matching trips for packages
  apiRouter.post("/trips/search/packages", async (req: Request, res: Response) => {
    try {
      const { pickup, delivery, departureDate, radiusMiles = 10 } = req.body;
      
      if (!pickup || !pickup.lat || !pickup.lng || 
          !delivery || !delivery.lat || !delivery.lng ||
          !departureDate) {
        return res.status(400).json({ 
          message: "Missing required parameters (pickup, delivery, departureDate)" 
        });
      }
      
      const matchingTrips = await storage.findMatchingTripsForPackage(
        pickup,
        delivery,
        new Date(departureDate),
        Number(radiusMiles)
      );
      
      res.json(matchingTrips);
    } catch (error) {
      res.status(500).json({ message: "Error searching for trips" });
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

  apiRouter.post("/locations", authenticate, async (req: Request, res: Response) => {
    try {
      const locationData = insertLocationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
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

  // Vehicle Types API
  apiRouter.get("/vehicle-types", async (_req: Request, res: Response) => {
    try {
      const vehicleTypes = await storage.getVehicleTypes();
      res.json(vehicleTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicle types" });
    }
  });

  // Booking API (ride requests)
  apiRouter.post("/bookings", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Verify the trip exists and is active
      const trip = await storage.getTrip(bookingData.tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.status !== 'active') {
        return res.status(400).json({ message: "This trip is no longer active" });
      }
      
      if (trip.availableSeats < bookingData.passengerCount) {
        return res.status(400).json({ message: "Not enough available seats" });
      }
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating booking" });
      }
    }
  });

  apiRouter.get("/bookings", authenticate, async (req: Request, res: Response) => {
    try {
      let bookings;
      
      if (req.query.tripId) {
        // Driver requesting bookings for their trip
        const tripId = Number(req.query.tripId);
        const trip = await storage.getTrip(tripId);
        
        if (!trip) {
          return res.status(404).json({ message: "Trip not found" });
        }
        
        // Verify the user is the driver of this trip
        const driver = await storage.getDriverByUserId(req.user.id);
        if (!driver || driver.id !== trip.driverId) {
          return res.status(403).json({ message: "Only the trip driver can view these bookings" });
        }
        
        bookings = await storage.getBookingsByTripId(tripId);
      } else {
        // User requesting their own bookings
        bookings = await storage.getBookingsByUserId(req.user.id);
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });

  apiRouter.patch("/bookings/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get the trip for this booking
      const trip = await storage.getTrip(booking.tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Associated trip not found" });
      }
      
      // Check authorization
      const isPassenger = req.user.id === booking.userId;
      const driver = await storage.getDriverByUserId(req.user.id);
      const isDriver = driver && driver.id === trip.driverId;
      
      if (!isPassenger && !isDriver) {
        return res.status(403).json({ message: "You are not authorized to update this booking" });
      }
      
      // Passenger can only cancel
      if (isPassenger && status !== 'cancelled') {
        return res.status(403).json({ message: "Passengers can only cancel bookings" });
      }
      
      // Driver can approve, reject, or complete
      if (isDriver && status === 'cancelled') {
        return res.status(403).json({ message: "Drivers cannot cancel bookings, only approve, reject, or complete" });
      }
      
      // If approving, check available seats
      if (status === 'approved' && trip.availableSeats < booking.passengerCount) {
        return res.status(400).json({ message: "Not enough available seats" });
      }
      
      // Update the booking status
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      // If approved, update the trip's available seats
      if (status === 'approved') {
        await storage.updateTripAvailableSeats(
          trip.id, 
          trip.availableSeats - booking.passengerCount
        );
      }
      
      // If cancelled and was previously approved, increase available seats
      if (status === 'cancelled' && booking.status === 'approved') {
        await storage.updateTripAvailableSeats(
          trip.id, 
          trip.availableSeats + booking.passengerCount
        );
      }
      
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Error updating booking status" });
    }
  });

  // Packages API
  apiRouter.post("/packages", authenticate, async (req: Request, res: Response) => {
    try {
      const packageData = insertPackageSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Verify the trip exists, is active, and accepts packages
      const trip = await storage.getTrip(packageData.tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.status !== 'active') {
        return res.status(400).json({ message: "This trip is no longer active" });
      }
      
      if (!trip.acceptingPackages) {
        return res.status(400).json({ message: "This trip does not accept packages" });
      }
      
      // Generate tracking number
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

  apiRouter.get("/packages", authenticate, async (req: Request, res: Response) => {
    try {
      let packages;
      
      if (req.query.tripId) {
        // Driver requesting packages for their trip
        const tripId = Number(req.query.tripId);
        const trip = await storage.getTrip(tripId);
        
        if (!trip) {
          return res.status(404).json({ message: "Trip not found" });
        }
        
        // Verify the user is the driver of this trip
        const driver = await storage.getDriverByUserId(req.user.id);
        if (!driver || driver.id !== trip.driverId) {
          return res.status(403).json({ message: "Only the trip driver can view these packages" });
        }
        
        packages = await storage.getPackagesByTripId(tripId);
      } else {
        // User requesting their own packages
        packages = await storage.getPackagesByUserId(req.user.id);
      }
      
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching packages" });
    }
  });

  apiRouter.get("/packages/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const packageId = Number(req.params.id);
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Check authorization - package sender or trip driver can view
      const isSender = req.user.id === pkg.userId;
      
      if (!isSender) {
        const trip = await storage.getTrip(pkg.tripId);
        if (!trip) {
          return res.status(404).json({ message: "Associated trip not found" });
        }
        
        const driver = await storage.getDriverByUserId(req.user.id);
        const isDriver = driver && driver.id === trip.driverId;
        
        if (!isDriver) {
          return res.status(403).json({ message: "You are not authorized to view this package" });
        }
      }
      
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ message: "Error fetching package" });
    }
  });

  apiRouter.patch("/packages/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const packageId = Number(req.params.id);
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected', 'in_transit', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the package
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Get the trip for this package
      const trip = await storage.getTrip(pkg.tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Associated trip not found" });
      }
      
      // Check authorization
      const isSender = req.user.id === pkg.userId;
      const driver = await storage.getDriverByUserId(req.user.id);
      const isDriver = driver && driver.id === trip.driverId;
      
      if (!isSender && !isDriver) {
        return res.status(403).json({ message: "You are not authorized to update this package" });
      }
      
      // Sender can only cancel
      if (isSender && status !== 'cancelled') {
        return res.status(403).json({ message: "Package senders can only cancel packages" });
      }
      
      // Driver can approve, reject, mark as in_transit, or deliver
      if (isDriver && status === 'cancelled') {
        return res.status(403).json({ message: "Drivers cannot cancel packages, only approve, reject, mark as in_transit, or deliver" });
      }
      
      // Update the package status
      const updatedPackage = await storage.updatePackageStatus(packageId, status);
      res.json(updatedPackage);
    } catch (error) {
      res.status(500).json({ message: "Error updating package status" });
    }
  });

  // Reviews API
  apiRouter.post("/reviews", authenticate, async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        fromUserId: req.user.id
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json({ review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating review" });
      }
    }
  });

  apiRouter.get("/reviews/:userId", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const reviews = await storage.getReviewsByUserId(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  // Notifications API
  apiRouter.get("/notifications", authenticate, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  apiRouter.patch("/notifications/:id/read", authenticate, async (req: Request, res: Response) => {
    try {
      const notificationId = Number(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "You cannot mark other users' notifications as read" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read" });
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
      avatar: "",
      userRole: "rider"
    });
    
    // Create admin user
    await storage.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@hitchit.com",
      phone: "555-987-6543",
      avatar: "",
      userRole: "admin"
    });
    
    // Create a driver user
    const driverUser = await storage.createUser({
      username: "driver",
      password: "driver123",
      fullName: "Test Driver",
      email: "driver@hitchit.com",
      phone: "555-456-7890",
      avatar: "",
      userRole: "driver"
    });
    
    // Create driver profile
    const driver = await storage.createDriver({
      userId: driverUser.id,
      licenseNumber: "DL12345678",
      licenseImage: "https://via.placeholder.com/300x200.png?text=License+Image",
      insuranceNumber: "INS87654321",
      insuranceImage: "https://via.placeholder.com/300x200.png?text=Insurance+Image",
      registrationNumber: "REG123ABC",
      registrationImage: "https://via.placeholder.com/300x200.png?text=Registration+Image",
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2020,
      vehicleColor: "Silver",
      vehicleMileage: 25000
    });
    
    // Approve the driver
    await storage.approveDriver(driver.id, true);
    
    // Create vehicle types
    await storage.createVehicleType({
      name: "Economy",
      description: "Affordable rides for everyday use",
      maxCapacity: 4,
      icon: "car",
      active: true
    });
    
    await storage.createVehicleType({
      name: "Comfort",
      description: "More spacious cars with extra legroom",
      maxCapacity: 4,
      icon: "car-side",
      active: true
    });
    
    await storage.createVehicleType({
      name: "Van",
      description: "Larger vehicles for groups",
      maxCapacity: 7,
      icon: "van-passenger",
      active: true
    });
    
    // Create sample trips
    // Current date at noon
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Tomorrow at noon
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Sample trip 1
    await storage.createTrip({
      driverId: driver.id,
      departureCity: "San Francisco",
      departureAddress: "123 Market St, San Francisco, CA",
      departureLat: 37.7749,
      departureLng: -122.4194,
      destinationCity: "Los Angeles",
      destinationAddress: "456 Hollywood Blvd, Los Angeles, CA",
      destinationLat: 34.0522,
      destinationLng: -118.2437,
      departureDate: tomorrow,
      availableSeats: 3,
      pricePerSeat: 45.00,
      acceptingPackages: true
    });
    
    // Sample trip 2
    await storage.createTrip({
      driverId: driver.id,
      departureCity: "New York",
      departureAddress: "789 Broadway, New York, NY",
      departureLat: 40.7128,
      departureLng: -74.0060,
      destinationCity: "Boston",
      destinationAddress: "101 Main St, Boston, MA",
      destinationLat: 42.3601,
      destinationLng: -71.0589,
      departureDate: tomorrow,
      availableSeats: 2,
      pricePerSeat: 35.00,
      acceptingPackages: true
    });
  }
}
