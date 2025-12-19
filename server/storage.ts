import type { Vehicle, Booking, InsertVehicle, InsertBooking, DashboardStats } from "@shared/schema";
import { randomUUID } from "crypto";
import { format, isWithinInterval, parseISO, areIntervalsOverlapping, max, addDays, startOfMonth, endOfMonth } from "date-fns";

export interface IStorage {
  getVehicles(start?: string, end?: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByVehicle(vehicleId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  getStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<string, Vehicle>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.vehicles = new Map();
    this.bookings = new Map();
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockVehicles: Vehicle[] = [
      {
        id: "v1",
        model: "Toyota Vios",
        plate: "ABC 1234",
        dailyRate: 1500,
        transmission: "auto",
        colorHex: "#3B82F6",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
        rateType: "24hr",
      },
      {
        id: "v2",
        model: "Honda City",
        plate: "XYZ 5678",
        dailyRate: 1800,
        transmission: "auto",
        colorHex: "#10B981",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800&q=80",
        rateType: "24hr",
      },
      {
        id: "v3",
        model: "Mitsubishi Mirage",
        plate: "DEF 9012",
        dailyRate: 1200,
        transmission: "manual",
        colorHex: "#F59E0B",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
        rateType: "24hr",
      },
      {
        id: "v4",
        model: "Nissan Almera",
        plate: "GHI 3456",
        dailyRate: 1600,
        transmission: "auto",
        colorHex: "#8B5CF6",
        status: "maintenance",
        imageUrl: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
        rateType: "24hr",
      },
      {
        id: "v5",
        model: "Suzuki Ertiga",
        plate: "JKL 7890",
        dailyRate: 2200,
        transmission: "auto",
        colorHex: "#EF4444",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
        rateType: "24hr",
      },
    ];

    const today = new Date();
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const mockBookings: Booking[] = [
      {
        id: "b1",
        vehicleId: "v1",
        guestName: "Juan dela Cruz",
        guestPhone: "+63 912 345 6789",
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(addDays(today, 3), "yyyy-MM-dd"),
        totalPrice: 4500,
        status: "confirmed",
        idVerified: true,
        idImageUrl: null,
      },
      {
        id: "b2",
        vehicleId: "v2",
        guestName: "Maria Santos",
        guestPhone: "+63 923 456 7890",
        startDate: format(addDays(today, 2), "yyyy-MM-dd"),
        endDate: format(addDays(today, 5), "yyyy-MM-dd"),
        totalPrice: 5400,
        status: "pending",
        idVerified: false,
        idImageUrl: null,
      },
      {
        id: "b3",
        vehicleId: "v5",
        guestName: "Pedro Reyes",
        guestPhone: "+63 934 567 8901",
        startDate: format(addDays(today, 1), "yyyy-MM-dd"),
        endDate: format(addDays(today, 4), "yyyy-MM-dd"),
        totalPrice: 6600,
        status: "confirmed",
        idVerified: true,
        idImageUrl: null,
      },
    ];

    mockVehicles.forEach((v) => this.vehicles.set(v.id, v));
    mockBookings.forEach((b) => this.bookings.set(b.id, b));
  }

  private updateExpiredBookings() {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    this.bookings.forEach((booking) => {
      if (booking.status === "confirmed" && booking.endDate < todayStr) {
        booking.status = "completed";
        this.bookings.set(booking.id, booking);
      }
    });
  }

  async getVehicles(start?: string, end?: string): Promise<Vehicle[]> {
    this.updateExpiredBookings();
    const allVehicles = Array.from(this.vehicles.values());
    const allBookings = Array.from(this.bookings.values());

    if (!start || !end) {
      return allVehicles.map(v => ({
        ...v,
        status: v.status === 'maintenance' ? 'maintenance' : 'available'
      }));
    }

    const searchInterval = {
      start: parseISO(start),
      end: parseISO(end),
    };

    return allVehicles.map((vehicle) => {
      if (vehicle.status === "maintenance") {
        return { ...vehicle, status: "maintenance" };
      }

      const vehicleBookings = allBookings.filter(
        (b) => b.vehicleId === vehicle.id && b.status !== 'cancelled'
      );

      const isBookedInSearchRange = vehicleBookings.some((booking) =>
        areIntervalsOverlapping(searchInterval, { start: parseISO(booking.startDate), end: parseISO(booking.endDate) })
      );

      if (isBookedInSearchRange) {
        const lastBookingEnd = max(vehicleBookings.map((b) => parseISO(b.endDate)));
        const nextAvailable = addDays(lastBookingEnd, 1);
        return { ...vehicle, status: "booked", nextAvailableDate: format(nextAvailable, "yyyy-MM-dd") };
      }

      return { ...vehicle, status: "available" };
    });
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const newVehicle: Vehicle = { 
      ...vehicle, 
      id,
      status: vehicle.status || "available",
    };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    const updated = { ...vehicle, ...updates };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async getBookings(): Promise<Booking[]> {
    this.updateExpiredBookings();
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByVehicle(vehicleId: string): Promise<Booking[]> {
    this.updateExpiredBookings();
    return Array.from(this.bookings.values()).filter(
      (b) => b.vehicleId === vehicleId
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const newBooking: Booking = { 
      ...booking, 
      id,
      status: booking.status || "pending",
      idVerified: booking.idVerified ?? false,
      idImageUrl: booking.idImageUrl ?? null,
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const updated = { ...booking, ...updates };
    this.bookings.set(id, updated);
    return updated;
  }

  async getStats(): Promise<DashboardStats> {
    this.updateExpiredBookings();
    const vehicles = Array.from(this.vehicles.values());
    const bookings = Array.from(this.bookings.values());
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const activeBookings = bookings.filter((b) => {
      if (b.status === "cancelled" || b.status === "completed") return false;
      try {
        const start = parseISO(b.startDate);
        const end = parseISO(b.endDate);
        const todayDate = parseISO(todayStr);
        return isWithinInterval(todayDate, { start, end });
      } catch {
        return false;
      }
    });

    const revenueToday = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    const monthlyCompletedBookings = bookings.filter((b) => {
      if (b.status !== "completed") return false;
      try {
        const bookingEndDate = parseISO(b.endDate);
        return isWithinInterval(bookingEndDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
      } catch {
        return false;
      }
    });

    const monthlyRevenue = monthlyCompletedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      totalCars: vehicles.length,
      rentedToday: activeBookings.length,
      revenueToday,
      monthlyRevenue,
    };
  }
}

export const storage = new MemStorage();
