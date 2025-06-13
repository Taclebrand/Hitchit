import OpenAI from 'openai';
import { storage } from '../storage';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VoiceBookingIntent {
  action: 'book_ride' | 'create_trip' | 'cancel_booking' | 'get_status' | 'find_trips' | 'other';
  confidence: number;
  parameters: {
    pickup?: string;
    dropoff?: string;
    departureTime?: string;
    passengers?: number;
    vehiclePreference?: string;
    priceRange?: { min: number; max: number };
    tripId?: number;
    bookingId?: number;
  };
  clarificationNeeded: string[];
  suggestedResponse: string;
}

export interface VoiceInteractionContext {
  userId: number;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentBookingSession?: {
    pickup?: string;
    dropoff?: string;
    departureTime?: string;
    passengers?: number;
  };
}

export class ConversationalVoiceAssistant {
  static async processVoiceInput(
    transcript: string,
    context: VoiceInteractionContext
  ): Promise<VoiceBookingIntent> {
    try {
      // Get user's recent trips and preferences for context
      const userTrips = await storage.getTripsByDriverId(context.userId);
      const userBookings = await storage.getBookingsByRiderId(context.userId);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an intelligent voice assistant for a ride-sharing platform. Analyze user voice input to understand their intent and extract booking parameters.

            Available actions:
            - book_ride: User wants to book a ride as a passenger
            - create_trip: User wants to create a trip as a driver
            - cancel_booking: User wants to cancel an existing booking
            - get_status: User wants to check status of bookings/trips
            - find_trips: User wants to search for available trips
            - other: General inquiry or unclear intent

            Extract parameters when mentioned:
            - pickup: Starting location (address, landmark, or "current location")
            - dropoff: Destination (address, landmark, business name)
            - departureTime: When they want to travel (parse natural language times)
            - passengers: Number of people traveling
            - vehiclePreference: Type of vehicle (car, van, truck, etc.)
            - priceRange: Budget constraints if mentioned
            - tripId/bookingId: If referencing existing trips/bookings

            Consider conversation context and user's travel patterns. Be helpful by:
            1. Identifying missing required information
            2. Suggesting logical defaults based on user history
            3. Providing natural, conversational responses
            4. Clarifying ambiguous requests

            Return JSON with: {
              "action": string,
              "confidence": number (0-1),
              "parameters": object,
              "clarificationNeeded": [string array of missing info],
              "suggestedResponse": string (natural response to user)
            }`
          },
          {
            role: "user",
            content: `Process this voice input: "${transcript}"

            User context:
            - User ID: ${context.userId}
            - Recent trips: ${userTrips.slice(0, 3).map(t => `${t.originAddress} to ${t.destinationAddress}`).join(', ')}
            - Recent bookings: ${userBookings.slice(0, 3).map(b => `${b.pickupAddress} to ${b.dropoffAddress}`).join(', ')}
            
            Conversation history:
            ${context.conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
            
            Current booking session:
            ${JSON.stringify(context.currentBookingSession || {})}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        action: result.action || 'other',
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        parameters: result.parameters || {},
        clarificationNeeded: result.clarificationNeeded || [],
        suggestedResponse: result.suggestedResponse || "I'm here to help with your ride-sharing needs. What can I do for you?"
      };

    } catch (error) {
      console.error('Voice processing failed:', error);
      return {
        action: 'other',
        confidence: 0,
        parameters: {},
        clarificationNeeded: [],
        suggestedResponse: "I'm sorry, I didn't catch that. Could you please repeat your request?"
      };
    }
  }

