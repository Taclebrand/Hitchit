# HitchIt - Ride Sharing Platform

## Project Overview
HitchIt is a comprehensive ride-sharing and package delivery platform with Firebase authentication, location services, Airbnb-style pricing controls, and integrated payment systems using Stripe for drivers, riders, and package shippers. The platform includes advanced multi-vehicle management with one-tap vehicle profile switching and complete driver onboarding with selfie verification.

## Recent Changes
- **January 6, 2025**: Implemented smart location autocomplete with recent and favorite locations
- **January 6, 2025**: Added database tables for recent_locations and favorite_locations
- **January 6, 2025**: Created SmartLocationAutocomplete component with real-time search
- **January 6, 2025**: Integrated location history tracking and usage analytics
- **January 6, 2025**: Added API endpoints for location management and search functionality
- **June 24, 2025**: Implemented real location data with Google Maps API integration
- **June 24, 2025**: Enhanced trip creation with real street address detection and fallback options
- **June 24, 2025**: Fixed camera permissions and selfie capture for driver verification

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
✓ Camera permission prompts now working properly with detailed error messages
✓ Selfie upload functionality fixed - no longer redirects to home page
✓ Vehicle management integrated with trip creation
✓ Payment settings runtime errors resolved
✓ Location services working with GPS coordinates

## Technical Decisions
- **Database Schema**: Users, vehicles, trips, bookings tables with proper relationships
- **File Upload**: Base64 encoding for images (temporary solution)
- **Location Data**: Coordinates stored as strings, addresses as text
- **Vehicle Selection**: Dropdown with full vehicle details (year, make, model, color, seats)
- **Error Handling**: Graceful fallbacks for API failures and missing permissions

## Development Status
- Driver registration: Complete with selfie verification
- Vehicle management: Complete with API integration  
- Trip creation: Complete with vehicle selection
- Payment system: Functional with Stripe integration
- Location services: Working with multiple provider fallbacks