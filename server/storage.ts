import { 
  User, InsertUser, 
  Driver, InsertDriver,
  DriverJourney, InsertDriverJourney,
  Location, InsertLocation,
  RideType, InsertRideType,
  DeliveryOption, InsertDeliveryOption,
  Ride, InsertRide,
  Package, InsertPackage,
  users, drivers, driverJourneys, locations, rideTypes, deliveryOptions, rides, packages
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, between, like, sql, desc, gte, lte, isNull, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserType(id: number, userType: string): Promise<User | undefined>;
  verifyUser(id: number, isVerified: boolean): Promise<User | undefined>;

  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriverApprovalStatus(id: number, status: string): Promise<Driver | undefined>;
  getDriversByApprovalStatus(status: string): Promise<Driver[]>;

  // Driver Journey operations
  getDriverJourney(id: number): Promise<DriverJourney | undefined>;
  getDriverJourneysByDriverId(driverId: number): Promise<DriverJourney[]>;
  createDriverJourney(journey: InsertDriverJourney): Promise<DriverJourney>;
  updateDriverJourneyStatus(id: number, status: string): Promise<DriverJourney | undefined>;
  updateDriverJourneyAvailableSeats(id: number, seats: number): Promise<DriverJourney | undefined>;
  findMatchingJourneysForRide(pickup: { lat: number, lng: number, city: string }, destination: { lat: number, lng: number, city: string }, date: Date, radiusMiles: number): Promise<DriverJourney[]>;
  findMatchingJourneysForPackage(pickup: { lat: number, lng: number, city: string }, delivery: { lat: number, lng: number, city: string }, date: Date, radiusMiles: number): Promise<DriverJourney[]>;

  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByUserId(userId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Ride type operations
  getRideType(id: number): Promise<RideType | undefined>;
  getRideTypes(): Promise<RideType[]>;
  createRideType(rideType: InsertRideType): Promise<RideType>;

  // Delivery option operations
  getDeliveryOption(id: number): Promise<DeliveryOption | undefined>;
  getDeliveryOptions(): Promise<DeliveryOption[]>;
  createDeliveryOption(deliveryOption: InsertDeliveryOption): Promise<DeliveryOption>;

  // Ride operations
  getRide(id: number): Promise<Ride | undefined>;
  getRidesByUserId(userId: number): Promise<Ride[]>;
  getRidesByJourneyId(journeyId: number): Promise<Ride[]>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRideStatus(id: number, status: string): Promise<Ride | undefined>;
  matchRideWithJourney(rideId: number, journeyId: number): Promise<Ride | undefined>;

  // Package operations
  getPackage(id: number): Promise<Package | undefined>;
  getPackagesByUserId(userId: number): Promise<Package[]>;
  getPackagesByJourneyId(journeyId: number): Promise<Package[]>;
  createPackage(pkg: InsertPackage & { trackingNumber: string }): Promise<Package>;
  updatePackageStatus(id: number, status: string): Promise<Package | undefined>;
  matchPackageWithJourney(packageId: number, journeyId: number): Promise<Package | undefined>;
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

  // Ride type operations
  async getRideType(id: number): Promise<RideType | undefined> {
    const result = await db.select().from(rideTypes).where(eq(rideTypes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getRideTypes(): Promise<RideType[]> {
    return await db.select().from(rideTypes);
  }

  async createRideType(insertRideType: InsertRideType): Promise<RideType> {
    const values = {
      ...insertRideType,
      description: insertRideType.description ?? null,
      icon: insertRideType.icon ?? null,
      active: insertRideType.active ?? null
    };
    const result = await db.insert(rideTypes).values(values).returning();
    return result[0];
  }

  // Delivery option operations
  async getDeliveryOption(id: number): Promise<DeliveryOption | undefined> {
    const result = await db.select().from(deliveryOptions).where(eq(deliveryOptions.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getDeliveryOptions(): Promise<DeliveryOption[]> {
    return await db.select().from(deliveryOptions);
  }

  async createDeliveryOption(insertDeliveryOption: InsertDeliveryOption): Promise<DeliveryOption> {
    const values = {
      ...insertDeliveryOption,
      description: insertDeliveryOption.description ?? null,
      icon: insertDeliveryOption.icon ?? null,
      active: insertDeliveryOption.active ?? null
    };
    const result = await db.insert(deliveryOptions).values(values).returning();
    return result[0];
  }

  // Ride operations
  async getRide(id: number): Promise<Ride | undefined> {
    const result = await db.select().from(rides).where(eq(rides.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getRidesByUserId(userId: number): Promise<Ride[]> {
    return await db.select().from(rides).where(eq(rides.userId, userId));
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const values = {
      ...insertRide,
      status: "pending",
      driverId: null,
      scheduledTime: insertRide.scheduledTime ?? null
    };
    
    const result = await db.insert(rides).values(values).returning();
    return result[0];
  }

  async updateRideStatus(id: number, status: string): Promise<Ride | undefined> {
    const values: Partial<Ride> = { status };
    
    if (status === "completed") {
      values.completedAt = new Date();
    }
    
    const result = await db
      .update(rides)
      .set(values)
      .where(eq(rides.id, id))
      .returning();
      
    return result.length > 0 ? result[0] : undefined;
  }

  // Package operations
  async getPackage(id: number): Promise<Package | undefined> {
    const result = await db.select().from(packages).where(eq(packages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getPackagesByUserId(userId: number): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.userId, userId));
  }

  async createPackage(insertPackage: InsertPackage & { trackingNumber: string }): Promise<Package> {
    const values = {
      ...insertPackage,
      status: "pending",
      driverId: null,
      description: insertPackage.description ?? null
    };
    
    const result = await db.insert(packages).values(values).returning();
    return result[0];
  }

  async updatePackageStatus(id: number, status: string): Promise<Package | undefined> {
    const values: Partial<Package> = { status };
    
    if (status === "delivered") {
      values.deliveredAt = new Date();
    }
    
    const result = await db
      .update(packages)
      .set(values)
      .where(eq(packages.id, id))
      .returning();
      
    return result.length > 0 ? result[0] : undefined;
  }
}

export const storage = new DatabaseStorage();
