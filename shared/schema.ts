import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/****************************
 * Schema for HitchIt App
 ****************************/

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional for OAuth users
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatar: text("avatar"),
  isDriver: boolean("is_driver").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  authProvider: text("auth_provider").default("email").notNull(), // email, google, apple, phone
  providerId: text("provider_id"), // OAuth provider ID
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"), // For drivers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  isDriver: true,
  isVerified: true,
  authProvider: true,
  providerId: true,
  stripeCustomerId: true,
  stripeConnectAccountId: true,
});

// Vehicles Table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull().default("Sedan"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  licensePlate: text("license_plate").notNull(),
  seats: integer("seats").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  type: true,
  make: true,
  model: true,
  year: true,
  color: true,
  licensePlate: true,
  seats: true,
}).extend({
  userId: z.number().optional(), // Will be set server-side from auth
});

// Trips Table
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
  status: text("status").default("active").notNull(), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

// Bookings Table
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

// Verification Codes Table
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  phone: text("phone"),
  code: text("code").notNull(),
  type: text("type").notNull(), // email, phone, google, apple
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Methods Table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // card, bank_account, paypal, apple_pay
  stripePaymentMethodId: text("stripe_payment_method_id"),
  lastFour: text("last_four"),
  brand: text("brand"), // visa, mastercard, etc
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver Earnings Table
export const driverEarnings = pgTable("driver_earnings", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(), // pending, available, withdrawn
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver Withdrawals Table
export const driverWithdrawals = pgTable("driver_withdrawals", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("processing").notNull(), // processing, completed, failed
  stripeTransferId: text("stripe_transfer_id"),
  bankAccount: text("bank_account"), // Last 4 digits
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pricing Suggestions Table
export const pricingSuggestions = pgTable("pricing_suggestions", {
  id: serial("id").primaryKey(),
  originLat: decimal("origin_lat", { precision: 10, scale: 7 }).notNull(),
  originLng: decimal("origin_lng", { precision: 10, scale: 7 }).notNull(),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 7 }).notNull(),
  destinationLng: decimal("destination_lng", { precision: 10, scale: 7 }).notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(), // in miles
  duration: integer("duration").notNull(), // in minutes
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }).notNull(),
  suggestedMinPrice: decimal("suggested_min_price", { precision: 10, scale: 2 }).notNull(),
  suggestedMaxPrice: decimal("suggested_max_price", { precision: 10, scale: 2 }).notNull(),
  demandMultiplier: decimal("demand_multiplier", { precision: 3, scale: 2 }).default("1.0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).pick({
  userId: true,
  email: true,
  phone: true,
  code: true,
  type: true,
  expiresAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  type: true,
  stripePaymentMethodId: true,
  lastFour: true,
  brand: true,
  expiryMonth: true,
  expiryYear: true,
  isDefault: true,
});

export const insertDriverEarningsSchema = createInsertSchema(driverEarnings).pick({
  driverId: true,
  tripId: true,
  bookingId: true,
  amount: true,
  platformFee: true,
  netAmount: true,
});

export const insertDriverWithdrawalSchema = createInsertSchema(driverWithdrawals).pick({
  driverId: true,
  amount: true,
  bankAccount: true,
});

export const insertPricingSuggestionSchema = createInsertSchema(pricingSuggestions).pick({
  originLat: true,
  originLng: true,
  destinationLat: true,
  destinationLng: true,
  distance: true,
  duration: true,
  baseFare: true,
  suggestedMinPrice: true,
  suggestedMaxPrice: true,
  demandMultiplier: true,
});

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type DriverEarnings = typeof driverEarnings.$inferSelect;
export type InsertDriverEarnings = z.infer<typeof insertDriverEarningsSchema>;

export type DriverWithdrawal = typeof driverWithdrawals.$inferSelect;
export type InsertDriverWithdrawal = z.infer<typeof insertDriverWithdrawalSchema>;

export type PricingSuggestion = typeof pricingSuggestions.$inferSelect;
export type InsertPricingSuggestion = z.infer<typeof insertPricingSuggestionSchema>;

// Trip Shares Table - for QR code sharing functionality
export const tripShares = pgTable("trip_shares", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  sharedByUserId: integer("shared_by_user_id").references(() => users.id).notNull(),
  shareCode: text("share_code").notNull().unique(), // Unique code for the QR
  qrCodeData: text("qr_code_data").notNull(), // Base64 encoded QR code image
  shareUrl: text("share_url").notNull(), // Deep link URL
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripShareSchema = createInsertSchema(tripShares).pick({
  tripId: true,
  sharedByUserId: true,
  shareCode: true,
  qrCodeData: true,
  shareUrl: true,
  isActive: true,
  expiresAt: true,
});

export type TripShare = typeof tripShares.$inferSelect;
export type InsertTripShare = z.infer<typeof insertTripShareSchema>;