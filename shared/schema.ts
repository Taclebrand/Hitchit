import { pgTable, text, serial, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
});

// Saved locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
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

// Rides
export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rideTypeId: integer("ride_type_id").references(() => rideTypes.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  driverId: integer("driver_id"),
  scheduledTime: timestamp("scheduled_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertRideSchema = createInsertSchema(rides).pick({
  userId: true,
  rideTypeId: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  destinationAddress: true,
  destinationLat: true,
  destinationLng: true,
  distance: true,
  price: true,
  scheduledTime: true,
});

// Packages
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deliveryOptionId: integer("delivery_option_id").references(() => deliveryOptions.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 7 }).notNull(),
  deliveryLng: decimal("delivery_lng", { precision: 10, scale: 7 }).notNull(),
  size: text("size").notNull(),
  weight: text("weight").notNull(),
  description: text("description"),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  trackingNumber: text("tracking_number").notNull(),
  driverId: integer("driver_id"),
  scheduledTime: timestamp("scheduled_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

export const insertPackageSchema = createInsertSchema(packages).pick({
  userId: true,
  deliveryOptionId: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  deliveryAddress: true,
  deliveryLat: true,
  deliveryLng: true,
  size: true,
  weight: true,
  description: true,
  distance: true,
  price: true,
  scheduledTime: true,
});

// Export the types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
