import { 
  User, InsertUser, 
  Location, InsertLocation,
  RideType, InsertRideType,
  DeliveryOption, InsertDeliveryOption,
  Ride, InsertRide,
  Package, InsertPackage
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  createRide(ride: InsertRide): Promise<Ride>;
  updateRideStatus(id: number, status: string): Promise<Ride | undefined>;

  // Package operations
  getPackage(id: number): Promise<Package | undefined>;
  getPackagesByUserId(userId: number): Promise<Package[]>;
  createPackage(pkg: InsertPackage & { trackingNumber: string }): Promise<Package>;
  updatePackageStatus(id: number, status: string): Promise<Package | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private rideTypes: Map<number, RideType>;
  private deliveryOptions: Map<number, DeliveryOption>;
  private rides: Map<number, Ride>;
  private packages: Map<number, Package>;
  
  private userId: number;
  private locationId: number;
  private rideTypeId: number;
  private deliveryOptionId: number;
  private rideId: number;
  private packageId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.rideTypes = new Map();
    this.deliveryOptions = new Map();
    this.rides = new Map();
    this.packages = new Map();
    
    this.userId = 1;
    this.locationId = 1;
    this.rideTypeId = 1;
    this.deliveryOptionId = 1;
    this.rideId = 1;
    this.packageId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.userId === userId,
    );
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationId++;
    const now = new Date();
    const location: Location = { 
      ...insertLocation, 
      id,
      createdAt: now
    };
    this.locations.set(id, location);
    return location;
  }

  // Ride type operations
  async getRideType(id: number): Promise<RideType | undefined> {
    return this.rideTypes.get(id);
  }

  async getRideTypes(): Promise<RideType[]> {
    return Array.from(this.rideTypes.values());
  }

  async createRideType(insertRideType: InsertRideType): Promise<RideType> {
    const id = this.rideTypeId++;
    const rideType: RideType = { ...insertRideType, id };
    this.rideTypes.set(id, rideType);
    return rideType;
  }

  // Delivery option operations
  async getDeliveryOption(id: number): Promise<DeliveryOption | undefined> {
    return this.deliveryOptions.get(id);
  }

  async getDeliveryOptions(): Promise<DeliveryOption[]> {
    return Array.from(this.deliveryOptions.values());
  }

  async createDeliveryOption(insertDeliveryOption: InsertDeliveryOption): Promise<DeliveryOption> {
    const id = this.deliveryOptionId++;
    const deliveryOption: DeliveryOption = { ...insertDeliveryOption, id };
    this.deliveryOptions.set(id, deliveryOption);
    return deliveryOption;
  }

  // Ride operations
  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getRidesByUserId(userId: number): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(
      (ride) => ride.userId === userId,
    );
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const id = this.rideId++;
    const now = new Date();
    const ride: Ride = { 
      ...insertRide, 
      id,
      status: "pending",
      driverId: null,
      createdAt: now,
      completedAt: null
    };
    this.rides.set(id, ride);
    return ride;
  }

  async updateRideStatus(id: number, status: string): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;

    const updatedRide: Ride = {
      ...ride,
      status,
      completedAt: status === "completed" ? new Date() : ride.completedAt
    };
    this.rides.set(id, updatedRide);
    return updatedRide;
  }

  // Package operations
  async getPackage(id: number): Promise<Package | undefined> {
    return this.packages.get(id);
  }

  async getPackagesByUserId(userId: number): Promise<Package[]> {
    return Array.from(this.packages.values()).filter(
      (pkg) => pkg.userId === userId,
    );
  }

  async createPackage(insertPackage: InsertPackage & { trackingNumber: string }): Promise<Package> {
    const id = this.packageId++;
    const now = new Date();
    const pkg: Package = { 
      ...insertPackage, 
      id,
      status: "pending",
      driverId: null,
      createdAt: now,
      deliveredAt: null
    };
    this.packages.set(id, pkg);
    return pkg;
  }

  async updatePackageStatus(id: number, status: string): Promise<Package | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;

    const updatedPackage: Package = {
      ...pkg,
      status,
      deliveredAt: status === "delivered" ? new Date() : pkg.deliveredAt
    };
    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }
}

export const storage = new MemStorage();
