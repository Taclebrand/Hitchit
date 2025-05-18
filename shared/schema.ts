import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
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
  isDriver: boolean("is_driver").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  isDriver: true,
  isAdmin: true,
});

// Driver vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  licensePlate: text("license_plate").notNull(),
  seats: integer("seats").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  userId: true,
  make: true,
  model: true,
  year: true,
  color: true,
  licensePlate: true,
  seats: true,
});

// Trips posted by drivers
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  originCity: text("origin_city").notNull(),
  originAddress: text("origin_address").notNull(),
  originLat: decimal("origin_lat", { precision: 10, scale: 7 }).notNull(),
  originLng: decimal("origin_lng", { precision: 10, scale: 7 }).notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  departureDate: timestamp("departure_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  availableSeats: integer("available_seats").notNull(),
  allowPackages: boolean("allow_packages").default(true).notNull(),
  status: text("status").default("active").notNull(), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tripRelations = relations(trips, ({ one }) => ({
  driver: one(users, {
    fields: [trips.driverId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
}));

export const insertTripSchema = createInsertSchema(trips).pick({
  driverId: true,
  vehicleId: true,
  originCity: true,
  originAddress: true,
  originLat: true,
  originLng: true,
  destinationCity: true,
  destinationAddress: true,
  destinationLat: true,
  destinationLng: true,
  departureDate: true,
  price: true,
  availableSeats: true,
  allowPackages: true,
});

// Ride bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  riderId: integer("rider_id").references(() => users.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 7 }).notNull(),
  dropoffLng: decimal("dropoff_lng", { precision: 10, scale: 7 }).notNull(),
  seats: integer("seats").default(1).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, completed, cancelled
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingRelations = relations(bookings, ({ one }) => ({
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
  rider: one(users, {
    fields: [bookings.riderId],
    references: [users.id],
  }),
}));

export const insertBookingSchema = createInsertSchema(bookings).pick({
  tripId: true,
  riderId: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  dropoffAddress: true,
  dropoffLat: true,
  dropoffLng: true,
  seats: true,
  price: true,
  message: true,
});

// Package shipments
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 7 }).notNull(),
  deliveryLng: decimal("delivery_lng", { precision: 10, scale: 7 }).notNull(),
  size: text("size").notNull(), // small, medium, large
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // in kg
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  trackingNumber: text("tracking_number").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, in_transit, delivered, cancelled
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packageRelations = relations(packages, ({ one }) => ({
  trip: one(trips, {
    fields: [packages.tripId],
    references: [trips.id],
  }),
  sender: one(users, {
    fields: [packages.senderId],
    references: [users.id],
  }),
}));

export const insertPackageSchema = createInsertSchema(packages).pick({
  tripId: true,
  senderId: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  deliveryAddress: true,
  deliveryLat: true,
  deliveryLng: true,
  size: true,
  weight: true,
  description: true,
  price: true,
  message: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
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
  isApproved: boolean("is_approved").default(false),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driverRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  trips: many(trips),
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

// Trips posted by drivers
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  departureCity: text("departure_city").notNull(),
  departureAddress: text("departure_address").notNull(),
  departureLat: decimal("departure_lat", { precision: 10, scale: 7 }).notNull(),
  departureLng: decimal("departure_lng", { precision: 10, scale: 7 }).notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  departureDate: timestamp("departure_date").notNull(),
  availableSeats: integer("available_seats").notNull(),
  pricePerSeat: decimal("price_per_seat", { precision: 10, scale: 2 }).notNull(),
  acceptingPackages: boolean("accepting_packages").default(true),
  status: text("status").default("active").notNull(), // 'active', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tripRelations = relations(trips, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  bookings: many(bookings),
  packages: many(packages),
}));

export const insertTripSchema = createInsertSchema(trips).pick({
  driverId: true,
  departureCity: true,
  departureAddress: true,
  departureLat: true,
  departureLng: true,
  destinationCity: true,
  destinationAddress: true,
  destinationLat: true,
  destinationLng: true,
  departureDate: true,
  availableSeats: true,
  pricePerSeat: true,
  acceptingPackages: true,
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

// Vehicle types
export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  maxCapacity: integer("max_capacity").notNull(),
  icon: text("icon").default("car"),
  active: boolean("active").default(true),
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes).pick({
  name: true,
  description: true,
  maxCapacity: true,
  icon: true,
  active: true,
});

// Bookings (ride requests)
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 7 }).notNull(),
  dropoffLng: decimal("dropoff_lng", { precision: 10, scale: 7 }).notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  passengerCount: integer("passenger_count").default(1).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'completed', 'cancelled'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const bookingRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
}));

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  tripId: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  dropoffAddress: true,
  dropoffLat: true,
  dropoffLng: true,
  distance: true,
  price: true,
  passengerCount: true,
  message: true,
});

// Packages
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
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
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'in_transit', 'delivered', 'cancelled'
  trackingNumber: text("tracking_number").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

export const packageRelations = relations(packages, ({ one }) => ({
  user: one(users, {
    fields: [packages.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [packages.tripId],
    references: [trips.id],
  }),
}));

export const insertPackageSchema = createInsertSchema(packages).pick({
  userId: true,
  tripId: true,
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
  message: true,
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  packageId: integer("package_id").references(() => packages.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  fromUserId: true,
  toUserId: true,
  tripId: true,
  bookingId: true,
  packageId: true,
  rating: true,
  comment: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'booking', 'package', 'system', etc.
  relatedId: integer("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  relatedId: true,
});

// Export the types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type VehicleType = typeof vehicleTypes.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
