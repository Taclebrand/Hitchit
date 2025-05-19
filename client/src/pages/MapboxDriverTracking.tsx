import { useParams, useLocation } from "wouter";
import { MapboxDriverTracking } from "@/components/MapboxDriverTracking";
import { useState, useEffect } from "react";
import { Coordinates } from "@/services/GoogleMapsService";
import { LoaderIcon } from "lucide-react";

export default function MapboxDriverTrackingPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const rideId = params.id || "RIDE-123456";
  
  const [isLoading, setIsLoading] = useState(true);
  const [tripInfo, setTripInfo] = useState<{
    originAddress: string;
    originCoordinates: Coordinates;
    destinationAddress: string;
    destinationCoordinates: Coordinates;
    driverName: string;
    driverPhone: string;
    vehicleInfo: string;
    estimatedDuration: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    // Simulate fetching ride details from the API
    const fetchRideDetails = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, you would fetch this from your API
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setTripInfo({
          originAddress: "123 Main Street, Los Angeles, CA",
          originCoordinates: { lat: 34.052235, lng: -118.243683 },
          destinationAddress: "456 Market Street, Los Angeles, CA",
          destinationCoordinates: { lat: 34.043208, lng: -118.267126 },
          driverName: "Michael Chen",
          driverPhone: "+1 (555) 123-4567",
          vehicleInfo: "Toyota Camry • ABC-1234 • Silver",
          estimatedDuration: "15 min",
          price: 24.50
        });
      } catch (error) {
        console.error("Error fetching ride details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  const handleClose = () => {
    setLocation("/home");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold">Loading ride details...</h2>
          <p className="text-slate-500 mt-2">Connecting to your driver</p>
        </div>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-xs mx-auto">
          <div className="bg-red-100 text-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Ride not found</h2>
          <p className="text-slate-500 mt-2">We couldn't find the ride you're looking for. It may have been completed or canceled.</p>
          <button 
            className="mt-6 px-4 py-2 bg-primary text-white rounded-lg shadow-sm"
            onClick={handleClose}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <MapboxDriverTracking
      rideId={rideId}
      tripInfo={tripInfo}
      onClose={handleClose}
    />
  );
}