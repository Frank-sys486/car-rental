import { format } from "date-fns";
import type { Booking, Vehicle } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, User, Calendar, Car, Check, X, AlertCircle, CheckCircle2, Pencil, Trash2 } from "lucide-react";

interface BookingDetailsModalProps {
  booking: Booking | null;
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  onDelete?: (bookingId: string) => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

export function BookingDetailsModal({
  booking,
  vehicle,
  open,
  onOpenChange,
  onApprove,
  onComplete,
  onCancel,
  onDelete,
  onEdit,
  isLoading,
}: BookingDetailsModalProps) {
  if (!booking || !vehicle) return null;

  const getStatusBadge = (status: string, idVerified: boolean) => {
    if (status === "pending" && !idVerified) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending - ID Missing
        </Badge>
      );
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Completed
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-8">
            <span>Booking Details</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status, booking.idVerified)}
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <img
              src={vehicle.imageUrl}
              alt={vehicle.model}
              className="w-16 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
            </div>
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: vehicle.colorHex }}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Guest Name</p>
                <p className="font-medium" data-testid="text-booking-guest">
                  {booking.guestName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{booking.guestPhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Rental Period</p>
                <p className="font-medium">
                  {format(new Date(booking.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(booking.endDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {booking.idVerified ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">ID Verification</p>
                <p className={`font-medium ${booking.idVerified ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {booking.idVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <span className="text-muted-foreground">Total Price</span>
            <span className="text-xl font-bold" data-testid="text-booking-total">
              ₱{booking.totalPrice.toLocaleString()}
            </span>
          </div>

          {booking.status === "pending" && (
            <div className="flex gap-2">
              <Button
                className="flex-1 min-h-[48px] gap-2"
                onClick={() => onApprove(booking.id)}
                disabled={isLoading}
                data-testid="button-approve-booking"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[48px] gap-2"
                onClick={() => onCancel(booking.id)}
                disabled={isLoading}
                data-testid="button-cancel-booking"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}

          {booking.status === "confirmed" && (
            <Button
              className="w-full min-h-[48px] gap-2"
              onClick={() => onComplete(booking.id)}
              disabled={isLoading}
              data-testid="button-complete-booking"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Completed
            </Button>
          )}

          {booking.status === "cancelled" && (
            <Button
              variant="destructive"
              className="w-full min-h-[48px] gap-2"
              onClick={() => onDelete?.(booking.id)}
              disabled={isLoading}
              data-testid="button-delete-booking"
            >
              <Trash2 className="h-4 w-4" />
              Delete Booking
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
