import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Clock, Users, DollarSign, Car, Eye, Calendar } from 'lucide-react';

interface SharedTripData {
  trip: {
    id: number;
    origin: string;
    destination: string;
    departureTime: string;
    availableSeats: number;
    pricePerSeat: number;
    status: string;
    estimatedDuration: string;
    vehicle?: {
      make: string;
      model: string;
      year: number;
      color: string;
    };
  };
  sharedBy: {
    id: number;
    fullName: string;
    avatar?: string;
  } | null;
  shareInfo: {
    viewCount: number;
    createdAt: string;
  };
}

const SharedTrip: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [tripData, setTripData] = useState<SharedTripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (shareCode) {
      loadSharedTrip();
    }
  }, [shareCode]);

  const loadSharedTrip = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const responseRaw = await apiRequest('GET', `/api/shared-trip/${shareCode}`);
      const response = await responseRaw.json();
      
      setTripData(response);
      
    } catch (error: any) {
      console.error('Load shared trip error:', error);
      if (error.message.includes('404')) {
        setError('This shared trip was not found or has expired.');
      } else {
        setError('Unable to load trip details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookTrip = () => {
    if (!tripData) return;
    
    // Redirect to the main booking flow with the trip ID
    window.location.href = `/trips?book=${tripData.trip.id}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shared Ride</h1>
          <p className="text-gray-600">Someone shared this trip with you</p>
        </div>

        {/* Trip Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Trip Details</span>
              <Badge variant={tripData.trip.status === 'active' ? 'default' : 'secondary'}>
                {tripData.trip.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="font-medium">{tripData.trip.origin}</span>
                </div>
                <div className="ml-5 border-l-2 border-gray-200 h-6" />
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium">{tripData.trip.destination}</span>
                </div>
              </div>
            </div>

            {/* Trip Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Departure</p>
                  <p className="font-medium">{formatDate(tripData.trip.departureTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{tripData.trip.estimatedDuration}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Available Seats</p>
                  <p className="font-medium">{tripData.trip.availableSeats}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Price per Seat</p>
                  <p className="font-medium">${tripData.trip.pricePerSeat}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            {tripData.trip.vehicle && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Car className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">
                    {tripData.trip.vehicle.color} {tripData.trip.vehicle.year} {tripData.trip.vehicle.make} {tripData.trip.vehicle.model}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared By Card */}
        {tripData.sharedBy && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={tripData.sharedBy.avatar} />
                    <AvatarFallback>
                      {getInitials(tripData.sharedBy.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Shared by {tripData.sharedBy.fullName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tripData.shareInfo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{tripData.shareInfo.viewCount} views</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {tripData.trip.status === 'active' && tripData.trip.availableSeats > 0 ? (
            <>
              <Button onClick={handleBookTrip} className="w-full" size="lg">
                Book This Trip
              </Button>
              <p className="text-center text-sm text-gray-500">
                You'll be redirected to complete your booking
              </p>
            </>
          ) : (
            <div className="text-center">
              <Button disabled className="w-full" size="lg">
                {tripData.trip.availableSeats === 0 ? 'Trip Fully Booked' : 'Trip Not Available'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                This trip is no longer accepting bookings
              </p>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Browse Other Trips
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedTrip;