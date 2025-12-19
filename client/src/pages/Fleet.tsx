import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import type { Vehicle, InsertBooking, InsertVehicle } from "@shared/schema";
import { CarCard } from "@/components/CarCard";
import { BookingModal } from "@/components/BookingModal";
import { VehicleDialog } from "@/components/VehicleDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/context/RoleContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CarFront, AlertCircle, Plus } from "lucide-react";

export default function Fleet() {
  const { isAdmin } = useRole();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const startDateParam = searchParams.get("start");
  const endDateParam = searchParams.get("end");

  const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
    queryKey: [`/api/vehicles${searchString ? (searchString.startsWith("?") ? searchString : `?${searchString}`) : ""}`],
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

  const createVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      return apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setVehicleDialogOpen(false);
      toast({ title: "Vehicle Added", description: "New vehicle has been added to the fleet." });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle & { id: string }) => {
      const { id, ...updates } = data;
      return apiRequest("PATCH", `/api/vehicles/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setVehicleDialogOpen(false);
      setEditingVehicle(null);
      toast({ title: "Vehicle Updated", description: "Vehicle details have been updated." });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle Deleted", description: "Vehicle has been removed from the fleet." });
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
    idImageUrl?: string;
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
      idImageUrl: data.idImageUrl,
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    if (confirm(`Are you sure you want to delete ${vehicle.model}?`)) {
      deleteVehicleMutation.mutate(vehicle.id);
    }
  };

  const handleVehicleSubmit = (data: InsertVehicle) => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ ...data, id: editingVehicle.id });
    } else {
      createVehicleMutation.mutate(data);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={handleAddVehicle}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          )}
        </div>
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
              isAdmin={isAdmin}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
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
        defaultDates={
          selectedVehicle?.nextAvailableDate
            ? {
                start: parseISO(selectedVehicle.nextAvailableDate),
                end: addDays(parseISO(selectedVehicle.nextAvailableDate), 1),
              }
            : startDateParam && endDateParam
            ? { start: parseISO(startDateParam), end: parseISO(endDateParam) }
            : undefined
        }
      />

      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        onSubmit={handleVehicleSubmit}
        vehicle={editingVehicle}
        isLoading={createVehicleMutation.isPending || updateVehicleMutation.isPending}
      />
    </div>
  );
}
