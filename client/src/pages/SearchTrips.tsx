import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Map, Search, MapPin, Clock, Tag, Car, Users } from "lucide-react";

const searchSchema = z.object({
  origin: z.object({
    city: z.string().min(2, "Origin city is required"),
    lat: z.number().min(-90).max(90, "Invalid latitude value"),
    lng: z.number().min(-180).max(180, "Invalid longitude value"),
  }),
  destination: z.object({
    city: z.string().min(2, "Destination city is required"),
    lat: z.number().min(-90).max(90, "Invalid latitude value"),
    lng: z.number().min(-180).max(180, "Invalid longitude value"),
  }),
  departureDate: z.string().refine(data => !isNaN(Date.parse(data)), {
    message: "Invalid date format",
  }),
  radiusMiles: z.number().min(0).max(50, "Search radius must be between 0 and 50 miles"),
});

type SearchFormValues = z.infer<typeof searchSchema>;

type Trip = {
  id: number;
  driverId: number;
  originCity: string;
  originAddress: string;
  destinationCity: string;
  destinationAddress: string;
  departureDate: string;
  price: string;
  availableSeats: number;
  driverName: string;
  vehicleMake: string;
  vehicleModel: string;
  distance: number;
};

const SearchTrips = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [bookingSeats, setBookingSeats] = useState<number>(1);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: {
        city: "",
        lat: 0,
        lng: 0
      },
      destination: {
        city: "",
        lat: 0,
        lng: 0
      },
      departureDate: new Date().toISOString().split('T')[0],
      radiusMiles: 5
    },
  });

  const handleBookTrip = async (tripId: number) => {
    if (!selectedTrip) return;
    
    setIsLoading(true);
    try {
      // Get current location for pickup
      const pickupLocation = {
        address: "Current Location",
        lat: form.getValues().origin.lat,
        lng: form.getValues().origin.lng
      };
      
      // Prepare booking data
      const bookingData = {
        tripId,
        pickupAddress: pickupLocation.address,
        pickupLat: pickupLocation.lat.toString(),
        pickupLng: pickupLocation.lng.toString(),
        dropoffAddress: selectedTrip.destinationAddress,
        dropoffLat: form.getValues().destination.lat.toString(),
        dropoffLng: form.getValues().destination.lng.toString(),
        seats: bookingSeats,
        price: (parseFloat(selectedTrip.price) * bookingSeats).toFixed(2)
      };
      
      // Send booking request to API
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to book trip");
      }
      
      toast({
        title: "Success",
        description: "Your trip has been booked successfully!",
      });
      
      // Redirect to bookings page
      setTimeout(() => {
        setLocation("/bookings");
      }, 1500);
      
    } catch (error) {
      console.error("Error booking trip:", error);
      toast({
        title: "Error",
        description: "Failed to book trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SearchFormValues) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Format the data for the API
      const searchParams = {
        origin: {
          lat: data.origin.lat,
          lng: data.origin.lng
        },
        destination: {
          lat: data.destination.lat,
          lng: data.destination.lng
        },
        departureDate: data.departureDate,
        radiusMiles: data.radiusMiles
      };
      
      // Call the API to search for trips
      const response = await fetch("/api/trips/search/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error("Failed to search for trips");
      }
      
      const tripsData = await response.json();
      
      // Map API response to our Trip type (adding mock driver and vehicle info)
      const formattedTrips: Trip[] = tripsData.map((trip: any) => ({
        ...trip,
        driverName: "Driver " + trip.driverId, // In a real app, we'd fetch driver name
        vehicleMake: "Toyota", // Mock data
        vehicleModel: "Camry", // Mock data
        distance: 5.2 // Mock distance calculation
      }));
      
      setTrips(formattedTrips);
      
    } catch (error) {
      console.error("Error searching for trips:", error);
      toast({
        title: "Error",
        description: "Failed to search for trips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location for origin
  const setCurrentLocationAsOrigin = () => {
    // In a real implementation, we would use the browser's geolocation API
    const mockLocation = {
      lat: 34.0522,
      lng: -118.2437,
      city: "Los Angeles"
    };
    
    form.setValue("origin.lat", mockLocation.lat);
    form.setValue("origin.lng", mockLocation.lng);
    form.setValue("origin.city", mockLocation.city);
    
    toast({
      title: "Location Set",
      description: "Current location has been set as the origin",
    });
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-lg mx-auto">
        {!showBookingForm ? (
          <>
            {/* Search Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                  <Search className="mr-2 h-5 w-5" /> Find Available Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className="mr-2 h-5 w-5" /> Origin
                      </h3>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={setCurrentLocationAsOrigin}
                        >
                          Use current location
                        </Button>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="origin.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origin City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="origin.lat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.0000001" {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="origin.lng"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longitude</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.0000001" {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className="mr-2 h-5 w-5" /> Destination
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="destination.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="destination.lat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.0000001" {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="destination.lng"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longitude</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.0000001" {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5" /> Trip Details
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="radiusMiles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Search Radius (miles)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={50} {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Searching..." : "Search Trips"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Search Results */}
            {hasSearched && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">
                  {trips.length > 0 ? `Found ${trips.length} Trips` : "No Trips Found"}
                </h2>
                
                {trips.length === 0 && hasSearched && !isLoading && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <Map className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-center text-muted-foreground">
                        No trips matched your search criteria. Try expanding your search radius or changing your dates.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {trips.map((trip) => (
                  <Card key={trip.id} className={`relative ${selectedTrip?.id === trip.id ? 'border-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold flex items-center">
                            <MapPin className="h-4 w-4 mr-1 inline" />
                            {trip.originCity} to {trip.destinationCity}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {trip.originAddress.substring(0, 20)}... → {trip.destinationAddress.substring(0, 20)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${trip.price}/seat</p>
                          <p className="text-sm">{trip.availableSeats} seats available</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {new Date(trip.departureDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          <span className="text-sm">{trip.distance.toFixed(1)} miles away</span>
                        </div>
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-1" />
                          <span className="text-sm">{trip.vehicleMake} {trip.vehicleModel}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm">{trip.driverName}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 py-3 bg-muted/50 flex justify-end">
                      <Button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowBookingForm(true);
                        }}
                      >
                        Book this trip
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Booking Form */
          selectedTrip && (
            <Card>
              <CardHeader>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 left-2"
                  onClick={() => setShowBookingForm(false)}
                >
                  ← Back
                </Button>
                <CardTitle className="text-xl font-bold text-center mt-4">Book Your Trip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-bold flex items-center">
                      <MapPin className="h-4 w-4 mr-1 inline" />
                      {selectedTrip.originCity} to {selectedTrip.destinationCity}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTrip.originAddress} → {selectedTrip.destinationAddress}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {new Date(selectedTrip.departureDate).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-1" />
                        <span className="text-sm">{selectedTrip.vehicleMake} {selectedTrip.vehicleModel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <FormLabel>Number of Seats</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBookingSeats(Math.max(1, bookingSeats - 1))}
                        disabled={bookingSeats <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{bookingSeats}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBookingSeats(Math.min(selectedTrip.availableSeats, bookingSeats + 1))}
                        disabled={bookingSeats >= selectedTrip.availableSeats}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedTrip.availableSeats} seats available on this trip
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Pickup Location</h3>
                    <p className="text-sm mt-1">{form.getValues().origin.city}</p>
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {form.getValues().origin.lat.toFixed(4)}, {form.getValues().origin.lng.toFixed(4)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Dropoff Location</h3>
                    <p className="text-sm mt-1">{selectedTrip.destinationCity}</p>
                    <p className="text-sm text-muted-foreground">{selectedTrip.destinationAddress}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span>${(parseFloat(selectedTrip.price) * bookingSeats).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    ${selectedTrip.price} per seat × {bookingSeats} {bookingSeats === 1 ? 'seat' : 'seats'}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleBookTrip(selectedTrip.id)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Confirm Booking"}
                </Button>
              </CardFooter>
            </Card>
          )
        )}
      </div>
    </AppLayout>
  );
};

export default SearchTrips;