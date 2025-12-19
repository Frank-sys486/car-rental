import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { format, differenceInDays, parseISO } from "date-fns";
import type { Vehicle, InsertBooking } from "@shared/schema";
import { CarCard } from "@/components/CarCard";
import { BookingModal } from "@/components/BookingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CarFront, AlertCircle } from "lucide-react";

export default function Fleet() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const startDateParam = searchParams.get("start");
  const endDateParam = searchParams.get("end");

  const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      return apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setBookingModalOpen(false);
      setSelectedVehicle(null);
      toast({
        title: "Booking Created",
        description: "Your booking has been submitted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookNow = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = (data: {
    guestName: string;
    guestPhone: string;
    startDate: Date;
    endDate: Date;
    idVerified: boolean;
  }) => {
    if (!selectedVehicle) return;

    const days = Math.max(1, differenceInDays(data.endDate, data.startDate));
    const totalPrice = selectedVehicle.dailyRate * days;

    const bookingData: InsertBooking = {
      vehicleId: selectedVehicle.id,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      totalPrice,
      status: data.idVerified ? "pending" : "pending_id_missing",
      idVerified: data.idVerified,
    };

    createBookingMutation.mutate(bookingData);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Fleet</h2>
          <p className="text-muted-foreground">
            We couldn't load the vehicle list. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Our Fleet</h1>
        <p className="text-muted-foreground">
          {startDateParam && endDateParam ? (
            <>
              Showing available cars from{" "}
              <span className="font-medium text-foreground">
                {format(parseISO(startDateParam), "MMM d, yyyy")}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {format(parseISO(endDateParam), "MMM d, yyyy")}
              </span>
            </>
          ) : (
            "Browse and book from our selection of quality vehicles"
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-12 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : vehicles && vehicles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <CarCard
              key={vehicle.id}
              vehicle={vehicle}
              onBookNow={handleBookNow}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CarFront className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Vehicles Available</h2>
          <p className="text-muted-foreground">
            There are no vehicles in the fleet yet. Check back soon!
          </p>
        </Card>
      )}

      <BookingModal
        vehicle={selectedVehicle}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        onSubmit={handleBookingSubmit}
        isLoading={createBookingMutation.isPending}
      />
    </div>
  );
}
