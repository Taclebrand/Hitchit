import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Slider } from '@/components/ui/slider'; // Not implemented yet
import { Switch } from '@/components/ui/switch';
import { DollarSign, TrendingUp, Info, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PricingData {
  basePrice: number;
  perMileRate: number;
  perMinuteRate: number;
  minimumFare: number;
  customPrice?: number;
  useCustomPrice: boolean;
}

interface PricingControlProps {
  distance?: number; // in miles
  estimatedDuration?: number; // in minutes
  serviceType: 'ride' | 'package';
  value: PricingData;
  onChange: (pricing: PricingData) => void;
  readonly?: boolean;
}

export const PricingControl: React.FC<PricingControlProps> = ({
  distance = 0,
  estimatedDuration = 0,
  serviceType,
  value,
  onChange,
  readonly = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Default pricing structure
  const defaultRidePricing = {
    basePrice: 3.50,
    perMileRate: 1.25,
    perMinuteRate: 0.35,
    minimumFare: 7.00
  };

  const defaultPackagePricing = {
    basePrice: 5.00,
    perMileRate: 1.50,
    perMinuteRate: 0.25,
    minimumFare: 8.00
  };

  const defaults = serviceType === 'ride' ? defaultRidePricing : defaultPackagePricing;

  useEffect(() => {
    if (!value.basePrice) {
      onChange({
        ...defaults,
        useCustomPrice: false
      });
    }
  }, [serviceType]);

  const calculateRecommendedPrice = () => {
    const base = value.basePrice || defaults.basePrice;
    const mileRate = value.perMileRate || defaults.perMileRate;
    const minuteRate = value.perMinuteRate || defaults.perMinuteRate;
    const minimum = value.minimumFare || defaults.minimumFare;

    const calculatedPrice = base + (distance * mileRate) + (estimatedDuration * minuteRate);
    return Math.max(calculatedPrice, minimum);
  };

  const recommendedPrice = calculateRecommendedPrice();
  const finalPrice = value.useCustomPrice ? (value.customPrice || recommendedPrice) : recommendedPrice;

  const handlePricingChange = (field: keyof PricingData, newValue: number | boolean) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const applyRecommendedPricing = () => {
    onChange({
      ...value,
      customPrice: recommendedPrice,
      useCustomPrice: true
    });
    toast({
      title: "Recommended Price Applied",
      description: `Set to $${recommendedPrice.toFixed(2)} based on distance and time`,
    });
  };

  if (readonly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Pricing Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Price:</span>
              <span className="text-lg font-bold text-green-600">${finalPrice.toFixed(2)}</span>
            </div>
            
            {distance > 0 && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Base Fare:</span>
                  <span>${value.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance ({distance.toFixed(1)} mi):</span>
                  <span>${(distance * value.perMileRate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time ({estimatedDuration} min):</span>
                  <span>${(estimatedDuration * value.perMinuteRate).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Set Your Price</span>
          </div>
          <Badge variant={value.useCustomPrice ? "default" : "secondary"}>
            {value.useCustomPrice ? "Custom" : "Auto"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Price</span>
            <span className="text-2xl font-bold text-green-600">${finalPrice.toFixed(2)}</span>
          </div>
          
          {distance > 0 && estimatedDuration > 0 && (
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>{distance.toFixed(1)} miles</span>
              <span>•</span>
              <span>{estimatedDuration} minutes</span>
              <span>•</span>
              <span>${(finalPrice / distance).toFixed(2)}/mile</span>
            </div>
          )}
        </div>

        {/* Recommended Price Banner */}
        {!value.useCustomPrice && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <span className="text-sm text-blue-800">
                Recommended: ${recommendedPrice.toFixed(2)}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={applyRecommendedPricing}
              className="text-blue-600 border-blue-200"
            >
              Use This
            </Button>
          </div>
        )}

        {/* Custom Price Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Set Custom Price</span>
            <Info className="h-3 w-3 text-gray-400" />
          </div>
          <Switch
            checked={value.useCustomPrice}
            onCheckedChange={(checked) => handlePricingChange('useCustomPrice', checked)}
          />
        </div>

        {/* Custom Price Input */}
        {value.useCustomPrice && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm">$</span>
              <Input
                type="number"
                step="0.50"
                min={defaults.minimumFare}
                value={value.customPrice || recommendedPrice}
                onChange={(e) => handlePricingChange('customPrice', parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>
                {value.customPrice && value.customPrice > recommendedPrice 
                  ? `${(((value.customPrice - recommendedPrice) / recommendedPrice) * 100).toFixed(0)}% above recommended`
                  : value.customPrice && value.customPrice < recommendedPrice
                  ? `${(((recommendedPrice - value.customPrice) / recommendedPrice) * 100).toFixed(0)}% below recommended`
                  : 'At recommended price'
                }
              </span>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Base Fare</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    step="0.25"
                    value={value.basePrice}
                    onChange={(e) => handlePricingChange('basePrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Per Mile Rate</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    step="0.05"
                    value={value.perMileRate}
                    onChange={(e) => handlePricingChange('perMileRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Per Minute Rate</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    step="0.05"
                    value={value.perMinuteRate}
                    onChange={(e) => handlePricingChange('perMinuteRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Minimum Fare</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    step="0.25"
                    value={value.minimumFare}
                    onChange={(e) => handlePricingChange('minimumFare', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingControl;