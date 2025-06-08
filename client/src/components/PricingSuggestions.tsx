import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, TrendingUp, MapPin, Clock, Calculator } from "lucide-react";

const pricingRequestSchema = z.object({
  originLat: z.number(),
  originLng: z.number(), 
  destinationLat: z.number(),
  destinationLng: z.number(),
});

interface PricingSuggestion {
  distance: number;
  duration: number;
  baseFare: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
  demandMultiplier: number;
}

interface PricingSuggestionsProps {
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  onPriceSelect?: (price: number) => void;
}

export function PricingSuggestions({ 
  originCoords, 
  destinationCoords, 
  onPriceSelect 
}: PricingSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof pricingRequestSchema>>({
    resolver: zodResolver(pricingRequestSchema),
    defaultValues: {
      originLat: originCoords?.lat || 0,
      originLng: originCoords?.lng || 0,
      destinationLat: destinationCoords?.lat || 0,
      destinationLng: destinationCoords?.lng || 0,
    },
  });

  const getPricingSuggestion = useMutation({
    mutationFn: async (data: z.infer<typeof pricingRequestSchema>) => {
      const token = localStorage.getItem("authToken");
      const response = await apiRequest("POST", "/api/pricing/suggest", data, {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.suggestion) {
        setSuggestion({
          distance: parseFloat(data.suggestion.distance),
          duration: data.suggestion.duration,
          baseFare: parseFloat(data.suggestion.baseFare),
          suggestedMinPrice: parseFloat(data.suggestion.suggestedMinPrice),
          suggestedMaxPrice: parseFloat(data.suggestion.suggestedMaxPrice),
          demandMultiplier: parseFloat(data.suggestion.demandMultiplier),
        });
        toast({
          title: "Pricing suggestion updated",
          description: "Based on real destination data and current market conditions.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get pricing suggestion",
        variant: "destructive",
      });
    },
  });

  const handleGetSuggestion = () => {
    if (originCoords && destinationCoords) {
      getPricingSuggestion.mutate({
        originLat: originCoords.lat,
        originLng: originCoords.lng,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDistance = (miles: number) => {
    return `${miles.toFixed(1)} miles`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const generatePriceOptions = () => {
    if (!suggestion) return [];
    
    const { suggestedMinPrice, suggestedMaxPrice } = suggestion;
    const range = suggestedMaxPrice - suggestedMinPrice;
    
    return [
      {
        label: "Competitive",
        price: suggestedMinPrice,
        description: "Lower price to attract more riders",
        color: "bg-green-50 border-green-200 text-green-800",
      },
      {
        label: "Recommended",
        price: suggestedMinPrice + (range * 0.5),
        description: "Balanced price based on market data",
        color: "bg-blue-50 border-blue-200 text-blue-800",
      },
      {
        label: "Premium",
        price: suggestedMaxPrice,
        description: "Higher price for premium service",
        color: "bg-purple-50 border-purple-200 text-purple-800",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Get Pricing Suggestion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Smart Pricing Assistant
          </CardTitle>
          <CardDescription>
            Get data-driven pricing suggestions based on real destination data and market conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {originCoords && destinationCoords ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Route configured</span>
                </div>
              </div>
              <Button
                onClick={handleGetSuggestion}
                disabled={getPricingSuggestion.isPending}
                className="w-full"
              >
                {getPricingSuggestion.isPending ? "Calculating..." : "Get Pricing Suggestion"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Set pickup and destination to get pricing suggestions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Suggestion Results */}
      {suggestion && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Recommendation</CardTitle>
            <CardDescription>
              Based on {formatDistance(suggestion.distance)} trip taking approximately {formatDuration(suggestion.duration)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trip Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                <div className="text-sm font-medium">{formatDistance(suggestion.distance)}</div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                <div className="text-sm font-medium">{formatDuration(suggestion.duration)}</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                <div className="text-sm font-medium">{formatCurrency(suggestion.baseFare)}</div>
                <div className="text-xs text-muted-foreground">Base Fare</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                <div className="text-sm font-medium">{suggestion.demandMultiplier}x</div>
                <div className="text-xs text-muted-foreground">Demand</div>
              </div>
            </div>

            {/* Price Options */}
            <div className="space-y-3">
              <h3 className="font-medium">Choose Your Price</h3>
              <div className="grid gap-3">
                {generatePriceOptions().map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPrice === option.price
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedPrice(option.price);
                      onPriceSelect?.(option.price);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={option.color}>
                            {option.label}
                          </Badge>
                          <span className="font-semibold text-lg">
                            {formatCurrency(option.price)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                      {selectedPrice === option.price && (
                        <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Price Input */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Or Set Custom Price</h4>
              <div className="flex gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min={suggestion.suggestedMinPrice * 0.8}
                  max={suggestion.suggestedMaxPrice * 1.5}
                  placeholder="Enter custom price"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setSelectedPrice(value);
                      onPriceSelect?.(value);
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="outline">Set Price</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended range: {formatCurrency(suggestion.suggestedMinPrice)} - {formatCurrency(suggestion.suggestedMaxPrice)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPrice && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium">Price Set: {formatCurrency(selectedPrice)}</div>
                <div className="text-sm text-muted-foreground">
                  You'll earn approximately {formatCurrency(selectedPrice * 0.85)} after platform fees
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}