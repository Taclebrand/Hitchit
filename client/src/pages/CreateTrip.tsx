import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Car, MapPin, DollarSign, Users } from "lucide-react";
import { fallbackLocationService } from "@/services/FallbackLocationService";

const createTripSchema = z.object({
  vehicleId: z.coerce.number().positive("Vehicle ID is required"),
  originCity: z.string().min(2, "Origin city must be at least 2 characters"),
  originAddress: z.string().min(5, "Origin address must be at least 5 characters"),
  originLat: z.coerce.number().min(-90).max(90, "Invalid latitude value"),
  originLng: z.coerce.number().min(-180).max(180, "Invalid longitude value"),
  destinationCity: z.string().min(2, "Destination city must be at least 2 characters"),
  destinationAddress: z.string().min(5, "Destination address must be at least 5 characters"),
  destinationLat: z.coerce.number().min(-90).max(90, "Invalid latitude value"),
  destinationLng: z.coerce.number().min(-180).max(180, "Invalid longitude value"),
  departureDate: z.string().refine(data => !isNaN(Date.parse(data)), {
    message: "Invalid date format",
  }),
  price: z.string().min(1, "Price is required"),
  availableSeats: z.coerce.number().min(1, "At least 1 seat is required"),
});

type TripFormValues = z.infer<typeof createTripSchema>;

const CreateTrip = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<{ id: number, make: string, model: string }[]>([
    { id: 1, make: "Toyota", model: "Camry" },
    { id: 2, make: "Honda", model: "Accord" },
  ]);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      vehicleId: 0,
      originCity: "",
      originAddress: "",
      originLat: 0,
      originLng: 0,
      destinationCity: "",
      destinationAddress: "",
      destinationLat: 0,
      destinationLng: 0,
      departureDate: "",
      price: "",
      availableSeats: 1,
    },
  });

  // This would fetch the user's vehicles from the API in a real implementation
  const fetchVehicles = async () => {
    try {
      // Try fetching from API
      try {
        const response = await fetch("/api/vehicles/user/1"); // Replace 1 with actual user ID
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setVehicles(data);
            return;
          }
        }
      } catch (apiError) {
        console.warn("Failed to fetch vehicles from API:", apiError);
      }
      
      // If API fails, use demo vehicles
      setVehicles([
        { id: 1, make: "Toyota", model: "Camry" },
        { id: 2, make: "Honda", model: "Accord" },
        { id: 3, make: "Tesla", model: "Model 3" },
        { id: 4, make: "Ford", model: "Mustang" }
      ]);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your vehicles. Using demo vehicles instead.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    // Fetch user's vehicles when component mounts
    fetchVehicles();
    
    // Pre-fill destination with a default location for demo purposes
    form.setValue("destinationCity", "Santa Monica");
    form.setValue("destinationAddress", "Santa Monica Pier, Santa Monica, CA, USA");
    form.setValue("destinationLat", 34.0085);
    form.setValue("destinationLng", -118.4985);
  }, []);

  const onSubmit = async (data: TripFormValues) => {
    setIsLoading(true);
    try {
      console.log("Submitting trip data:", data);
      
      // Add dummy authentication - in a real app you'd use proper auth
      const enhancedData = {
        ...data,
        driverId: 1, // Adding a driver ID for the demo
      };
      
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer demo-token" // Demo auth token
        },
        body: JSON.stringify(enhancedData),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      toast({
        title: "Success",
        description: "Your trip has been created successfully!",
      });

      // Redirect to trips list
      setTimeout(() => {
        setLocation("/trips");
      }, 1500);
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get real-time current location using the browser's geolocation API
  const getCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      // Try to get real location first
      if (navigator.geolocation) {
        try {
          // This will actually get your real coordinates
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          
          const { latitude, longitude } = position.coords;
          console.log("Using real coordinates:", latitude, longitude);
          
          // These are your actual coordinates - for demo we use Los Angeles
          // as the city name, but we're using your real lat/lng values
          const city = "Los Angeles";
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}, ${city}, CA`;
          
          toast({
            title: "Real Location Set",
            description: "Your actual current location will be used",
          });
          
          // Important: set the form values with the exact coordinates
          form.setValue("originLat", latitude);
          form.setValue("originLng", longitude);
          form.setValue("originAddress", address);
          form.setValue("originCity", city);
          
          return;
        } catch (error) {
          console.warn("Geolocation error:", error);
          // Continue to fallback
        }
      }
      
      // Use fallback location if geolocation failed
      const location = await fallbackLocationService.getAddressDetails('demo-place-id-1');
      const city = location.address.split(',')[0].trim();
      
      form.setValue("originLat", location.coordinates.lat);
      form.setValue("originLng", location.coordinates.lng);
      form.setValue("originAddress", location.address);
      form.setValue("originCity", city);
      
      toast({
        title: "Demo Location Set",
        description: "A demo location has been set as the origin",
      });
      
    } catch (error) {
      console.error("Error setting location:", error);
      toast({
        title: "Error",
        description: "Failed to set your location. Please enter it manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Create a New Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Car className="mr-2 h-5 w-5" /> Vehicle Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Vehicle</FormLabel>
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input px-3 py-2 bg-background"
                            {...field}
                          >
                            <option value="0" disabled>Select a vehicle</option>
                            {vehicles.map(vehicle => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.make} {vehicle.model}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <MapPin className="mr-2 h-5 w-5" /> Trip Origin
                  </h3>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={getCurrentLocation}
                    >
                      Use current location
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="originCity"
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

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="originAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origin Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="originLat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0000001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="originLng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0000001" {...field} />
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
                    <MapPin className="mr-2 h-5 w-5" /> Trip Destination
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="destinationCity"
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

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="destinationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="destinationLat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0000001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="destinationLng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0000001" {...field} />
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
                        <FormLabel>Departure Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Seat ($)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-8" placeholder="25.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availableSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Seats</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                className="pl-8" 
                                type="number" 
                                min={1}
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreateTrip;