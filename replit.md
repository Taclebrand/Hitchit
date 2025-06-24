# HitchIt - Ride Sharing Platform

## Project Overview
HitchIt is a comprehensive ride-sharing and package delivery platform with Firebase authentication, location services, Airbnb-style pricing controls, and integrated payment systems using Stripe for drivers, riders, and package shippers. The platform includes advanced multi-vehicle management with one-tap vehicle profile switching and complete driver onboarding with selfie verification.

## Recent Changes
- **June 24, 2025**: Implemented real location data with Google Maps API integration
- **June 24, 2025**: Added manual address entry forms (street, city, state, zip) for all user types
- **June 24, 2025**: Enhanced trip creation with real street address detection and fallback options
- **June 24, 2025**: Fixed camera permissions and selfie capture for driver verification
- **June 24, 2025**: Enhanced vehicle management system with proper API integration
- **June 24, 2025**: Resolved payment settings runtime errors with proper array validation
- **June 24, 2025**: Added vehicle selection functionality to trip creation

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
1. **Real Location Detection**: Google Maps API for accurate street address detection
2. **Manual Address Entry**: Street, city, state, zip format when auto-detection fails
3. **Multi-Vehicle Management**: Drivers can register multiple vehicles and switch between them
4. **Selfie Verification**: Camera-based identity verification for driver onboarding
5. **Payment System**: Stripe integration for payments and driver withdrawals
6. **Trip Management**: Create, search, and book rides with real-time tracking
7. **AI Features**: Vehicle verification, voice assistant, trip matching

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