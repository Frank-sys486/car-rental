import { z } from "zod";

export const vehicleStatusSchema = z.enum(["available", "maintenance", "booked"]);
export const bookingStatusSchema = z.enum(["pending", "pending_id_missing", "confirmed", "completed", "cancelled"]);
export const transmissionSchema = z.enum(["auto", "manual"]);

export const vehicleSchema = z.object({
  id: z.string(),
  model: z.string(),
  plate: z.string(),
  dailyRate: z.number(),
  transmission: transmissionSchema,
  colorHex: z.string(),
  status: vehicleStatusSchema,
  imageUrl: z.string(),
  rateType: z.string().default("24hr"),
  nextAvailableDate: z.string().optional(),
});

export const insertVehicleSchema = vehicleSchema.omit({ id: true, nextAvailableDate: true });

export const bookingSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  guestName: z.string(),
  guestPhone: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalPrice: z.number(),
  status: bookingStatusSchema,
  idVerified: z.boolean(),
  idImageUrl: z.string().nullable().optional(),
});

export const insertBookingSchema = bookingSchema.omit({ id: true });

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = z.infer<typeof bookingSchema>;

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type Transmission = z.infer<typeof transmissionSchema>;

export interface BookingWithVehicle extends Booking {
  vehicle?: Vehicle;
}

export interface DashboardStats {
  totalCars: number;
  rentedToday: number;
  revenueToday: number;
  monthlyRevenue: number;
}