  static async generateSmartSuggestions(
    context: VoiceInteractionContext,
    currentIntent: VoiceBookingIntent
  ): Promise<{
    quickActions: string[];
    locationSuggestions: string[];
    timeSuggestions: string[];
    responses: string[];
  }> {
    try {
      const userTrips = await storage.getTripsByDriverId(context.userId);
      const userBookings = await storage.getBookingsByRiderId(context.userId);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Generate intelligent suggestions to help the user complete their booking. Analyze their patterns and current intent to provide:

            1. Quick actions they might want to take
            2. Location suggestions based on their history
            3. Time suggestions based on typical travel patterns
            4. Natural conversational responses

            Make suggestions specific and actionable. Consider:
            - User's most frequent destinations
            - Typical travel times
            - Current time of day and day of week
            - Seasonal patterns
            - Location context (home, work, airport, etc.)

            Return JSON with: {
              "quickActions": [string array of 3-5 action buttons],
              "locationSuggestions": [string array of relevant locations],
              "timeSuggestions": [string array of logical departure times],
              "responses": [string array of helpful conversation starters]
            }`
          },
          {
            role: "user",
            content: `Generate suggestions for this user context:

            Current intent: ${currentIntent.action}
            Intent confidence: ${currentIntent.confidence}
            Missing info: ${currentIntent.clarificationNeeded.join(', ')}
            
            User's frequent locations:
            ${[...userTrips.map(t => [t.departureLocation, t.destinationLocation]), 
               ...userBookings.map(b => [b.pickupLocation, b.dropoffLocation])]
               .flat()
               .slice(0, 10)
               .join(', ')}
            
            Current parameters: ${JSON.stringify(currentIntent.parameters)}
            Current time: ${new Date().toISOString()}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        quickActions: result.quickActions || [],
        locationSuggestions: result.locationSuggestions || [],
        timeSuggestions: result.timeSuggestions || [],
        responses: result.responses || []
      };

    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return {
        quickActions: [],
        locationSuggestions: [],
        timeSuggestions: [],
        responses: []
      };
    }
  }

  static async convertSpeechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const result = await response.json();
      return result.text || '';

    } catch (error) {
      console.error('Speech-to-text failed:', error);
      return '';
    }
  }

  static async generateSpeechResponse(text: string): Promise<ArrayBuffer> {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        speed: 1.0,
      });

      return await response.arrayBuffer();

    } catch (error) {
      console.error('Text-to-speech failed:', error);
      throw new Error('Speech generation failed');
    }
  }

  static async handleMultiTurnConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: number
  ): Promise<{
    response: string;
    bookingProgress: {
      pickup?: string;
      dropoff?: string;
      departureTime?: string;
      passengers?: number;
      readyToBook: boolean;
    };
    nextAction?: string;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful voice assistant for a ride-sharing platform. Maintain natural conversation while collecting booking information.

            Your goals:
            1. Gather required info: pickup, dropoff, departure time, passengers
            2. Provide helpful suggestions and alternatives
            3. Confirm details before booking
            4. Handle changes and cancellations gracefully
            5. Keep conversation natural and efficient

            Always track booking progress and indicate when ready to proceed with booking.

            Return JSON with: {
              "response": string (natural conversational response),
              "bookingProgress": {
                "pickup": string or null,
                "dropoff": string or null,
                "departureTime": string or null,
                "passengers": number or null,
                "readyToBook": boolean
              },
              "nextAction": string (suggested next step)
            }`
          },
          ...messages,
          {
            role: "user",
            content: "Continue the conversation and track booking progress."
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        response: result.response || "How can I help you with your travel needs?",
        bookingProgress: {
          pickup: result.bookingProgress?.pickup,
          dropoff: result.bookingProgress?.dropoff,
          departureTime: result.bookingProgress?.departureTime,
          passengers: result.bookingProgress?.passengers,
          readyToBook: result.bookingProgress?.readyToBook || false
        },
        nextAction: result.nextAction
      };

    } catch (error) {
      console.error('Conversation handling failed:', error);
      return {
        response: "I'm sorry, there was an issue processing your request. Could you please try again?",
        bookingProgress: {
          readyToBook: false
        }
      };
    }
  }
}