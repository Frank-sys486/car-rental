import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";
import type { Vehicle, Booking, DashboardStats } from "@shared/schema";
import { GanttChart } from "@/components/GanttChart";
import { StatsCard } from "@/components/StatsCard";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { BookingEditDialog } from "@/components/BookingEditDialog";
import { CustomerEditDialog } from "@/components/CustomerEditDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/context/RoleContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Car, CalendarCheck, Banknote, LayoutDashboard, ShieldAlert, RefreshCw, AlertCircle, TrendingUp, Plus, Settings, Users, Phone, Calendar, Eye, Pencil, Search } from "lucide-react";
import { getVehicles, getBookings, getStats, updateBooking, createBooking, updateCustomer, type Customer, isFirebaseEnabled, subscribeToVehicles, subscribeToBookings, updateExpiredBookings } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addBookingModalOpen, setAddBookingModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [viewIdImage, setViewIdImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useRole();
  const [, setLocation] = useLocation();

  const isFirebase = isFirebaseEnabled();

  // Setup Real-time Listeners for Firebase
  useEffect(() => {
    if (!isFirebase) return;

    // Trigger cleanup once on mount
    updateExpiredBookings();

    const unsubVehicles = subscribeToVehicles((data) => {
      queryClient.setQueryData(["vehicles"], data);
    });

    const unsubBookings = subscribeToBookings((data) => {
      queryClient.setQueryData(["bookings"], data);
    });

    return () => {
      unsubVehicles();
      unsubBookings();
    };
  }, [isFirebase]);

  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: () => getVehicles(),
    refetchInterval: isFirebase ? false : 5000, // Re-enable polling for local mode
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: () => getBookings(),
    refetchInterval: isFirebase ? false : 5000, // Re-enable polling for local mode
  });

  const { data: fetchedStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: () => getStats(),
    refetchInterval: isFirebase ? false : 5000, // Re-enable polling for local mode
  });

  // Calculate stats client-side when using Firebase to save reads
  const stats = useMemo(() => {
    if (!isFirebase || !vehicles || !bookings) return fetchedStats;

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const activeBookings = bookings.filter((b) => {
      if (b.status === "cancelled" || b.status === "completed" || b.status === "archived") return false;
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
  }, [isFirebase, vehicles, bookings, fetchedStats]);

  const visibleBookings = useMemo(() => {
    return bookings?.filter((b) => b.status !== "archived") || [];
  }, [bookings]);

  const customers = useMemo(() => {
    if (!bookings) return [];
    const customerMap = new Map<string, Customer>();
    
    const sortedBookings = [...bookings].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    sortedBookings.forEach(booking => {
      if (booking.status !== 'confirmed' && booking.status !== 'completed') return;

      const key = booking.guestName.trim().toLowerCase();
      const existing = customerMap.get(key);

      if (!existing) {
        customerMap.set(key, {
          name: booking.guestName,
          phone: booking.guestPhone,
          idImageUrl: booking.idImageUrl,
          totalBookings: 1,
          lastBooking: booking.startDate
        });
      } else {
        existing.totalBookings++;
        existing.lastBooking = booking.startDate;
        existing.phone = booking.guestPhone;
        if (booking.idImageUrl) existing.idImageUrl = booking.idImageUrl;
        existing.name = booking.guestName;
      }
    });
    const allCustomers = Array.from(customerMap.values()).sort((a, b) => new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime());
    if (!customerSearch) return allCustomers;
    return allCustomers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch));
  }, [bookings]);

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
    mutationFn: async ({ id, ...updates }: Partial<Booking> & { id: string }) => {
      return updateBooking(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
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

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return createBooking(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setAddBookingModalOpen(false);
      toast({
        title: "Booking Created",
        description: "New booking has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create booking.",
        variant: "destructive",
      });
    },
  });

  const handleEditBooking = (id: string | undefined, data: any) => {
    updateBookingMutation.mutate({
      id,
      ...data,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        setEditModalOpen(false);
        setDetailsModalOpen(true);
      }
    });
  };

  const handleCreateBooking = (_id: string | undefined, data: any) => {
    createBookingMutation.mutate({
      ...data,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    });
  };

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ originalName, data }: { originalName: string, data: any }) => {
      return updateCustomer(originalName, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setCustomerDialogOpen(false);
      toast({
        title: "Customer Updated",
        description: "The customer's details have been updated across all their bookings.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update customer.",
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

  const handleDelete = (bookingId: string) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      updateBookingMutation.mutate({ id: bookingId, status: "archived" });
    }
  };

  const selectedVehicle = selectedBooking
    ? vehicles?.find((v) => v.id === selectedBooking.vehicleId)
    : null;

  const isLoading = vehiclesLoading || bookingsLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button onClick={() => setAddBookingModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Booking
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <StatsCard
          title="Monthly Revenue"
          value={`₱${(stats?.monthlyRevenue ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          description="From completed bookings"
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
            bookings={visibleBookings}
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

      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" /> Customer Profiles
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">ID Verification</th>
                  <th className="p-4 text-center">Total Bookings</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{customer.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      {customer.idImageUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setViewIdImage(customer.idImageUrl || null)}
                        >
                          <Eye className="h-3 w-3" /> View ID
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-normal">No ID</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">{customer.totalBookings}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted-foreground text-xs">
                          Last: {format(new Date(customer.lastBooking), "MMM d, yy")}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => { setEditingCustomer(customer); setCustomerDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        vehicle={selectedVehicle || null}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onApprove={handleApprove}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onEdit={() => {
          setDetailsModalOpen(false);
          setEditModalOpen(true);
        }}
        isLoading={updateBookingMutation.isPending}
      />

      <BookingEditDialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setDetailsModalOpen(true);
        }}
        booking={selectedBooking}
        vehicles={vehicles || []}
        onSubmit={handleEditBooking}
        isLoading={updateBookingMutation.isPending}
      />

      <BookingEditDialog
        open={addBookingModalOpen}
        onOpenChange={setAddBookingModalOpen}
        booking={null}
        vehicles={vehicles || []}
        onSubmit={handleCreateBooking}
        isLoading={createBookingMutation.isPending}
      />

      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      <CustomerEditDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={editingCustomer}
        onSubmit={(originalName, data) => updateCustomerMutation.mutate({ originalName, data })}
        isLoading={updateCustomerMutation.isPending}
      />

      <Dialog open={!!viewIdImage} onOpenChange={(open) => !open && setViewIdImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewIdImage || ""} alt="Customer ID" className="max-w-full max-h-[80vh] object-contain rounded-md" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
