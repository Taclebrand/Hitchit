import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Star,
  Calendar,
  DollarSign,
  Car,
  Brain,
  Lightbulb,
  Settings,
  BarChart3,
  Route,
  Sparkles
} from "lucide-react";

interface UserPersonalizationProfile {
  preferredPickupLocations: string[];
  preferredDropoffLocations: string[];
  frequentRoutes: Array<{
    from: string;
    to: string;
    frequency: number;
    timePattern: string;
  }>;
  travelPreferences: {
    preferredDepartureTime: string;
    vehicleTypePreference: string;
    priceRange: { min: number; max: number };
    comfortLevel: 'basic' | 'comfort' | 'luxury';
    socialPreference: 'quiet' | 'social' | 'no_preference';
  };
  behaviorPatterns: {
    bookingLeadTime: number;
    cancellationRate: number;
    avgTripDistance: number;
    seasonalPatterns: string[];
  };
  recommendations: string[];
  insights: string[];
}

interface PersonalizedRecommendation {
  type: 'trip' | 'route' | 'time' | 'price' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  data?: any;
  confidence: number;
}

interface PredictedNeeds {
  likelyBookings: Array<{
    route: { from: string; to: string };
    probability: number;
    suggestedTime: string;
    reasoning: string;
  }>;
  priceAlerts: Array<{
    route: string;
    currentPrice: number;
    predictedPrice: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  behaviorInsights: string[];
}

interface UIAdaptations {
  layoutPreferences: {
    primaryActions: string[];
    quickAccessItems: string[];
    hiddenFeatures: string[];
  };
  contentPersonalization: {
    suggestedFilters: string[];
    defaultSortOrder: string;
    preferredViewMode: string;
  };
  accessibilityAdaptations: string[];
  performanceOptimizations: string[];
}

export default function PersonalizationDashboard() {
  const [userProfile, setUserProfile] = useState<UserPersonalizationProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [predictedNeeds, setPredictedNeeds] = useState<PredictedNeeds | null>(null);
  const [uiAdaptations, setUIAdaptations] = useState<UIAdaptations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadPersonalizationData();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  };

