import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: StatsCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="p-2 sm:p-3 rounded-md bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
