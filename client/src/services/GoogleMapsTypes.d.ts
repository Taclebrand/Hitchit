// Type definitions for Google Maps API
// This helps TypeScript recognize the Google Maps objects and methods

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
  }
  
  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    [key: string]: any;
  }
  
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  class Geocoder {
    geocode(request: GeocoderRequest): Promise<GeocoderResponse>;
  }
  
  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
    [key: string]: any;
  }
  
  interface GeocoderResponse {
    results: GeocoderResult[];
    status: GeocoderStatus;
  }
  
  interface GeocoderResult {
    geometry: {
      location: LatLng;
    };
    formatted_address: string;
    place_id: string;
    [key: string]: any;
  }
  
  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  
  class DirectionsService {
    route(request: DirectionsRequest): Promise<DirectionsResult>;
  }
  
  interface DirectionsRequest {
    origin: string | LatLng | LatLngLiteral | Place;
    destination: string | LatLng | LatLngLiteral | Place;
    travelMode: TravelMode;
    transitOptions?: TransitOptions;
    drivingOptions?: DrivingOptions;
    unitSystem?: UnitSystem;
    waypoints?: DirectionsWaypoint[];
    optimizeWaypoints?: boolean;
    provideRouteAlternatives?: boolean;
    avoidFerries?: boolean;
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    region?: string;
  }
  
  interface TransitOptions {
    arrivalTime?: Date;
    departureTime?: Date;
    modes?: TransitMode[];
    routingPreference?: TransitRoutePreference;
  }
  
  interface DrivingOptions {
    departureTime: Date;
    trafficModel?: TrafficModel;
  }
  
  interface DirectionsWaypoint {
    location: string | LatLng | LatLngLiteral | Place;
    stopover?: boolean;
  }
  
  interface Place {
    location: LatLng | LatLngLiteral;
    placeId: string;
    query: string;
  }
  
  interface DirectionsResult {
    routes: DirectionsRoute[];
  }
  
  interface DirectionsRoute {
    legs: DirectionsLeg[];
    overview_polyline: { points: string };
    [key: string]: any;
  }
  
  interface DirectionsLeg {
    start_location: LatLng;
    end_location: LatLng;
    distance: Distance;
    duration: Duration;
    steps: DirectionsStep[];
  }
  
  interface DirectionsStep {
    distance: Distance;
    duration: Duration;
    instructions: string;
    path: LatLng[];
    travel_mode: TravelMode;
  }
  
  interface Distance {
    text: string;
    value: number;
  }
  
  interface Duration {
    text: string;
    value: number;
  }
  
  enum TravelMode {
    DRIVING = 'DRIVING',
    BICYCLING = 'BICYCLING',
    TRANSIT = 'TRANSIT',
    WALKING = 'WALKING'
  }
  
  enum UnitSystem {
    IMPERIAL = 0,
    METRIC = 1
  }
  
  enum TransitMode {
    BUS = 'BUS',
    RAIL = 'RAIL',
    SUBWAY = 'SUBWAY',
    TRAIN = 'TRAIN',
    TRAM = 'TRAM'
  }
  
  enum TransitRoutePreference {
    FEWER_TRANSFERS = 'FEWER_TRANSFERS',
    LESS_WALKING = 'LESS_WALKING'
  }
  
  enum TrafficModel {
    BEST_GUESS = 'BEST_GUESS',
    OPTIMISTIC = 'OPTIMISTIC',
    PESSIMISTIC = 'PESSIMISTIC'
  }
  
  namespace places {
    class AutocompleteService {
      getPlacePredictions(request: AutocompletionRequest): Promise<AutocompletionResponse>;
    }
    
    interface AutocompletionRequest {
      input: string;
      bounds?: LatLngBounds;
      location?: LatLng;
      radius?: number;
      types?: string[];
      componentRestrictions?: ComponentRestrictions;
    }
    
    interface AutocompletionResponse {
      predictions: AutocompletePrediction[];
    }
    
    interface AutocompletePrediction {
      description: string;
      place_id: string;
      structured_formatting: {
        main_text: string;
        main_text_matched_substrings: PredictionSubstring[];
        secondary_text: string;
      };
      matched_substrings: PredictionSubstring[];
      terms: PredictionTerm[];
    }
    
    interface PredictionSubstring {
      length: number;
      offset: number;
    }
    
    interface PredictionTerm {
      offset: number;
      value: string;
    }
    
    interface ComponentRestrictions {
      country: string | string[];
    }
    
    class PlacesService {
      constructor(attrContainer: Node | Map);
      getDetails(request: PlaceDetailsRequest, callback: (result: PlaceResult, status: PlacesServiceStatus) => void): void;
    }
    
    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
      sessionToken?: any;
    }
    
    interface PlaceResult {
      address_components?: any[];
      adr_address?: string;
      formatted_address?: string;
      geometry?: PlaceGeometry;
      name?: string;
      place_id?: string;
      url?: string;
      vicinity?: string;
    }
    
    interface PlaceGeometry {
      location: LatLng;
    }
    
    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      NOT_FOUND = 'NOT_FOUND'
    }
  }
}