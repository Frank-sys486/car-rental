import { useState } from "react";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, CarFront, Sparkles, Shield, Clock } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1));

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("end", format(endDate, "yyyy-MM-dd"));
    setLocation(`/fleet?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Drive Your Dreams
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Premium car rentals for every journey. Quality vehicles, flexible terms, exceptional service.
            </p>
          </div>

          <Card className="max-w-lg mx-auto p-0 overflow-hidden shadow-2xl">
            <Tabs defaultValue="availability" className="w-full">
              <TabsList className="w-full rounded-none h-14 p-0 bg-muted/50">
                <TabsTrigger
                  value="availability"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-background gap-2"
                  data-testid="tab-availability"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Check</span> Availability
                </TabsTrigger>
                <TabsTrigger
                  value="browse"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-background gap-2"
                  data-testid="tab-browse"
                >
                  <CarFront className="h-4 w-4" />
                  Browse Cars
                </TabsTrigger>
              </TabsList>

              <TabsContent value="availability" className="p-6 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pick-up Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal min-h-[48px]"
                          data-testid="button-pickup-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Return Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal min-h-[48px]"
                          data-testid="button-return-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => !startDate ? false : date <= startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full min-h-[48px] text-base gap-2"
                  data-testid="button-search-cars"
                >
                  <Search className="h-4 w-4" />
                  Search Available Cars
                </Button>
              </TabsContent>

              <TabsContent value="browse" className="p-6 mt-0">
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                    <CarFront className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Explore Our Fleet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Browse all available vehicles and find your perfect ride
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/fleet")}
                    className="w-full min-h-[48px] text-base"
                    data-testid="button-view-fleet"
                  >
                    View All Vehicles
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Why Choose DriveEase?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We make car rental simple, transparent, and hassle-free
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Quality Vehicles</h3>
              <p className="text-sm text-muted-foreground">
                Well-maintained fleet with regular inspections and cleaning
              </p>
            </Card>

            <Card className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Secure Booking</h3>
              <p className="text-sm text-muted-foreground">
                Simple ID verification and transparent pricing
              </p>
            </Card>

            <Card className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Flexible Terms</h3>
              <p className="text-sm text-muted-foreground">
                Daily, weekly, or monthly rentals to suit your needs
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
