import OpenAI from 'openai';
import { Trip, Booking } from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TripMatchResult {
  tripId: number;
  matchScore: number;
  reasons: string[];
  estimatedDetour: number; // in minutes
  carbonSavings: number; // in kg CO2
  costEfficiency: number; // 0-1 scale
}

export interface RouteOptimization {
  optimizedRoute: {
    lat: number;
    lng: number;
    address: string;
    stopType: 'pickup' | 'dropoff' | 'waypoint';
    estimatedTime: string;
  }[];
  totalDistance: number;
  totalTime: number;
  fuelSaved: number;
  carbonReduction: number;
  recommendations: string[];
}

export class IntelligentTripMatchingService {
  static async findOptimalMatches(
    riderRequest: {
      pickup: { lat: number; lng: number; address: string };
      dropoff: { lat: number; lng: number; address: string };
      departureTime: Date;
      passengers: number;
      preferences?: {
        maxDetour?: number;
        preferredVehicleType?: string;
        smokingAllowed?: boolean;
        petsAllowed?: boolean;
        musicPreference?: string;
      };
    },
    availableTrips: Trip[]
  ): Promise<TripMatchResult[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an intelligent trip matching algorithm. Analyze the rider request and available trips to find optimal matches based on:
            1. Route efficiency and minimal detour
            2. Time compatibility
            3. Passenger preferences
            4. Carbon footprint reduction
            5. Cost effectiveness
            6. Driver ratings and reliability
            
            Consider factors like:
            - Geographic proximity and route overlap
            - Traffic patterns and optimal timing
            - Passenger comfort and compatibility
            - Environmental impact
            - Economic efficiency for all parties
            
            Return JSON array of matches with: {
              "tripId": number,
              "matchScore": number (0-1),
              "reasons": [string array explaining why this is a good match],
              "estimatedDetour": number (minutes),
              "carbonSavings": number (kg CO2 saved),
              "costEfficiency": number (0-1 scale)
            }
            
            Sort by matchScore descending, only include matches with score > 0.3`
          },
          {
            role: "user",
            content: `Find optimal trip matches for this rider request:
            
            Pickup: ${riderRequest.pickup.address} (${riderRequest.pickup.lat}, ${riderRequest.pickup.lng})
            Dropoff: ${riderRequest.dropoff.address} (${riderRequest.dropoff.lat}, ${riderRequest.dropoff.lng})
            Departure: ${riderRequest.departureTime.toISOString()}
            Passengers: ${riderRequest.passengers}
            Preferences: ${JSON.stringify(riderRequest.preferences || {})}
            
            Available trips:
            ${availableTrips.map(trip => `
            Trip ID: ${trip.id}
            From: ${trip.originAddress} (${trip.originLat}, ${trip.originLng})
            To: ${trip.destinationAddress} (${trip.destinationLat}, ${trip.destinationLng})
            Departure: ${trip.departureDate}
            Available seats: ${trip.availableSeats}
            Price: $${trip.price}
            `).join('\n---\n')}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');
      return result.matches || [];

    } catch (error) {
      console.error('Trip matching failed:', error);
      return [];
    }
  }

  static async optimizeRoute(
    trip: Trip,
    bookings: Booking[],
    newBooking?: {
      pickup: { lat: number; lng: number; address: string };
      dropoff: { lat: number; lng: number; address: string };
    }
  ): Promise<RouteOptimization> {
    try {
      const allStops = [
        {
          lat: parseFloat(trip.originLat),
          lng: parseFloat(trip.originLng),
          address: trip.originAddress,
          type: 'origin'
        },
        ...bookings.map(booking => ([
          {
            lat: parseFloat(booking.pickupLat),
            lng: parseFloat(booking.pickupLng),
            address: booking.pickupAddress,
            type: 'pickup',
            bookingId: booking.id
          },
          {
            lat: parseFloat(booking.dropoffLat),
            lng: parseFloat(booking.dropoffLng),
            address: booking.dropoffAddress,
            type: 'dropoff',
            bookingId: booking.id
          }
        ])).flat(),
        {
          lat: parseFloat(trip.destinationLat),
          lng: parseFloat(trip.destinationLng),
          address: trip.destinationAddress,
          type: 'destination'
        }
      ];

      if (newBooking) {
        allStops.push(
          {
            lat: newBooking.pickup.lat,
            lng: newBooking.pickup.lng,
            address: newBooking.pickup.address,
            type: 'new_pickup'
          },
          {
            lat: newBooking.dropoff.lat,
            lng: newBooking.dropoff.lng,
            address: newBooking.dropoff.address,
            type: 'new_dropoff'
          }
        );
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a route optimization expert. Given a trip with multiple stops, optimize the route to:
            1. Minimize total travel time and distance
            2. Ensure logical pickup/dropoff sequence
            3. Consider traffic patterns
            4. Maximize passenger satisfaction
            5. Reduce fuel consumption and emissions
            
            Rules:
            - Origin must be first, destination must be last
            - Pickups must come before their corresponding dropoffs
            - Minimize backtracking and inefficient routing
            - Consider real-world traffic and road conditions
            
            Return JSON with: {
              "optimizedRoute": [
                {
                  "lat": number,
                  "lng": number,
                  "address": string,
                  "stopType": "pickup" | "dropoff" | "waypoint",
                  "estimatedTime": "HH:MM format"
                }
              ],
              "totalDistance": number (miles),
              "totalTime": number (minutes),
              "fuelSaved": number (gallons vs unoptimized),
              "carbonReduction": number (kg CO2),
              "recommendations": [string array of optimization insights]
            }`
          },
          {
            role: "user",
            content: `Optimize this route with all stops:
            
            ${allStops.map((stop, index) => `
            ${index + 1}. ${stop.address} (${stop.lat}, ${stop.lng}) - ${stop.type}
            `).join('')}
            
            Vehicle ID: ${trip.vehicleId}
            Departure time: ${trip.departureDate}
            Current traffic conditions: Consider typical patterns for this time`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        optimizedRoute: result.optimizedRoute || [],
        totalDistance: result.totalDistance || 0,
        totalTime: result.totalTime || 0,
        fuelSaved: result.fuelSaved || 0,
        carbonReduction: result.carbonReduction || 0,
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('Route optimization failed:', error);
      return {
        optimizedRoute: [],
        totalDistance: 0,
        totalTime: 0,
        fuelSaved: 0,
        carbonReduction: 0,
        recommendations: ["Route optimization temporarily unavailable"]
      };
    }
  }

  static async analyzeTripDemand(
    route: {
      from: { lat: number; lng: number; city: string };
      to: { lat: number; lng: number; city: string };
    },
    timeWindow: {
      start: Date;
      end: Date;
    }
  ): Promise<{
    demandScore: number;
    peakTimes: string[];
    suggestedPricing: number;
    competitorAnalysis: {
      averagePrice: number;
      availability: string;
    };
    recommendations: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze trip demand for this route and time period. Consider:
            1. Popular travel times and patterns
            2. Seasonal variations
            3. Local events and holidays
            4. Business vs leisure travel patterns
            5. Weather impact
            6. Competition and market dynamics
            
            Return JSON with: {
              "demandScore": number (0-100),
              "peakTimes": [string array of optimal departure times],
              "suggestedPricing": number (per seat in USD),
              "competitorAnalysis": {
                "averagePrice": number,
                "availability": "high" | "medium" | "low"
              },
              "recommendations": [string array of actionable insights]
            }`
          },
          {
            role: "user",
            content: `Analyze demand for this route:
            From: ${route.from.city} (${route.from.lat}, ${route.from.lng})
            To: ${route.to.city} (${route.to.lat}, ${route.to.lng})
            Time window: ${timeWindow.start.toISOString()} to ${timeWindow.end.toISOString()}
            
            Consider current date: ${new Date().toISOString()}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        demandScore: Math.max(0, Math.min(100, result.demandScore || 50)),
        peakTimes: result.peakTimes || [],
        suggestedPricing: Math.max(5, result.suggestedPricing || 15),
        competitorAnalysis: {
          averagePrice: result.competitorAnalysis?.averagePrice || 15,
          availability: result.competitorAnalysis?.availability || 'medium'
        },
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('Demand analysis failed:', error);
      return {
        demandScore: 50,
        peakTimes: [],
        suggestedPricing: 15,
        competitorAnalysis: {
          averagePrice: 15,
          availability: 'medium'
        },
        recommendations: ["Demand analysis temporarily unavailable"]
      };
    }
  }
}