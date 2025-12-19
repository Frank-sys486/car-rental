import type { Vehicle } from "@shared/schema";
import { useSearch } from "wouter";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface CarCardProps {
  vehicle: Vehicle;
  onBookNow: (vehicle: Vehicle) => void;
  isAdmin?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

export function CarCard({ vehicle, onBookNow, isAdmin, onEdit, onDelete }: CarCardProps) {
  const search = useSearch();
  const hasDateSearch = new URLSearchParams(search).has("start");

  const isAvailable = vehicle.status === "available";
  const isBookedInSearchRange = hasDateSearch && vehicle.status === "booked";

  let button;
  if (isAvailable) {
    button = (
      <Button onClick={() => onBookNow(vehicle)} data-testid={`book-now-${vehicle.id}`}>
        Book Now
      </Button>
    );
  } else if (isBookedInSearchRange && vehicle.nextAvailableDate) {
    button = (
      <Button variant="secondary" onClick={() => onBookNow(vehicle)} data-testid={`request-booking-${vehicle.id}`}>
        Request from {format(parseISO(vehicle.nextAvailableDate), "MMM d")}
      </Button>
    );
  } else {
    button = (
      <Button disabled variant="outline">
        Unavailable
      </Button>
    );
  }

  const cardClasses = !isAvailable && !isBookedInSearchRange ? "opacity-60" : "";

  return (
    <Card className={`overflow-hidden transition-opacity ${cardClasses}`}>
      <div className="relative">
        <img src={vehicle.imageUrl} alt={vehicle.model} className="aspect-video w-full object-cover" />
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onEdit?.(vehicle)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDelete?.(vehicle)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{vehicle.model}</h3>
          <Badge variant={vehicle.transmission === "auto" ? "default" : "secondary"}>{vehicle.transmission}</Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p><span className="font-bold text-lg">₱{vehicle.dailyRate.toLocaleString()}</span><span className="text-sm text-muted-foreground">/{vehicle.rateType || "day"}</span></p>
        {button}
      </CardFooter>
    </Card>
  );
}