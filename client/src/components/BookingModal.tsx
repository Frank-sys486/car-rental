import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays, addDays, parseISO, isSameDay } from "date-fns";
import type { Vehicle } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Upload, AlertCircle, Check } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { getCustomers, getBookingsByVehicleId, type Customer, type Booking } from "@/lib/data";

const bookingFormSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestPhone: z.string().min(10, "Please enter a valid phone number"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookingFormValues & { idVerified: boolean; idImageUrl?: string }) => void;
  isLoading?: boolean;
  defaultDates?: {
    start?: Date;
    end?: Date;
  };
}

export function BookingModal({
  vehicle,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultDates,
}: BookingModalProps) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isAdmin } = useRole();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      startDate: defaultDates?.start || new Date(),
      endDate: defaultDates?.end || addDays(new Date(), 1),
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: getCustomers,
    enabled: isAdmin && open,
  });

  const { data: vehicleBookings } = useQuery<Booking[]>({
    queryKey: ["bookings", vehicle?.id],
    queryFn: () => getBookingsByVehicleId(vehicle!.id),
    enabled: !!vehicle && open,
  });

  useEffect(() => {
    if (open && defaultDates) {
      if (defaultDates.start) form.setValue("startDate", defaultDates.start);
      if (defaultDates.end) form.setValue("endDate", defaultDates.end);
    }
  }, [open, defaultDates, form]);

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  const numberOfDays =
    watchStartDate && watchEndDate
      ? Math.max(1, differenceInDays(watchEndDate, watchStartDate))
      : 1;

  const totalPrice = vehicle ? vehicle.dailyRate * numberOfDays : 0;

  const bookedDays = useMemo(() => {
    if (!vehicleBookings) return [];
    const dates: Date[] = [];
    vehicleBookings.forEach(booking => {
        // Don't count cancelled or archived bookings as unavailable
        if (booking.status === 'cancelled' || booking.status === 'archived') return;

        let currentDate = parseISO(booking.startDate);
        const endDate = parseISO(booking.endDate);

        while (currentDate <= endDate) {
            // Always add every day within the booking range to the list
            dates.push(new Date(currentDate));
            currentDate = addDays(currentDate, 1);
        }
    });
    return dates;
  }, [vehicleBookings, watchStartDate, watchEndDate]);

  const handleSubmit = (data: BookingFormValues) => {
    onSubmit({
      ...data,
      idVerified: !!idFile || !!idPreview,
      idImageUrl: idPreview || undefined,
    });
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkipId = () => {
    setIdFile(null);
    setIdPreview(null);
  };

  const handleSelectCustomer = (customer: Customer) => {
    form.setValue("guestName", customer.name);
    form.setValue("guestPhone", customer.phone);
    if (customer.idImageUrl) {
      setIdPreview(customer.idImageUrl);
      setIdFile(null); // Clear file if using saved image
    }
    setShowSuggestions(false);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Book {vehicle.model}</DialogTitle>
          <DialogDescription>
            Complete the form below to reserve this vehicle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
          <img
            src={vehicle.imageUrl}
            alt={vehicle.model}
            className="w-20 h-14 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{vehicle.model}</p>
            <p className="text-sm text-muted-foreground">
              ₱{vehicle.dailyRate.toLocaleString()}/{vehicle.rateType || "day"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl className="relative">
                    <div>
                      <Input
                        placeholder="Juan dela Cruz"
                        {...field}
                        data-testid="input-guest-name"
                        onFocus={() => isAdmin && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => {
                          field.onChange(e);
                          if (isAdmin) setShowSuggestions(true);
                        }}
                      />
                      {showSuggestions && customers && customers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                          {customers
                            .filter(c => c.name.toLowerCase().includes(field.value.toLowerCase()))
                            .map((customer, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                {customer.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+63 912 345 6789"
                      {...field}
                      data-testid="input-guest-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal min-h-[48px]"
                            data-testid="button-start-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "MMM d, yyyy") : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          modifiers={{ booked: bookedDays }}
                          modifiersStyles={{
                            booked: {
                              color: "hsl(var(--destructive-foreground))",
                              backgroundColor: "hsl(var(--destructive))",
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal min-h-[48px]"
                            data-testid="button-end-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "MMM d, yyyy") : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date <= watchStartDate}
                          initialFocus
                          modifiers={{ booked: bookedDays }}
                          modifiersStyles={{
                            booked: {
                              color: "hsl(var(--destructive-foreground))",
                              backgroundColor: "hsl(var(--destructive))",
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>ID Verification</FormLabel>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {idFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{idFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIdFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : idPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={idPreview} alt="ID Preview" className="h-24 object-contain rounded-md border" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIdPreview(null)}
                      className="text-xs h-7"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Upload a valid ID for faster approval
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdUpload}
                          className="hidden"
                          data-testid="input-id-upload"
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSkipId}
                        data-testid="button-skip-id"
                      >
                        Skip for now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {!idFile && !idPreview && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Booking will be marked as "Pending - ID Missing"
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">
                  {numberOfDays} day{numberOfDays > 1 ? "s" : ""}
                </p>
                <p className="text-2xl font-bold" data-testid="text-total-price">
                  ₱{totalPrice.toLocaleString()}
                </p>
              </div>
              <Badge variant={idFile || idPreview ? "default" : "secondary"}>
                {idFile || idPreview ? "ID Verified" : "Pending ID"}
              </Badge>
            </div>

            <Button
              type="submit"
              className="w-full min-h-[48px] text-base"
              disabled={isLoading}
              data-testid="button-confirm-booking"
            >
              {isLoading ? "Processing..." : "Confirm Booking"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
