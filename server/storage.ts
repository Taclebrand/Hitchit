import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  User, InsertUser,
  Vehicle, InsertVehicle,
  Trip, InsertTrip,
  Booking, InsertBooking,
  users, vehicles, trips, bookings,
} from "@shared/schema";

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;

  // Trip operations
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByDriverId(driverId: number): Promise<Trip[]>;
  getActiveTrips(): Promise<Trip[]>;
  getTripsByCities(departureCity: string, destinationCity: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTripStatus(id: number, status: string): Promise<Trip | undefined>;
  updateTripAvailableSeats(id: number, seats: number): Promise<Trip | undefined>;
  findMatchingTripsForBooking(pickup: { lat: number, lng: number }, dropoff: { lat: number, lng: number }, departureDate: Date, radiusMiles: number): Promise<Trip[]>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByRiderId(riderId: number): Promise<Booking[]>;
  getBookingsByTripId(tripId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByDriverId(driverId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.driverId, driverId));
  }

  async getActiveTrips(): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.status, "active"));
  }

  async getTripsByCities(originCity: string, destinationCity: string): Promise<Trip[]> {
    return db.select().from(trips)
      .where(
        sql`LOWER(${trips.originCity}) LIKE LOWER(${"%" + originCity + "%"})
        AND LOWER(${trips.destinationCity}) LIKE LOWER(${"%" + destinationCity + "%"})
        AND ${trips.status} = ${"active"}`
      );
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values(insertTrip).returning();
    return trip;
  }

  async updateTripStatus(id: number, status: string): Promise<Trip | undefined> {
    const [trip] = await db.update(trips)
      .set({ status })
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async updateTripAvailableSeats(id: number, availableSeats: number): Promise<Trip | undefined> {
    const [trip] = await db.update(trips)
      .set({ availableSeats })
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async findMatchingTripsForBooking(
    pickup: { lat: number, lng: number },
    dropoff: { lat: number, lng: number },
    departureDate: Date,
    radiusMiles: number
  ): Promise<Trip[]> {
    const startOfDay = new Date(departureDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(departureDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const activeTrips = await db.select().from(trips)
      .where(
        sql`${trips.status} = 'active' 
        AND ${trips.departureDate} BETWEEN ${startOfDay} AND ${endOfDay}
        AND ${trips.availableSeats} > 0`
      );
    
    // Filter trips based on proximity to pickup and dropoff locations
    return activeTrips.filter(trip => {
      const pickupDistance = calculateDistance(
        Number(trip.originLat), 
        Number(trip.originLng),
        pickup.lat,
        pickup.lng
      );
      
      const dropoffDistance = calculateDistance(
        Number(trip.destinationLat),
        Number(trip.destinationLng),
        dropoff.lat,
        dropoff.lng
      );
      
      return pickupDistance <= radiusMiles && dropoffDistance <= radiusMiles;
    });
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByRiderId(riderId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.riderId, riderId));
  }

  async getBookingsByTripId(tripId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.tripId, tripId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }
}

export const storage = new DatabaseStorage();