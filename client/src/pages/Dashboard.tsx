import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Vehicle, Booking, DashboardStats } from "@shared/schema";
import { GanttChart } from "@/components/GanttChart";
import { StatsCard } from "@/components/StatsCard";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/context/RoleContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Car, CalendarCheck, Banknote, LayoutDashboard, ShieldAlert, RefreshCw, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useRole();
  const [, setLocation] = useLocation();

  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">
            This page is only accessible to administrators. Switch to Admin view to access the dashboard.
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (vehiclesError || bookingsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Data</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load the dashboard data. Please try again.
          </p>
          <Button 
            onClick={() => {
              refetchVehicles();
              refetchBookings();
              refetchStats();
            }}
            className="gap-2"
            data-testid="button-retry"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDetailsModalOpen(false);
      setSelectedBooking(null);
      toast({
        title: "Booking Updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const handleApprove = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: "confirmed" });
  };

  const handleComplete = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: "completed" });
  };

  const handleCancel = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: "cancelled" });
  };

  const selectedVehicle = selectedBooking
    ? vehicles?.find((v) => v.id === selectedBooking.vehicleId)
    : null;

  const isLoading = vehiclesLoading || bookingsLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your fleet and bookings at a glance
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Cars"
          value={stats?.totalCars ?? 0}
          icon={Car}
          description="In your fleet"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Rented Today"
          value={stats?.rentedToday ?? 0}
          icon={CalendarCheck}
          description="Active rentals"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Revenue Today"
          value={`₱${(stats?.revenueToday ?? 0).toLocaleString()}`}
          icon={Banknote}
          description="From active bookings"
          isLoading={statsLoading}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Timeline</h2>
          <p className="text-sm text-muted-foreground">Next 30 days</p>
        </div>

        {isLoading ? (
          <Card className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </Card>
        ) : vehicles && vehicles.length > 0 ? (
          <GanttChart
            vehicles={vehicles}
            bookings={bookings || []}
            onBookingClick={handleBookingClick}
          />
        ) : (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Vehicles Yet</h2>
            <p className="text-muted-foreground">
              Add vehicles to your fleet to see the booking timeline.
            </p>
          </Card>
        )}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        vehicle={selectedVehicle || null}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onApprove={handleApprove}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isLoading={updateBookingMutation.isPending}
      />
    </div>
  );
}
