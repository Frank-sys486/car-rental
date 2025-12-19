import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays, addDays } from "date-fns";
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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      startDate: defaultDates?.start || new Date(),
      endDate: defaultDates?.end || addDays(new Date(), 1),
    },
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

  const handleSubmit = (data: BookingFormValues) => {
    onSubmit({
      ...data,
      idVerified: !!idFile,
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
                  <FormControl>
                    <Input
                      placeholder="Juan dela Cruz"
                      {...field}
                      data-testid="input-guest-name"
                    />
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
                    <Check className="h-4 w-4 text-green-500" />
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
              {!idFile && (
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
              <Badge variant={idFile ? "default" : "secondary"}>
                {idFile ? "ID Verified" : "Pending ID"}
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