  const loadPersonalizationData = async () => {
    setIsLoading(true);

    try {
      // Load user profile
      const profileResponseRaw = await apiRequest('GET', '/api/ai/user-profile');
      const profileResponse = await profileResponseRaw.json();
      setUserProfile(profileResponse);

      // Generate personalized recommendations
      const recommendationsResponseRaw = await apiRequest('POST', '/api/ai/recommendations', {
        context: {
          currentLocation,
          timeOfDay: new Date().toLocaleTimeString(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          recentActivity: 'browsing_dashboard'
        }
      });
      const recommendationsResponse = await recommendationsResponseRaw.json();
      setRecommendations(recommendationsResponse.recommendations);

      // Predict user needs for the next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const predictionsResponseRaw = await apiRequest('POST', '/api/ai/predict-needs', {
        timeWindow: {
          start: new Date().toISOString(),
          end: nextWeek.toISOString()
        }
      });
      const predictionsResponse = await predictionsResponseRaw.json();
      setPredictedNeeds(predictionsResponse);

      // Get UI adaptations
      const adaptationsResponseRaw = await apiRequest('POST', '/api/ai/adapt-ui', {
        deviceInfo: {
          type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          capabilities: ['geolocation', 'camera', 'microphone']
        }
      });
      const adaptationsResponse = await adaptationsResponseRaw.json();
      setUIAdaptations(adaptationsResponse);

      toast({
        title: "Personalization Updated",
        description: "Your AI-powered travel insights have been refreshed",
      });

    } catch (error) {
      console.error('Failed to load personalization data:', error);
      toast({
        title: "Loading Failed",
        description: "Unable to load personalization data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return "border-red-200 bg-red-50";
      case 'medium': return "border-yellow-200 bg-yellow-50";
      case 'low': return "border-blue-200 bg-blue-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trip': return <Car className="h-4 w-4" />;
      case 'route': return <Route className="h-4 w-4" />;
      case 'time': return <Clock className="h-4 w-4" />;
      case 'price': return <DollarSign className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Brain className="h-8 w-8 animate-pulse text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Building Your Personalized Profile...</div>
                <div className="text-sm text-gray-600">Analyzing your travel patterns and preferences</div>
              </div>
              <Progress value={66} className="w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>AI Personalization Dashboard</span>
          </CardTitle>
          <CardDescription>
            Your personalized travel insights powered by machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadPersonalizationData} disabled={isLoading} className="mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Insights
          </Button>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {userProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">Frequent Routes</div>
                          <div className="text-2xl font-bold">{userProfile.frequentRoutes.length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">Avg Lead Time</div>
                          <div className="text-2xl font-bold">{userProfile.behaviorPatterns.bookingLeadTime}h</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Route className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium">Avg Distance</div>
                          <div className="text-2xl font-bold">{userProfile.behaviorPatterns.avgTripDistance}mi</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="text-sm font-medium">Reliability</div>
                          <div className="text-2xl font-bold">
                            {Math.round((1 - userProfile.behaviorPatterns.cancellationRate) * 100)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick Insights */}
              {userProfile?.insights && userProfile.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userProfile.insights.slice(0, 3).map((insight, index) => (
                        <Alert key={index}>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>{insight}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec, index) => (
                  <Card key={index} className={getPriorityColor(rec.priority)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getTypeIcon(rec.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{rec.title}</div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(rec.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{rec.description}</div>
                          {rec.actionable && (
                            <Button size="sm" variant="outline" className="text-xs">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {recommendations.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No recommendations available yet</div>
                      <div className="text-sm">Take a few trips to get personalized suggestions</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-4">
              {predictedNeeds && (
                <>
                  {/* Likely Bookings */}
                  {predictedNeeds.likelyBookings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Predicted Travel Needs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {predictedNeeds.likelyBookings.map((booking, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {booking.route.from} → {booking.route.to}
                                </div>
                                <div className="text-sm text-gray-600">{booking.reasoning}</div>
                                <div className="text-sm text-blue-600">Suggested: {booking.suggestedTime}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {Math.round(booking.probability * 100)}% likely
                                </div>
                                <Progress value={booking.probability * 100} className="w-16 h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Price Alerts */}
                  {predictedNeeds.priceAlerts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Price Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {predictedNeeds.priceAlerts.map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                              <div className="flex items-center space-x-3">
                                {getTrendIcon(alert.trend)}
                                <div>
                                  <div className="font-medium">{alert.route}</div>
                                  <div className="text-sm text-gray-600 capitalize">{alert.trend} trend</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  ${alert.currentPrice} → ${alert.predictedPrice}
                                </div>
                                <div className={`text-sm ${
                                  alert.trend === 'decreasing' ? 'text-green-600' : 
                                  alert.trend === 'increasing' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {alert.trend === 'decreasing' ? 'Save money!' : 
                                   alert.trend === 'increasing' ? 'Book soon' : 'Stable pricing'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Behavior Insights */}
                  {predictedNeeds.behaviorInsights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Behavioral Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {predictedNeeds.behaviorInsights.map((insight, index) => (
                            <Alert key={index}>
                              <BarChart3 className="h-4 w-4" />
                              <AlertDescription>{insight}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Patterns Tab */}
            <TabsContent value="patterns" className="space-y-4">
              {userProfile && (
                <>
                  {/* Frequent Routes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Frequent Routes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userProfile.frequentRoutes.map((route, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div>
                              <div className="font-medium">{route.from} → {route.to}</div>
                              <div className="text-sm text-gray-600">{route.timePattern}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{route.frequency} trips</div>
                              <div className="text-sm text-gray-600">this month</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seasonal Patterns */}
                  {userProfile.behaviorPatterns.seasonalPatterns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Seasonal Patterns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.behaviorPatterns.seasonalPatterns.map((pattern, index) => (
                            <Badge key={index} variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              {userProfile && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Travel Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Preferred Departure Time</div>
                          <div className="text-lg">{userProfile.travelPreferences.preferredDepartureTime}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Vehicle Type</div>
                          <div className="text-lg">{userProfile.travelPreferences.vehicleTypePreference || 'Any'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Price Range</div>
                          <div className="text-lg">
                            ${userProfile.travelPreferences.priceRange.min} - ${userProfile.travelPreferences.priceRange.max}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Comfort Level</div>
                          <div className="text-lg capitalize">{userProfile.travelPreferences.comfortLevel}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* UI Adaptations */}
                  {uiAdaptations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Interface Adaptations</CardTitle>
                        <CardDescription>
                          Your interface is automatically optimized based on usage patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Primary Actions</div>
                          <div className="flex flex-wrap gap-2">
                            {uiAdaptations.layoutPreferences.primaryActions.map((action, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800">
                                {action.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-2">Quick Access Items</div>
                          <div className="flex flex-wrap gap-2">
                            {uiAdaptations.layoutPreferences.quickAccessItems.map((item, index) => (
                              <Badge key={index} variant="outline">
                                {item.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {uiAdaptations.accessibilityAdaptations.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Accessibility Features</div>
                            <ul className="text-sm space-y-1">
                              {uiAdaptations.accessibilityAdaptations.map((adaptation, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <Settings className="h-3 w-3" />
                                  <span>{adaptation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}