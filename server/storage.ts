import { 
  User, InsertUser, 
  Driver, InsertDriver,
  Trip, InsertTrip,
  Location, InsertLocation,
  VehicleType, InsertVehicleType,
  Booking, InsertBooking,
  Package, InsertPackage,
  Review, InsertReview,
  Notification, InsertNotification,
  users, drivers, trips, locations, vehicleTypes, bookings, packages, reviews, notifications
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, between, like, sql, desc, gte, lte, isNull, isNotNull } from "drizzle-orm";

// Utility function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, userRole: string): Promise<User | undefined>;
  verifyUser(id: number, isVerified: boolean): Promise<User | undefined>;

  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  approveDriver(id: number, isApproved: boolean): Promise<Driver | undefined>;
  getPendingDriverApprovals(): Promise<Driver[]>;

  // Trip operations
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByDriverId(driverId: number): Promise<Trip[]>;
  getActiveTrips(): Promise<Trip[]>;
  getTripsByCities(departureCity: string, destinationCity: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTripStatus(id: number, status: string): Promise<Trip | undefined>;
  updateTripAvailableSeats(id: number, seats: number): Promise<Trip | undefined>;
  findMatchingTripsForBooking(pickup: { lat: number, lng: number }, dropoff: { lat: number, lng: number }, departureDate: Date, radiusMiles: number): Promise<Trip[]>;
  findMatchingTripsForPackage(pickup: { lat: number, lng: number }, delivery: { lat: number, lng: number }, departureDate: Date, radiusMiles: number): Promise<Trip[]>;

  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByUserId(userId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Vehicle type operations
  getVehicleType(id: number): Promise<VehicleType | undefined>;
  getVehicleTypes(): Promise<VehicleType[]>;
  createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getBookingsByTripId(tripId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;

  // Package operations
  getPackage(id: number): Promise<Package | undefined>;
  getPackagesByUserId(userId: number): Promise<Package[]>;
  getPackagesByTripId(tripId: number): Promise<Package[]>;
  createPackage(pkg: InsertPackage & { trackingNumber: string }): Promise<Package>;
  updatePackageStatus(id: number, status: string): Promise<Package | undefined>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const values = {
      ...insertUser,
      avatar: insertUser.avatar ?? null
    };
    const result = await db.insert(users).values(values).returning();
    return result[0];
  }

  async updateUserRole(id: number, userRole: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ userRole })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async verifyUser(id: number, isVerified: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isVerified })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const values = {
      ...driver,
      vehicleMileage: driver.vehicleMileage ?? null
    };
    const result = await db.insert(drivers).values(values).returning();
    return result[0];
  }

  async approveDriver(id: number, isApproved: boolean): Promise<Driver | undefined> {
    const values: Partial<Driver> = { 
      isApproved, 
      approvalDate: isApproved ? new Date() : null 
    };
    const result = await db
      .update(drivers)
      .set(values)
      .where(eq(drivers.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async getPendingDriverApprovals(): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.isApproved, false));
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    const result = await db.select().from(trips).where(eq(trips.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTripsByDriverId(driverId: number): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.driverId, driverId));
  }

  async getActiveTrips(): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.status, "active"));
  }

  async getTripsByCities(departureCity: string, destinationCity: string): Promise<Trip[]> {
    return await db.select().from(trips).where(
      and(
        eq(trips.departureCity, departureCity),
        eq(trips.destinationCity, destinationCity),
        eq(trips.status, "active")
      )
    );
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const result = await db.insert(trips).values(insertTrip).returning();
    return result[0];
  }

  async updateTripStatus(id: number, status: string): Promise<Trip | undefined> {
    const result = await db
      .update(trips)
      .set({ status, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateTripAvailableSeats(id: number, seats: number): Promise<Trip | undefined> {
    const result = await db
      .update(trips)
      .set({ availableSeats: seats, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async findMatchingTripsForBooking(
    pickup: { lat: number, lng: number }, 
    dropoff: { lat: number, lng: number }, 
    departureDate: Date, 
    radiusMiles: number
  ): Promise<Trip[]> {
    // Get all active trips around the same date
    const departureStartDate = new Date(departureDate);
    departureStartDate.setHours(0, 0, 0, 0);
    
    const departureEndDate = new Date(departureDate);
    departureEndDate.setHours(23, 59, 59, 999);
    
    const activeTrips = await db.select().from(trips).where(
      and(
        eq(trips.status, "active"),
        gte(trips.departureDate, departureStartDate),
        lte(trips.departureDate, departureEndDate),
        gte(trips.availableSeats, 1)
      )
    );
    
    // Filter trips by proximity to pickup and dropoff points
    return activeTrips.filter(trip => {
      const pickupDistance = calculateDistance(
        Number(pickup.lat), 
        Number(pickup.lng), 
        Number(trip.departureLat), 
        Number(trip.departureLng)
      );
      
      const dropoffDistance = calculateDistance(
        Number(dropoff.lat), 
        Number(dropoff.lng), 
        Number(trip.destinationLat), 
        Number(trip.destinationLng)
      );
      
      return pickupDistance <= radiusMiles && dropoffDistance <= radiusMiles;
    });
  }

  async findMatchingTripsForPackage(
    pickup: { lat: number, lng: number }, 
    delivery: { lat: number, lng: number }, 
    departureDate: Date, 
    radiusMiles: number
  ): Promise<Trip[]> {
    // Get all active trips that accept packages around the same date
    const departureStartDate = new Date(departureDate);
    departureStartDate.setHours(0, 0, 0, 0);
    
    const departureEndDate = new Date(departureDate);
    departureEndDate.setHours(23, 59, 59, 999);
    
    const activeTrips = await db.select().from(trips).where(
      and(
        eq(trips.status, "active"),
        eq(trips.acceptingPackages, true),
        gte(trips.departureDate, departureStartDate),
        lte(trips.departureDate, departureEndDate)
      )
    );
    
    // Filter trips by proximity to pickup and delivery points
    return activeTrips.filter(trip => {
      const pickupDistance = calculateDistance(
        Number(pickup.lat), 
        Number(pickup.lng), 
        Number(trip.departureLat), 
        Number(trip.departureLng)
      );
      
      const deliveryDistance = calculateDistance(
        Number(delivery.lat), 
        Number(delivery.lng), 
        Number(trip.destinationLat), 
        Number(trip.destinationLng)
      );
      
      return pickupDistance <= radiusMiles && deliveryDistance <= radiusMiles;
    });
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const values = {
      ...insertLocation,
      icon: insertLocation.icon ?? null,
      isDefault: insertLocation.isDefault ?? null
    };
    const result = await db.insert(locations).values(values).returning();
    return result[0];
  }

  // Vehicle type operations
  async getVehicleType(id: number): Promise<VehicleType | undefined> {
    const result = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db.select().from(vehicleTypes).where(eq(vehicleTypes.active, true));
  }

  async createVehicleType(insertVehicleType: InsertVehicleType): Promise<VehicleType> {
    const values = {
      ...insertVehicleType,
      description: insertVehicleType.description ?? null
    };
    const result = await db.insert(vehicleTypes).values(values).returning();
    return result[0];
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsByTripId(tripId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.tripId, tripId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const values = {
      ...insertBooking,
      status: "pending",
      message: insertBooking.message ?? null
    };
    const result = await db.insert(bookings).values(values).returning();
    
    // After creating a booking, send notification to the driver
    const booking = result[0];
    const trip = await this.getTrip(booking.tripId);
    if (trip) {
      const driver = await this.getDriver(trip.driverId);
      if (driver) {
        await this.createNotification({
          userId: driver.userId,
          title: "New Ride Request",
          message: `You have a new ride request for your trip to ${trip.destinationCity}`,
          type: "booking",
          relatedId: booking.id
        });
      }
    }
    
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const values: Partial<Booking> = { 
      status,
      updatedAt: new Date()
    };
    
    if (status === "completed") {
      values.completedAt = new Date();
    }
    
    const result = await db
      .update(bookings)
      .set(values)
      .where(eq(bookings.id, id))
      .returning();
    
    // After updating booking status, send notification to the rider
    const booking = result[0];
    if (booking) {
      let title = "";
      let message = "";
      
      if (status === "approved") {
        title = "Ride Request Accepted";
        message = "Your ride request has been accepted by the driver";
      } else if (status === "rejected") {
        title = "Ride Request Declined";
        message = "Your ride request has been declined by the driver";
      } else if (status === "completed") {
        title = "Ride Completed";
        message = "Your ride has been marked as completed";
      }
      
      if (title) {
        await this.createNotification({
          userId: booking.userId,
          title,
          message,
          type: "booking",
          relatedId: booking.id
        });
      }
    }
    
    return booking;
  }

  // Package operations
  async getPackage(id: number): Promise<Package | undefined> {
    const result = await db.select().from(packages).where(eq(packages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getPackagesByUserId(userId: number): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.userId, userId));
  }

  async getPackagesByTripId(tripId: number): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.tripId, tripId));
  }

  async createPackage(insertPackage: InsertPackage & { trackingNumber: string }): Promise<Package> {
    const values = {
      ...insertPackage,
      status: "pending",
      description: insertPackage.description ?? null,
      message: insertPackage.message ?? null
    };
    
    const result = await db.insert(packages).values(values).returning();
    
    // After creating a package request, send notification to the driver
    const pkg = result[0];
    const trip = await this.getTrip(pkg.tripId);
    if (trip) {
      const driver = await this.getDriver(trip.driverId);
      if (driver) {
        await this.createNotification({
          userId: driver.userId,
          title: "New Package Delivery Request",
          message: `You have a new package delivery request for your trip to ${trip.destinationCity}`,
          type: "package",
          relatedId: pkg.id
        });
      }
    }
    
    return pkg;
  }

  async updatePackageStatus(id: number, status: string): Promise<Package | undefined> {
    const values: Partial<Package> = { 
      status,
      updatedAt: new Date()
    };
    
    if (status === "delivered") {
      values.deliveredAt = new Date();
    }
    
    const result = await db
      .update(packages)
      .set(values)
      .where(eq(packages.id, id))
      .returning();
    
    // After updating package status, send notification to the sender
    const pkg = result[0];
    if (pkg) {
      let title = "";
      let message = "";
      
      if (status === "approved") {
        title = "Package Request Accepted";
        message = "Your package delivery request has been accepted by the driver";
      } else if (status === "rejected") {
        title = "Package Request Declined";
        message = "Your package delivery request has been declined by the driver";
      } else if (status === "in_transit") {
        title = "Package In Transit";
        message = "Your package is now in transit";
      } else if (status === "delivered") {
        title = "Package Delivered";
        message = "Your package has been delivered successfully";
      }
      
      if (title) {
        await this.createNotification({
          userId: pkg.userId,
          title,
          message,
          type: "package",
          relatedId: pkg.id
        });
      }
    }
    
    return pkg;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.toUserId, userId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const values = {
      ...insertReview,
      tripId: insertReview.tripId ?? null,
      bookingId: insertReview.bookingId ?? null,
      packageId: insertReview.packageId ?? null,
      comment: insertReview.comment ?? null
    };
    
    const result = await db.insert(reviews).values(values).returning();
    
    // After creating a review, send notification to the reviewed user
    const review = result[0];
    await this.createNotification({
      userId: review.toUserId,
      title: "New Review",
      message: `You have received a new ${review.rating}-star review`,
      type: "review",
      relatedId: review.id
    });
    
    return review;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const values = {
      ...insertNotification,
      relatedId: insertNotification.relatedId ?? null
    };
    const result = await db.insert(notifications).values(values).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
}

export const storage = new DatabaseStorage();
