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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Car, MapPin, DollarSign, Users } from "lucide-react";

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
      const response = await fetch("/api/vehicles/user/1"); // Replace 1 with actual user ID
      const data = await response.json();
      if (Array.isArray(data)) {
        setVehicles(data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your vehicles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: TripFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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

  // Use a mock function to get current location
  const getCurrentLocation = () => {
    // In a real implementation, we would use the browser's geolocation API
    const mockLocation = {
      lat: 34.0522,
      lng: -118.2437,
      address: "123 Main St, Los Angeles, CA",
      city: "Los Angeles"
    };
    
    form.setValue("originLat", mockLocation.lat);
    form.setValue("originLng", mockLocation.lng);
    form.setValue("originAddress", mockLocation.address);
    form.setValue("originCity", mockLocation.city);
    
    toast({
      title: "Location Set",
      description: "Current location has been set as the origin",
    });
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