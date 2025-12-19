import type { Vehicle } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Settings2 } from "lucide-react";

interface CarCardProps {
  vehicle: Vehicle;
  onBookNow: (vehicle: Vehicle) => void;
}

export function CarCard({ vehicle, onBookNow }: CarCardProps) {
  const isAvailable = vehicle.status === "available";

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ${
        !isAvailable ? "opacity-60 grayscale" : "hover-elevate"
      }`}
      data-testid={`card-vehicle-${vehicle.id}`}
    >
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src={vehicle.imageUrl}
          alt={vehicle.model}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Badge variant="secondary" className="gap-1">
              <Settings2 className="h-3 w-3" />
              Under Maintenance
            </Badge>
          </div>
        )}
      </AspectRatio>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight" data-testid={`text-model-${vehicle.id}`}>
              {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 capitalize"
            data-testid={`badge-transmission-${vehicle.id}`}
          >
            {vehicle.transmission === "auto" ? "Automatic" : "Manual"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-2xl font-bold" data-testid={`text-price-${vehicle.id}`}>
              ₱{vehicle.dailyRate.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <Button
            onClick={() => onBookNow(vehicle)}
            disabled={!isAvailable}
            className="min-h-[48px] px-6"
            data-testid={`button-book-${vehicle.id}`}
          >
            Book Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
