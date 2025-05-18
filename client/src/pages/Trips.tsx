import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, Car, Clock, Plus } from "lucide-react";

type Trip = {
  id: number;
  originCity: string;
  originAddress: string;
  destinationCity: string;
  destinationAddress: string;
  departureDate: string;
  price: string;
  availableSeats: number;
  status: string;
};

type Booking = {
  id: number;
  tripId: number;
  pickupAddress: string;
  dropoffAddress: string;
  seats: number;
  price: string;
  status: string;
  createdAt: string;
  trip?: Trip;
};

const Trips = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState({
    trips: false,
    bookings: false,
    action: false,
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    
    fetchData();
  }, [setLocation]);

  const fetchData = async () => {
    fetchTrips();
    fetchBookings();
  };

  const fetchTrips = async () => {
    setLoading(prev => ({ ...prev, trips: true }));
    try {
      const response = await fetch("/api/trips");
      if (!response.ok) throw new Error("Failed to fetch trips");
      
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast({
        title: "Error",
        description: "Failed to load your trips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, trips: false }));
    }
  };

  const fetchBookings = async () => {
    setLoading(prev => ({ ...prev, bookings: true }));
    try {
      const response = await fetch("/api/bookings/rider");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      
      const data = await response.json();
      
      // In a real implementation, we'd fetch trip details for each booking
      // Here, we'll mock that data for demo purposes
      const bookingsWithTrips = await Promise.all(
        data.map(async (booking: Booking) => {
          try {
            const tripResponse = await fetch(`/api/trips/${booking.tripId}`);
            if (tripResponse.ok) {
              const tripData = await tripResponse.json();
              return { ...booking, trip: tripData };
            }
            return booking;
          } catch {
            return booking;
          }
        })
      );
      
      setBookings(bookingsWithTrips);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const updateTripStatus = async (tripId: number, status: string) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await fetch(`/api/trips/${tripId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error("Failed to update trip");
      
      // Update local state
      setTrips(trips.map(trip => 
        trip.id === tripId ? { ...trip, status } : trip
      ));
      
      toast({
        title: "Success",
        description: `Trip ${status === "completed" ? "marked as completed" : "cancelled"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating trip:", error);
      toast({
        title: "Error",
        description: "Failed to update trip status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error("Failed to update booking");
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
      
      toast({
        title: "Success",
        description: `Booking ${status === "cancelled" ? "cancelled" : "updated"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AppLayout>
      <div className="container px-4 py-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">My Trips</h1>
          <Button 
            onClick={() => setLocation("/create-trip")} 
            size="sm"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> Create Trip
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-trips">My Trips</TabsTrigger>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-trips">
            {loading.trips ? (
              <p className="text-center py-8">Loading trips...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't created any trips yet.</p>
                <Button onClick={() => setLocation("/create-trip")}>
                  Create Your First Trip
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {trips.map((trip) => (
                  <Card key={trip.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{trip.originCity} to {trip.destinationCity}</h3>
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <div>
                            <div>From: {trip.originAddress}</div>
                            <div>To: {trip.destinationAddress}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>Departure: {formatDate(trip.departureDate)}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <div>Available Seats: {trip.availableSeats}</div>
                        </div>
                        
                        <div className="font-semibold">
                          Price per seat: ${trip.price}
                        </div>
                      </div>
                    </CardContent>
                    {trip.status === "active" && (
                      <CardFooter className="bg-muted/30 p-3 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateTripStatus(trip.id, "completed")}
                          disabled={loading.action}
                        >
                          Mark Completed
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateTripStatus(trip.id, "cancelled")}
                          disabled={loading.action}
                        >
                          Cancel Trip
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-bookings">
            {loading.bookings ? (
              <p className="text-center py-8">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't booked any trips yet.</p>
                <Button onClick={() => setLocation("/search-trips")}>
                  Search for Trips
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">
                          {booking.trip ? `${booking.trip.originCity} to ${booking.trip.destinationCity}` : "Trip Details"}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <div>
                            <div>Pickup: {booking.pickupAddress}</div>
                            <div>Dropoff: {booking.dropoffAddress}</div>
                          </div>
                        </div>
                        
                        {booking.trip && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <div>Departure: {formatDate(booking.trip.departureDate)}</div>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <div>Seats: {booking.seats}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <div>Booked on: {new Date(booking.createdAt).toLocaleDateString()}</div>
                        </div>
                        
                        <div className="font-semibold">
                          Total: ${booking.price}
                        </div>
                      </div>
                    </CardContent>
                    {(booking.status === "pending" || booking.status === "approved") && (
                      <CardFooter className="bg-muted/30 p-3">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="w-full"
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          disabled={loading.action}
                        >
                          Cancel Booking
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Trips;