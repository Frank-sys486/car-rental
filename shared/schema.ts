import { pgTable, text, varchar, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  model: text("model").notNull(),
  plate: text("plate").notNull().unique(),
  dailyRate: integer("daily_rate").notNull(),
  transmission: text("transmission").notNull(),
  colorHex: text("color_hex").notNull(),
  status: text("status").notNull().default("available"),
  imageUrl: text("image_url").notNull(),
  rateType: text("rate_type").notNull().default("24hr"),
});

export const bookings = pgTable("bookings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 36 }).notNull(),
  guestName: text("guest_name").notNull(),
  guestPhone: text("guest_phone").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  idVerified: boolean("id_verified").notNull().default(false),
  idImageUrl: text("id_image_url"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true });

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect & {
  nextAvailableDate?: string;
};

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type BookingStatus = "pending" | "pending_id_missing" | "confirmed" | "completed" | "cancelled";
export type VehicleStatus = "available" | "maintenance" | "booked";
export type Transmission = "auto" | "manual";

export interface BookingWithVehicle extends Booking {
  vehicle?: Vehicle;
}

export interface DashboardStats {
  totalCars: number;
  rentedToday: number;
  revenueToday: number;
  monthlyRevenue: number;
}
