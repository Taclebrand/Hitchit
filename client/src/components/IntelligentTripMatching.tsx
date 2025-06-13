import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  DollarSign, 
  Leaf, 
  Star,
  Navigation,
  TrendingUp,
  Target,
  Route
} from "lucide-react";

interface TripMatchResult {
  tripId: number;
  matchScore: number;
  reasons: string[];
  estimatedDetour: number;
  carbonSavings: number;
  costEfficiency: number;
}

interface RouteOptimization {
  optimizedRoute: Array<{
    lat: number;
    lng: number;
    address: string;
    stopType: 'pickup' | 'dropoff' | 'waypoint';
    estimatedTime: string;
  }>;
  totalDistance: number;
  totalTime: number;
  fuelSaved: number;
  carbonReduction: number;
  recommendations: string[];
}

interface DemandAnalysis {
  demandScore: number;
  peakTimes: string[];
  suggestedPricing: number;
  competitorAnalysis: {
    averagePrice: number;
    availability: string;
  };
  recommendations: string[];
}

export default function IntelligentTripMatching() {
  const [riderRequest, setRiderRequest] = useState({
    pickup: { lat: 0, lng: 0, address: "" },
    dropoff: { lat: 0, lng: 0, address: "" },
    departureTime: "",
    passengers: 1,
    preferences: {
      maxDetour: 15,
      preferredVehicleType: "",
      smokingAllowed: false,
      petsAllowed: false,
      musicPreference: ""
    }
  });

  const [matchResults, setMatchResults] = useState<TripMatchResult[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [demandAnalysis, setDemandAnalysis] = useState<DemandAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const { toast } = useToast();

  const findOptimalTrips = async () => {
    if (!riderRequest.pickup.address || !riderRequest.dropoff.address) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and dropoff locations",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setMatchResults([]);

    try {
      const response = await apiRequest('POST', '/api/ai/find-optimal-trips', {
        riderRequest: {
          ...riderRequest,
          departureTime: riderRequest.departureTime ? new Date(riderRequest.departureTime) : new Date()
        }
      });

      setMatchResults(response.matches || []);

      toast({
        title: "Trip Analysis Complete",
        description: `Found ${response.matches?.length || 0} optimal trip matches`,
      });

    } catch (error) {
      console.error('Trip matching error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to find trip matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeRouteOptimization = async (tripId: number) => {
    setIsAnalyzing(true);

    try {
      const response = await apiRequest('POST', `/api/ai/optimize-route/${tripId}`, {
        newBooking: {
          pickup: riderRequest.pickup,
          dropoff: riderRequest.dropoff
        }
      });

      setRouteOptimization(response);
      setSelectedTripId(tripId);

      toast({
        title: "Route Optimized",
        description: `Total distance: ${response.totalDistance} miles, Time: ${response.totalTime} minutes`,
      });

    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeTripDemand = async () => {
    if (!riderRequest.pickup.address || !riderRequest.dropoff.address) {
      toast({
        title: "Missing Information",
        description: "Please enter route information for demand analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await apiRequest('POST', '/api/ai/analyze-trip-demand', {
        route: {
          from: {
            lat: riderRequest.pickup.lat,
            lng: riderRequest.pickup.lng,
            city: riderRequest.pickup.address.split(',')[0] || "Unknown"
          },
          to: {
            lat: riderRequest.dropoff.lat,
            lng: riderRequest.dropoff.lng,
            city: riderRequest.dropoff.address.split(',')[0] || "Unknown"
          }
        },
        timeWindow: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      });

      setDemandAnalysis(response);

      toast({
        title: "Demand Analysis Complete",
        description: `Demand score: ${response.demandScore}/100`,
      });

    } catch (error) {
      console.error('Demand analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze trip demand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getDemandColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <span>Intelligent Trip Matching</span>
          </CardTitle>
          <CardDescription>
            AI-powered trip optimization with route planning and demand analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Request Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickup">Pickup Location</Label>
                <Input
                  id="pickup"
                  value={riderRequest.pickup.address}
                  onChange={(e) => setRiderRequest(prev => ({
                    ...prev,
                    pickup: { ...prev.pickup, address: e.target.value }
                  }))}
                  placeholder="Enter pickup address"
                />
              </div>
              
              <div>
                <Label htmlFor="dropoff">Dropoff Location</Label>
                <Input
                  id="dropoff"
                  value={riderRequest.dropoff.address}
                  onChange={(e) => setRiderRequest(prev => ({
                    ...prev,
                    dropoff: { ...prev.dropoff, address: e.target.value }
                  }))}
                  placeholder="Enter dropoff address"
                />
              </div>

              <div>
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="datetime-local"
                  value={riderRequest.departureTime}
                  onChange={(e) => setRiderRequest(prev => ({ ...prev, departureTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="passengers">Number of Passengers</Label>
                <Select
                  value={riderRequest.passengers.toString()}
                  onValueChange={(value) => setRiderRequest(prev => ({ ...prev, passengers: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Passenger</SelectItem>
                    <SelectItem value="2">2 Passengers</SelectItem>
                    <SelectItem value="3">3 Passengers</SelectItem>
                    <SelectItem value="4">4 Passengers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="maxDetour">Max Detour (minutes)</Label>
                <Input
                  id="maxDetour"
                  type="number"
                  value={riderRequest.preferences.maxDetour}
                  onChange={(e) => setRiderRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, maxDetour: parseInt(e.target.value) || 15 }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="vehicleType">Preferred Vehicle Type</Label>
                <Select
                  value={riderRequest.preferences.preferredVehicleType}
                  onValueChange={(value) => setRiderRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, preferredVehicleType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Vehicle</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="musicPreference">Music Preference</Label>
                <Select
                  value={riderRequest.preferences.musicPreference}
                  onValueChange={(value) => setRiderRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, musicPreference: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Preference</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="quiet">Quiet Ride</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={findOptimalTrips}
              disabled={isAnalyzing}
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Find Optimal Trips</span>
            </Button>

            <Button 
              onClick={analyzeTripDemand}
              disabled={isAnalyzing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Analyze Demand</span>
            </Button>
          </div>

          {/* Trip Match Results */}
          {matchResults.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Optimal Trip Matches</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchResults.map((match, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Trip #{match.tripId}</span>
                          <Badge className={getMatchScoreColor(match.matchScore)}>
                            {Math.round(match.matchScore * 100)}% match
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>+{match.estimatedDetour} min detour</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Leaf className="h-4 w-4 text-green-600" />
                            <span>{match.carbonSavings.toFixed(1)} kg CO₂ saved</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{Math.round(match.costEfficiency * 100)}% cost efficient</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm font-medium">Why this matches:</div>
                          <ul className="text-xs space-y-1">
                            {match.reasons.slice(0, 3).map((reason, idx) => (
                              <li key={idx} className="text-gray-600">• {reason}</li>
                            ))}
                          </ul>
                        </div>

                        <Button 
                          onClick={() => analyzeRouteOptimization(match.tripId)}
                          disabled={isAnalyzing}
                          size="sm"
                          className="w-full"
                        >
                          <Route className="h-4 w-4 mr-2" />
                          Optimize Route
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Route Optimization Results */}
          {routeOptimization && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center space-x-2">
                <Navigation className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Route Optimization for Trip #{selectedTripId}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {routeOptimization.totalDistance} mi
                      </div>
                      <div className="text-sm text-gray-600">Total Distance</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {routeOptimization.totalTime} min
                      </div>
                      <div className="text-sm text-gray-600">Total Time</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {routeOptimization.carbonReduction.toFixed(1)} kg
                      </div>
                      <div className="text-sm text-gray-600">CO₂ Reduction</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Optimized Route</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {routeOptimization.optimizedRoute.map((stop, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{stop.address}</div>
                          <div className="text-sm text-gray-600">
                            {stop.stopType} • Est. {stop.estimatedTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {routeOptimization.recommendations.length > 0 && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Optimization Insights:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {routeOptimization.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Demand Analysis Results */}
          {demandAnalysis && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Trip Demand Analysis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getDemandColor(demandAnalysis.demandScore)}`}>
                        {demandAnalysis.demandScore}/100
                      </div>
                      <div className="text-sm text-gray-600">Demand Score</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${demandAnalysis.suggestedPricing}
                      </div>
                      <div className="text-sm text-gray-600">Suggested Price</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ${demandAnalysis.competitorAnalysis.averagePrice}
                      </div>
                      <div className="text-sm text-gray-600">Market Average</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold capitalize">
                        {demandAnalysis.competitorAnalysis.availability}
                      </div>
                      <div className="text-sm text-gray-600">Availability</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Peak Travel Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {demandAnalysis.peakTimes.map((time, index) => (
                        <Badge key={index} variant="outline">{time}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {demandAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}