import { useLocation } from "wouter";
import { Car, Moon, Sun, LayoutDashboard, Home, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const { isAdmin } = useRole();
  const { toggleTheme, isDark } = useTheme();
  const [location, setLocation] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1"
            data-testid="link-home"
          >
            <Car className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight hidden sm:inline">DriveEase</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={location === "/" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setLocation("/")}
              data-testid="nav-home"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant={location === "/fleet" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setLocation("/fleet")}
              data-testid="nav-fleet"
            >
              <CarFront className="h-4 w-4" />
              Fleet
            </Button>
  
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-1 pb-3 -mt-1">
          <Button
            variant={location === "/" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 flex-1"
            onClick={() => setLocation("/")}
            data-testid="nav-home-mobile"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button
            variant={location === "/fleet" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 flex-1"
            onClick={() => setLocation("/fleet")}
            data-testid="nav-fleet-mobile"
          >
            <CarFront className="h-4 w-4" />
            Fleet
          </Button>
          {isAdmin && (
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 flex-1"
              onClick={() => setLocation("/dashboard")}
              data-testid="nav-dashboard-mobile"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
