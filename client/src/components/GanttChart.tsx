import { useMemo, useRef } from "react";
import { format, addDays, differenceInDays, isWithinInterval, parseISO } from "date-fns";
import type { Booking, Vehicle } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GanttChartProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  days?: number;
}

export function GanttChart({
  vehicles,
  bookings,
  onBookingClick,
  days = 30,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  const dateColumns = useMemo(() => {
    return Array.from({ length: days }, (_, i) => addDays(today, i));
  }, [today, days]);

  const getBookingsForVehicle = (vehicleId: string) => {
    return bookings.filter((b) => b.vehicleId === vehicleId);
  };

  const getBookingPosition = (booking: Booking) => {
    const startDate = parseISO(booking.startDate);
    const endDate = parseISO(booking.endDate);

    const startOffset = Math.max(0, differenceInDays(startDate, today));
    const duration = differenceInDays(endDate, startDate) + 1;

    if (startOffset >= days) return null;

    const clippedDuration = Math.min(duration, days - startOffset);

    return {
      left: startOffset,
      width: clippedDuration,
    };
  };

  const cellWidth = 48;
  const rowHeight = 56;
  const headerHeight = 48;
  const vehicleLabelWidth = 160;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="flex">
        <div
          className="shrink-0 bg-muted/30 border-r z-10"
          style={{ width: vehicleLabelWidth }}
        >
          <div
            className="flex items-center px-4 border-b font-medium text-sm text-muted-foreground"
            style={{ height: headerHeight }}
          >
            Vehicles
          </div>
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center gap-2 px-4 border-b"
              style={{ height: rowHeight }}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: vehicle.colorHex }}
              />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{vehicle.model}</p>
                <p className="text-xs text-muted-foreground truncate">{vehicle.plate}</p>
              </div>
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div style={{ minWidth: days * cellWidth }}>
            <div
              className="flex border-b sticky top-0 bg-muted/50 z-10"
              style={{ height: headerHeight }}
            >
              {dateColumns.map((date, i) => {
                const isToday = differenceInDays(date, today) === 0;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={i}
                    className={`shrink-0 flex flex-col items-center justify-center text-xs border-r ${
                      isToday ? "bg-primary/10" : isWeekend ? "bg-muted/50" : ""
                    }`}
                    style={{ width: cellWidth }}
                  >
                    <span className="text-muted-foreground">{format(date, "EEE")}</span>
                    <span className={`font-medium ${isToday ? "text-primary" : ""}`}>
                      {format(date, "d")}
                    </span>
                  </div>
                );
              })}
            </div>

            {vehicles.map((vehicle) => {
              const vehicleBookings = getBookingsForVehicle(vehicle.id);

              return (
                <div
                  key={vehicle.id}
                  className="relative flex border-b"
                  style={{ height: rowHeight }}
                >
                  {dateColumns.map((date, i) => {
                    const isToday = differenceInDays(date, today) === 0;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <div
                        key={i}
                        className={`shrink-0 border-r ${
                          isToday ? "bg-primary/5" : isWeekend ? "bg-muted/20" : ""
                        }`}
                        style={{ width: cellWidth }}
                      />
                    );
                  })}

                  {vehicleBookings.map((booking) => {
                    const position = getBookingPosition(booking);
                    if (!position) return null;

                    const showText = position.width >= 2;

                    return (
                      <button
                        key={booking.id}
                        onClick={() => onBookingClick(booking)}
                        className="absolute top-2 bottom-2 rounded-md px-2 flex items-center overflow-hidden cursor-pointer transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
                        style={{
                          left: position.left * cellWidth + 4,
                          width: position.width * cellWidth - 8,
                          backgroundColor: vehicle.colorHex,
                        }}
                        data-testid={`gantt-booking-${booking.id}`}
                      >
                        {showText && (
                          <span className="text-white text-xs font-medium truncate drop-shadow-sm">
                            {booking.guestName}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
