import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { apiRequest } from "./queryClient";
import type { Vehicle, Booking, InsertVehicle, InsertBooking, DashboardStats } from "@shared/schema";
import { format, isWithinInterval, parseISO, areIntervalsOverlapping, max, addDays, startOfMonth, endOfMonth } from "date-fns";

// Helper to check if we should use Firebase
const useFirebase = () => !!db;

export async function getVehicles(start?: string, end?: string): Promise<Vehicle[]> {
  if (useFirebase()) {
    // Update expired bookings first (Client-side logic mimicking server)
    await updateExpiredBookings();

    const vehiclesSnap = await getDocs(collection(db!, "vehicles"));
    const allVehicles = vehiclesSnap.docs.map(doc => doc.data() as Vehicle);

    if (!start || !end) {
      return allVehicles.map(v => ({
        ...v,
        status: v.status === 'maintenance' ? 'maintenance' : 'available'
      }));
    }

    const bookingsSnap = await getDocs(collection(db!, "bookings"));
    const allBookings = bookingsSnap.docs.map(doc => doc.data() as Booking);

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

  // Fallback to API
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const queryString = params.toString();
  const res = await apiRequest("GET", `/api/vehicles${queryString ? `?${queryString}` : ""}`);
  return res.json();
}

export async function createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
  if (useFirebase()) {
    const id = self.crypto.randomUUID();
    const newVehicle: Vehicle = { ...vehicle, id, status: vehicle.status || "available" };
    await setDoc(doc(db!, "vehicles", id), newVehicle);
    return newVehicle;
  }
  const res = await apiRequest("POST", "/api/vehicles", vehicle);
  return res.json();
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  if (useFirebase()) {
    const ref = doc(db!, "vehicles", id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Vehicle;
  }
  const res = await apiRequest("PATCH", `/api/vehicles/${id}`, updates);
  return res.json();
}

export async function deleteVehicle(id: string): Promise<void> {
  if (useFirebase()) {
    await deleteDoc(doc(db!, "vehicles", id));
    return;
  }
  await apiRequest("DELETE", `/api/vehicles/${id}`);
}

export async function getBookings(): Promise<Booking[]> {
  if (useFirebase()) {
    await updateExpiredBookings();
    const snapshot = await getDocs(collection(db!, "bookings"));
    return snapshot.docs.map(doc => doc.data() as Booking);
  }
  const res = await apiRequest("GET", "/api/bookings");
  return res.json();
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  if (useFirebase()) {
    const id = self.crypto.randomUUID();
    const newBooking: Booking = { 
      ...booking, 
      id, 
      status: booking.status || "pending",
      idVerified: booking.idVerified ?? false,
      idImageUrl: booking.idImageUrl ?? null
    };
    await setDoc(doc(db!, "bookings", id), newBooking);
    return newBooking;
  }
  const res = await apiRequest("POST", "/api/bookings", booking);
  return res.json();
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  if (useFirebase()) {
    const ref = doc(db!, "bookings", id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Booking;
  }
  const res = await apiRequest("PATCH", `/api/bookings/${id}`, updates);
  return res.json();
}

export async function getStats(): Promise<DashboardStats> {
  if (useFirebase()) {
    // Calculate stats on client
    const vehicles = await getVehicles();
    const bookings = await getBookings();
    
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
  const res = await apiRequest("GET", "/api/stats");
  return res.json();
}

async function updateExpiredBookings() {
  if (!db) return;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const q = query(
    collection(db, "bookings"), 
    where("status", "==", "confirmed"),
    where("endDate", "<", todayStr)
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: "completed" });
    });
    await batch.commit();
  }
}