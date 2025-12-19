import type { Vehicle, Booking } from "@shared/schema";
import { addDays, format } from "date-fns";

const today = new Date();

export const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    model: "Toyota Vios",
    plate: "ABC 1234",
    dailyRate: 1500,
    transmission: "auto",
    colorHex: "#3B82F6",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
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
  },
];

export const mockBookings: Booking[] = [
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
  },
];
