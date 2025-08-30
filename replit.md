# HitchIt - Ride Sharing Platform

## Project Overview
HitchIt is a comprehensive ride-sharing and package delivery platform with Firebase authentication, location services, Airbnb-style pricing controls, and integrated payment systems using Stripe for drivers, riders, and package shippers. The platform includes advanced multi-vehicle management with one-tap vehicle profile switching and complete driver onboarding with selfie verification.

## Recent Changes
- **August 30, 2025**: Fixed critical location detection issues after user reported "Location detection still not working"
- **August 30, 2025**: Completely rewrote RideContent.tsx to eliminate duplicate function declarations and LSP errors
- **August 30, 2025**: Implemented robust current location detection with multiple fallbacks (Google Maps → Mapbox → Coordinates)
- **August 30, 2025**: Added comprehensive error handling for geolocation permissions and browser compatibility
- **August 30, 2025**: Improved user guidance for location permission issues with specific browser instructions
- **August 30, 2025**: Fixed AddressVerificationModal interface compatibility issues
- **August 30, 2025**: Added visual feedback for successful location detection with green confirmation

## Project Architecture

### Frontend (React + TypeScript)
- **Pages**: Auth, DriverSignup, CreateTrip, VehicleManager, Settings, PaymentSettings
- **Components**: VehicleSwitcher, SelfieCaptureModal, LocationInput, PaymentSetup
- **Services**: GoogleMapsService, MapboxService, FallbackLocationService
- **State Management**: React Query for API calls, Context for auth/theme/accessibility

### Backend (Express.js + PostgreSQL)
- **Database**: Drizzle ORM with PostgreSQL (Neon-backed)
- **Authentication**: JWT-based with Firebase integration
- **API Routes**: Users, vehicles, trips, bookings, payments, AI features
- **Storage**: Centralized storage interface with CRUD operations

### Key Features
1. **Smart Location Autocomplete**: Recent and favorite locations with intelligent search
2. **Real Location Detection**: Google Maps API for accurate street address detection
3. **Location History Tracking**: Automatic saving and ranking of frequently used locations
4. **Favorite Locations**: Save custom named locations (Home, Work, etc.) with icons
5. **Multi-Vehicle Management**: Drivers can register multiple vehicles and switch between them
6. **Selfie Verification**: Camera-based identity verification for driver onboarding
7. **Payment System**: Stripe integration for payments and driver withdrawals
8. **Trip Management**: Create, search, and book rides with real-time tracking
9. **AI Features**: Vehicle verification, voice assistant, trip matching

## User Preferences
- **Communication Style**: Technical and detailed explanations preferred
- **Code Style**: TypeScript with strict typing, React functional components
- **Database**: Prefer PostgreSQL with Drizzle ORM over other databases
- **API Integration**: Real API calls preferred over mock data

## Current Issues Resolved
✓ Google Maps autocomplete now working for ride and package destination inputs
✓ Direct Google Places API integration with proper prediction and place details
✓ GoogleAutocomplete component replacing legacy LocationInput components
✓ Database cleared of all mock/test data for real operational usage
✓ Trip matching now works with real location coordinates and proper filtering
✓ Package delivery matching implemented with driver availability search
✓ Proper "no match" and "no drivers available" messaging for all scenarios

## Technical Decisions
- **Database Schema**: Users, vehicles, trips, bookings tables with proper relationships
- **File Upload**: Base64 encoding for images (temporary solution)
- **Location Data**: Coordinates stored as strings, addresses as text
- **Vehicle Selection**: Dropdown with full vehicle details (year, make, model, color, seats)
- **Error Handling**: Graceful fallbacks for API failures and missing permissions

## Development Status
- Real data implementation: Complete for trips, rides, and package delivery
- Trip matching system: Live with proximity-based filtering and no-match messaging
- Package delivery matching: Operational with driver availability search
- Driver-shipper matching: Real-time based on location and route direction
- Smart location features: Complete with autocomplete, recent locations, and favorites
- Database: Clean of test data, ready for production use