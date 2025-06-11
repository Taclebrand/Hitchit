import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  User, InsertUser,
  Vehicle, InsertVehicle,
  Trip, InsertTrip,
  Booking, InsertBooking,
  VerificationCode, InsertVerificationCode,
  PaymentMethod, InsertPaymentMethod,
  DriverEarnings, InsertDriverEarnings,
  DriverWithdrawal, InsertDriverWithdrawal,
  PricingSuggestion, InsertPricingSuggestion,
  users, vehicles, trips, bookings, verificationCodes, paymentMethods, 
  driverEarnings, driverWithdrawals, pricingSuggestions,
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
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Authentication operations
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(email: string, phone: string, type: string): Promise<VerificationCode | undefined>;
  verifyCode(id: number): Promise<VerificationCode | undefined>;
  deleteExpiredCodes(): Promise<void>;

  // Payment Methods operations
  getPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<void>;
  setDefaultPaymentMethod(userId: number, methodId: number): Promise<void>;

  // Driver Earnings operations
  getDriverEarnings(driverId: number): Promise<DriverEarnings[]>;
  getAvailableEarnings(driverId: number): Promise<number>;
  createEarning(earning: InsertDriverEarnings): Promise<DriverEarnings>;
  updateEarningStatus(id: number, status: string): Promise<DriverEarnings | undefined>;

  // Driver Withdrawals operations
  getDriverWithdrawals(driverId: number): Promise<DriverWithdrawal[]>;
  createWithdrawal(withdrawal: InsertDriverWithdrawal): Promise<DriverWithdrawal>;
  updateWithdrawalStatus(id: number, status: string, transferId?: string): Promise<DriverWithdrawal | undefined>;

  // Pricing operations
  getPricingSuggestion(originLat: number, originLng: number, destLat: number, destLng: number): Promise<PricingSuggestion | undefined>;
  createPricingSuggestion(suggestion: InsertPricingSuggestion): Promise<PricingSuggestion>;

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
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

  // Authentication operations
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    const [verificationCode] = await db.insert(verificationCodes).values(code).returning();
    return verificationCode;
  }

  async getVerificationCode(email: string, phone: string, type: string): Promise<VerificationCode | undefined> {
    const [code] = await db.select().from(verificationCodes)
      .where(
        sql`(${verificationCodes.email} = ${email} OR ${verificationCodes.phone} = ${phone}) AND ${verificationCodes.type} = ${type}`
      )
      .orderBy(sql`${verificationCodes.createdAt} DESC`)
      .limit(1);
    return code;
  }

  async verifyCode(id: number): Promise<VerificationCode | undefined> {
    // First get the verification code
    const [code] = await db.select().from(verificationCodes)
      .where(eq(verificationCodes.id, id));
    
    if (!code) {
      return undefined;
    }
    
    // Then update it as verified
    const [updatedCode] = await db.update(verificationCodes)
      .set({ verified: true })
      .where(eq(verificationCodes.id, id))
      .returning();
    
    return updatedCode;
  }

  async deleteExpiredCodes(): Promise<void> {
    await db.delete(verificationCodes)
      .where(sql`${verificationCodes.expiresAt} < NOW()`);
  }

  // Payment Methods operations
  async getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(paymentMethods.isDefault, paymentMethods.createdAt);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db.select().from(paymentMethods)
      .where(eq(paymentMethods.id, id));
    return method;
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [paymentMethod] = await db.insert(paymentMethods).values(method).returning();
    return paymentMethod;
  }

  async updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
    const [method] = await db.update(paymentMethods)
      .set(data)
      .where(eq(paymentMethods.id, id))
      .returning();
    return method;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  async setDefaultPaymentMethod(userId: number, methodId: number): Promise<void> {
    // First, set all user's payment methods to non-default
    await db.update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the specified method as default
    await db.update(paymentMethods)
      .set({ isDefault: true })
      .where(eq(paymentMethods.id, methodId));
  }

  // Driver Earnings operations
  async getDriverEarnings(driverId: number): Promise<DriverEarnings[]> {
    return await db.select().from(driverEarnings)
      .where(eq(driverEarnings.driverId, driverId))
      .orderBy(sql`${driverEarnings.createdAt} DESC`);
  }

  async getAvailableEarnings(driverId: number): Promise<number> {
    const result = await db.select({
      total: sql`SUM(${driverEarnings.netAmount})`
    }).from(driverEarnings)
      .where(
        sql`${driverEarnings.driverId} = ${driverId} AND ${driverEarnings.status} = 'available'`
      );
    
    return Number(result[0]?.total || 0);
  }

  async createEarning(earning: InsertDriverEarnings): Promise<DriverEarnings> {
    const [driverEarning] = await db.insert(driverEarnings).values(earning).returning();
    return driverEarning;
  }

  async updateEarningStatus(id: number, status: string): Promise<DriverEarnings | undefined> {
    const [earning] = await db.update(driverEarnings)
      .set({ status })
      .where(eq(driverEarnings.id, id))
      .returning();
    return earning;
  }

  // Driver Withdrawals operations
  async getDriverWithdrawals(driverId: number): Promise<DriverWithdrawal[]> {
    return await db.select().from(driverWithdrawals)
      .where(eq(driverWithdrawals.driverId, driverId))
      .orderBy(sql`${driverWithdrawals.createdAt} DESC`);
  }

  async createWithdrawal(withdrawal: InsertDriverWithdrawal): Promise<DriverWithdrawal> {
    const [driverWithdrawal] = await db.insert(driverWithdrawals).values(withdrawal).returning();
    return driverWithdrawal;
  }

  async updateWithdrawalStatus(id: number, status: string, transferId?: string): Promise<DriverWithdrawal | undefined> {
    const updateData: any = { status };
    if (transferId) updateData.stripeTransferId = transferId;
    if (status === 'completed') updateData.processedAt = new Date();

    const [withdrawal] = await db.update(driverWithdrawals)
      .set(updateData)
      .where(eq(driverWithdrawals.id, id))
      .returning();
    return withdrawal;
  }

  // Pricing operations
  async getPricingSuggestion(originLat: number, originLng: number, destLat: number, destLng: number): Promise<PricingSuggestion | undefined> {
    // Find existing pricing suggestion within 1 mile radius
    const radiusMiles = 1;
    const [suggestion] = await db.select().from(pricingSuggestions)
      .where(sql`
        (6371 * acos(cos(radians(${originLat})) * cos(radians(${pricingSuggestions.originLat})) * 
         cos(radians(${pricingSuggestions.originLng}) - radians(${originLng})) + 
         sin(radians(${originLat})) * sin(radians(${pricingSuggestions.originLat})))) <= ${radiusMiles}
        AND
        (6371 * acos(cos(radians(${destLat})) * cos(radians(${pricingSuggestions.destinationLat})) * 
         cos(radians(${pricingSuggestions.destinationLng}) - radians(${destLng})) + 
         sin(radians(${destLat})) * sin(radians(${pricingSuggestions.destinationLat})))) <= ${radiusMiles}
      `)
      .orderBy(sql`${pricingSuggestions.createdAt} DESC`)
      .limit(1);
    
    return suggestion;
  }

  async createPricingSuggestion(suggestion: InsertPricingSuggestion): Promise<PricingSuggestion> {
    const [pricingSuggestion] = await db.insert(pricingSuggestions).values(suggestion).returning();
    return pricingSuggestion;
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