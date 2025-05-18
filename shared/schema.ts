import { pgTable, text, serial, integer, decimal, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
  userType: text("user_type").default("rider").notNull(), // 'rider', 'driver', 'admin'
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [users.id],
    references: [drivers.userId],
  }),
  postedRides: many(driverJourneys),
  requestedRides: many(rides),
  requestedPackages: many(packages),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  userType: true,
});

// Driver verification documents and details
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  licenseNumber: text("license_number").notNull(),
  licenseImage: text("license_image").notNull(),
  insuranceNumber: text("insurance_number").notNull(),
  insuranceImage: text("insurance_image").notNull(),
  registrationNumber: text("registration_number").notNull(),
  registrationImage: text("registration_image").notNull(),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: integer("vehicle_year").notNull(),
  vehicleColor: text("vehicle_color").notNull(),
  vehicleMileage: integer("vehicle_mileage"),
  approvalStatus: text("approval_status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driverRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  journeys: many(driverJourneys),
}));

export const insertDriverSchema = createInsertSchema(drivers).pick({
  userId: true,
  licenseNumber: true,
  licenseImage: true,
  insuranceNumber: true,
  insuranceImage: true,
  registrationNumber: true,
  registrationImage: true,
  vehicleMake: true,
  vehicleModel: true,
  vehicleYear: true,
  vehicleColor: true,
  vehicleMileage: true,
});

// Driver posted journeys
export const driverJourneys = pgTable("driver_journeys", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  originCity: text("origin_city").notNull(),
  originAddress: text("origin_address").notNull(),
  originLat: decimal("origin_lat", { precision: 10, scale: 7 }).notNull(),
  originLng: decimal("origin_lng", { precision: 10, scale: 7 }).notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: text("departure_time").notNull(), // stored as HH:MM format
  availableSeats: integer("available_seats").notNull(),
  pricePerSeat: decimal("price_per_seat", { precision: 10, scale: 2 }).notNull(),
  acceptPackages: boolean("accept_packages").default(true),
  status: text("status").default("active").notNull(), // 'active', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const driverJourneyRelations = relations(driverJourneys, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [driverJourneys.driverId],
    references: [drivers.id],
  }),
  rideMatches: many(rides),
  packageMatches: many(packages),
}));

export const insertDriverJourneySchema = createInsertSchema(driverJourneys).pick({
  driverId: true,
  originCity: true,
  originAddress: true,
  originLat: true,
  originLng: true,
  destinationCity: true,
  destinationAddress: true,
  destinationLat: true,
  destinationLng: true,
  departureDate: true,
  departureTime: true,
  availableSeats: true,
  pricePerSeat: true,
  acceptPackages: true,
});

// Saved locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  icon: text("icon").default("building"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  userId: true,
  name: true,
  address: true,
  city: true,
  lat: true,
  lng: true,
  icon: true,
  isDefault: true,
});

// Ride types
export const rideTypes = pgTable("ride_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerMile: decimal("price_per_mile", { precision: 10, scale: 2 }).notNull(),
  icon: text("icon").default("car"),
  capacity: integer("capacity").notNull(),
  active: boolean("active").default(true),
});

export const insertRideTypeSchema = createInsertSchema(rideTypes).pick({
  name: true,
  description: true,
  basePrice: true,
  pricePerMile: true,
  icon: true,
  capacity: true,
  active: true,
});

// Package delivery options
export const deliveryOptions = pgTable("delivery_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerMile: decimal("price_per_mile", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: text("estimated_time").notNull(),
  icon: text("icon").default("truck"),
  active: boolean("active").default(true),
});

export const insertDeliveryOptionSchema = createInsertSchema(deliveryOptions).pick({
  name: true,
  description: true,
  basePrice: true,
  pricePerMile: true,
  estimatedTime: true,
  icon: true,
  active: true,
});

// Rides requested by riders
export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  journeyId: integer("journey_id").references(() => driverJourneys.id),
  rideTypeId: integer("ride_type_id").references(() => rideTypes.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: text("pickup_city").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  passengerCount: integer("passenger_count").default(1).notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: text("departure_time"),
  status: text("status").notNull().default("pending"), // 'pending', 'matched', 'accepted', 'rejected', 'completed', 'cancelled'
  matchedAt: timestamp("matched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const rideRelations = relations(rides, ({ one }) => ({
  user: one(users, {
    fields: [rides.userId],
    references: [users.id],
  }),
  journey: one(driverJourneys, {
    fields: [rides.journeyId],
    references: [driverJourneys.id],
  }),
  rideType: one(rideTypes, {
    fields: [rides.rideTypeId],
    references: [rideTypes.id],
  }),
}));

export const insertRideSchema = createInsertSchema(rides).pick({
  userId: true,
  rideTypeId: true,
  pickupAddress: true,
  pickupCity: true,
  pickupLat: true,
  pickupLng: true,
  destinationAddress: true,
  destinationCity: true,
  destinationLat: true,
  destinationLng: true,
  distance: true,
  price: true,
  passengerCount: true,
  departureDate: true,
  departureTime: true,
});

// Packages
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  journeyId: integer("journey_id").references(() => driverJourneys.id),
  deliveryOptionId: integer("delivery_option_id").references(() => deliveryOptions.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: text("pickup_city").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 7 }).notNull(),
  deliveryLng: decimal("delivery_lng", { precision: 10, scale: 7 }).notNull(),
  size: text("size").notNull(),
  weight: text("weight").notNull(),
  description: text("description"),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  departureDate: date("departure_date").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'matched', 'accepted', 'rejected', 'in_transit', 'delivered', 'cancelled'
  trackingNumber: text("tracking_number").notNull(),
  matchedAt: timestamp("matched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

export const packageRelations = relations(packages, ({ one }) => ({
  user: one(users, {
    fields: [packages.userId],
    references: [users.id],
  }),
  journey: one(driverJourneys, {
    fields: [packages.journeyId],
    references: [driverJourneys.id],
  }),
  deliveryOption: one(deliveryOptions, {
    fields: [packages.deliveryOptionId],
    references: [deliveryOptions.id],
  }),
}));

export const insertPackageSchema = createInsertSchema(packages).pick({
  userId: true,
  deliveryOptionId: true,
  pickupAddress: true,
  pickupCity: true,
  pickupLat: true,
  pickupLng: true,
  deliveryAddress: true,
  deliveryCity: true,
  deliveryLat: true,
  deliveryLng: true,
  size: true,
  weight: true,
  description: true,
  distance: true,
  price: true,
  departureDate: true,
});

// Export the types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertDriverJourney = z.infer<typeof insertDriverJourneySchema>;
export type DriverJourney = typeof driverJourneys.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertRideType = z.infer<typeof insertRideTypeSchema>;
export type RideType = typeof rideTypes.$inferSelect;

export type InsertDeliveryOption = z.infer<typeof insertDeliveryOptionSchema>;
export type DeliveryOption = typeof deliveryOptions.$inferSelect;

export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof rides.$inferSelect;

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;
