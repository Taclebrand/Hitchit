import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { Trip, Booking, User } from '@shared/schema';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface UserPersonalizationProfile {
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
    bookingLeadTime: number; // hours before departure
    cancellationRate: number;
    avgTripDistance: number;
    seasonalPatterns: string[];
  };
  recommendations: string[];
  insights: string[];
}

export interface PersonalizedRecommendation {
  type: 'trip' | 'route' | 'time' | 'price' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  data?: any;
  confidence: number;
}

export class PersonalizationEngine {
  static async buildUserProfile(userId: number): Promise<UserPersonalizationProfile> {
    try {
      // Get user's historical data
      const userTrips = await storage.getTripsByDriverId(userId);
      const userBookings = await storage.getBookingsByRiderId(userId);
      const user = await storage.getUser(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analyze this user's travel behavior and create a comprehensive personalization profile. 

User ID: ${userId}
Account created: ${user.createdAt}

Trip History (as driver):
${userTrips.map(trip => `
- ${trip.originAddress} → ${trip.destinationAddress}
- Date: ${trip.departureDate}
- Price: $${trip.price}
- Seats: ${trip.availableSeats}
- Status: ${trip.status}
`).join('\n')}

Booking History (as rider):
${userBookings.map(booking => `
- ${booking.pickupAddress} → ${booking.dropoffAddress}
- Seats: ${booking.seats}
- Price: $${booking.price}
- Status: ${booking.status}
- Date: ${booking.createdAt}
`).join('\n')}

Create a detailed analysis including:
1. Most frequent pickup/dropoff locations
2. Common routes and travel patterns
3. Preferred travel times and days
4. Price sensitivity and spending patterns
5. Booking behavior (lead time, cancellations)
6. Seasonal or recurring patterns
7. Vehicle and comfort preferences
8. Social preferences (solo vs group travel)

Return JSON with the profile structure matching UserPersonalizationProfile interface.`
          }
        ]
      });

      let profileData;
      try {
        const content = response.content[0];
        if ('text' in content) {
          profileData = JSON.parse(content.text);
        } else {
          profileData = this.createFallbackProfile(userTrips, userBookings);
        }
      } catch {
        // Fallback if JSON parsing fails
        profileData = this.createFallbackProfile(userTrips, userBookings);
      }

      return {
        preferredPickupLocations: profileData.preferredPickupLocations || [],
        preferredDropoffLocations: profileData.preferredDropoffLocations || [],
        frequentRoutes: profileData.frequentRoutes || [],
        travelPreferences: {
          preferredDepartureTime: profileData.travelPreferences?.preferredDepartureTime || 'morning',
          vehicleTypePreference: profileData.travelPreferences?.vehicleTypePreference || 'any',
          priceRange: profileData.travelPreferences?.priceRange || { min: 10, max: 50 },
          comfortLevel: profileData.travelPreferences?.comfortLevel || 'basic',
          socialPreference: profileData.travelPreferences?.socialPreference || 'no_preference'
        },
        behaviorPatterns: {
          bookingLeadTime: profileData.behaviorPatterns?.bookingLeadTime || 24,
          cancellationRate: profileData.behaviorPatterns?.cancellationRate || 0.1,
          avgTripDistance: profileData.behaviorPatterns?.avgTripDistance || 25,
          seasonalPatterns: profileData.behaviorPatterns?.seasonalPatterns || []
        },
        recommendations: profileData.recommendations || [],
        insights: profileData.insights || []
      };

    } catch (error) {
      console.error('Profile building failed:', error);
      return this.createFallbackProfile([], []);
    }
  }

  static async generatePersonalizedRecommendations(
    userId: number,
    context?: {
      currentLocation?: { lat: number; lng: number };
      timeOfDay?: string;
      dayOfWeek?: string;
      recentActivity?: string;
    }
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const profile = await this.buildUserProfile(userId);
      const recentTrips = await storage.getTripsByDriverId(userId);
      const recentBookings = await storage.getBookingsByRiderId(userId);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Generate personalized recommendations for this user based on their profile and current context.

User Profile:
${JSON.stringify(profile, null, 2)}

Current Context:
- Time: ${context?.timeOfDay || new Date().toLocaleTimeString()}
- Day: ${context?.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
- Recent activity: ${context?.recentActivity || 'browsing'}
- Location: ${context?.currentLocation ? `${context.currentLocation.lat}, ${context.currentLocation.lng}` : 'unknown'}

Recent trips (last 5):
${recentTrips.slice(0, 5).map(t => `${t.originAddress} → ${t.destinationAddress} on ${t.departureDate}`).join('\n')}

Recent bookings (last 5):
${recentBookings.slice(0, 5).map(b => `${b.pickupAddress} → ${b.dropoffAddress} - $${b.price}`).join('\n')}

Generate 5-8 personalized recommendations including:
1. Trip suggestions based on their patterns
2. Optimal departure times for their routes
3. Price optimization opportunities
4. New route suggestions
5. Seasonal travel recommendations
6. Booking behavior improvements

Return JSON array of recommendations with: {
  "type": "trip" | "route" | "time" | "price" | "general",
  "priority": "high" | "medium" | "low",
  "title": "string",
  "description": "string",
  "actionable": boolean,
  "data": object (optional),
  "confidence": number (0-1)
}`
          }
        ]
      });

      let recommendations;
      try {
        const content = response.content[0];
        if (content.type === 'text') {
          const parsed = JSON.parse(content.text);
          recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations || [];
        } else {
          recommendations = [];
        }
      } catch {
        recommendations = [];
      }

      return recommendations.map((rec: any) => ({
        type: rec.type || 'general',
        priority: rec.priority || 'medium',
        title: rec.title || 'Personalized suggestion',
        description: rec.description || 'Based on your travel patterns',
        actionable: rec.actionable || false,
        data: rec.data,
        confidence: Math.max(0, Math.min(1, rec.confidence || 0.5))
      }));

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return [];
    }
  }

  static async predictUserNeeds(
    userId: number,
    timeWindow: { start: Date; end: Date }
  ): Promise<{
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
  }> {
    try {
      const profile = await this.buildUserProfile(userId);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: `Predict this user's travel needs for the upcoming time period based on their profile.

User Profile:
${JSON.stringify(profile, null, 2)}

Prediction window: ${timeWindow.start.toISOString()} to ${timeWindow.end.toISOString()}
Current date: ${new Date().toISOString()}

Analyze:
1. Most likely routes they'll need based on patterns
2. Optimal booking times for their preferred routes  
3. Price trends they should be aware of
4. Behavioral insights to improve their experience

Consider:
- Recurring travel patterns
- Seasonal variations
- Day of week preferences
- Historical booking lead times
- Price sensitivity
- Special events or holidays in the time window

Return JSON with: {
  "likelyBookings": [
    {
      "route": {"from": "string", "to": "string"},
      "probability": number (0-1),
      "suggestedTime": "string",
      "reasoning": "string"
    }
  ],
  "priceAlerts": [
    {
      "route": "string",
      "currentPrice": number,
      "predictedPrice": number,
      "trend": "increasing" | "decreasing" | "stable"
    }
  ],
  "behaviorInsights": ["string array of actionable insights"]
}`
          }
        ]
      });

      let predictions;
      try {
        const content = response.content[0];
        if (content.type === 'text') {
          predictions = JSON.parse(content.text);
        } else {
          predictions = { likelyBookings: [], priceAlerts: [], behaviorInsights: [] };
        }
      } catch {
        predictions = { likelyBookings: [], priceAlerts: [], behaviorInsights: [] };
      }

      return {
        likelyBookings: predictions.likelyBookings || [],
        priceAlerts: predictions.priceAlerts || [],
        behaviorInsights: predictions.behaviorInsights || []
      };

    } catch (error) {
      console.error('Prediction failed:', error);
      return {
        likelyBookings: [],
        priceAlerts: [],
        behaviorInsights: []
      };
    }
  }

  static async adaptUserInterface(
    userId: number,
    deviceInfo?: {
      type: 'mobile' | 'tablet' | 'desktop';
      screenSize: string;
      capabilities: string[];
    }
  ): Promise<{
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
  }> {
    try {
      const profile = await this.buildUserProfile(userId);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Adapt the user interface for this user based on their behavior patterns and device capabilities.

User Profile:
${JSON.stringify(profile, null, 2)}

Device Info:
${JSON.stringify(deviceInfo || {}, null, 2)}

Recommend interface adaptations:
1. Most important actions to surface prominently
2. Quick access shortcuts based on frequent actions
3. Features to hide or minimize for this user
4. Content filtering and sorting preferences
5. Accessibility adaptations
6. Performance optimizations for their usage patterns

Return JSON with interface adaptation recommendations.`
          }
        ]
      });

      let adaptations;
      try {
        const content = response.content[0];
        if (content.type === 'text') {
          adaptations = JSON.parse(content.text);
        } else {
          adaptations = {};
        }
      } catch {
        adaptations = {};
      }

      return {
        layoutPreferences: {
          primaryActions: adaptations.layoutPreferences?.primaryActions || ['book_ride', 'search_trips'],
          quickAccessItems: adaptations.layoutPreferences?.quickAccessItems || ['recent_routes', 'saved_locations'],
          hiddenFeatures: adaptations.layoutPreferences?.hiddenFeatures || []
        },
        contentPersonalization: {
          suggestedFilters: adaptations.contentPersonalization?.suggestedFilters || ['price', 'departure_time'],
          defaultSortOrder: adaptations.contentPersonalization?.defaultSortOrder || 'price_low_to_high',
          preferredViewMode: adaptations.contentPersonalization?.preferredViewMode || 'list'
        },
        accessibilityAdaptations: adaptations.accessibilityAdaptations || [],
        performanceOptimizations: adaptations.performanceOptimizations || []
      };

    } catch (error) {
      console.error('UI adaptation failed:', error);
      return {
        layoutPreferences: { primaryActions: [], quickAccessItems: [], hiddenFeatures: [] },
        contentPersonalization: { suggestedFilters: [], defaultSortOrder: 'relevance', preferredViewMode: 'list' },
        accessibilityAdaptations: [],
        performanceOptimizations: []
      };
    }
  }

  private static createFallbackProfile(trips: Trip[], bookings: Booking[]): UserPersonalizationProfile {
    return {
      preferredPickupLocations: [],
      preferredDropoffLocations: [],
      frequentRoutes: [],
      travelPreferences: {
        preferredDepartureTime: 'morning',
        vehicleTypePreference: 'any',
        priceRange: { min: 10, max: 50 },
        comfortLevel: 'basic',
        socialPreference: 'no_preference'
      },
      behaviorPatterns: {
        bookingLeadTime: 24,
        cancellationRate: 0.1,
        avgTripDistance: 25,
        seasonalPatterns: []
      },
      recommendations: [],
      insights: []
    };
  }
}