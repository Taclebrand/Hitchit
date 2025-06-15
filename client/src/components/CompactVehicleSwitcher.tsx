import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car, ChevronDown, Zap } from "lucide-react";

interface Vehicle {
  id: number;
  type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}

interface CompactVehicleSwitcherProps {
  className?: string;
}

export default function CompactVehicleSwitcher({ className = "" }: CompactVehicleSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  // Set the first vehicle as active on initial load
  useEffect(() => {
    if (vehicles.length > 0 && !activeVehicleId) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  // Switch active vehicle mutation
  const switchVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => 
      apiRequest('PUT', `/api/users/active-vehicle/${vehicleId}`).then(res => res.json()),
    onSuccess: (data, vehicleId) => {
      setActiveVehicleId(vehicleId);
      const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
      setIsOpen(false);
      
      toast({
        title: "Vehicle Switched",
        description: `Now using ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`,
        duration: 2000
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: () => {
      toast({
        title: "Switch Failed",
        description: "Could not switch vehicle",
        variant: "destructive"
      });
    }
  });

  const activeVehicle = vehicles.find((v: Vehicle) => v.id === activeVehicleId);

  // Don't render if no vehicles or only one vehicle
  if (vehicles.length <= 1) {
    return null;
  }

  const handleVehicleSelect = (vehicleId: number) => {
    if (vehicleId !== activeVehicleId) {
      switchVehicleMutation.mutate(vehicleId);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white shadow-sm border-gray-200 hover:bg-gray-50"
        disabled={switchVehicleMutation.isPending}
      >
        <Car className="h-4 w-4 text-blue-500" />
        {activeVehicle ? (
          <span className="text-sm font-medium truncate max-w-32">
            {activeVehicle.year} {activeVehicle.make}
          </span>
        ) : (
          <span className="text-sm">Select Vehicle</span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <Card className="absolute top-full left-0 mt-2 z-50 w-80 shadow-xl border border-gray-200">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Quick Switch</span>
                </div>
                
                {vehicles.map((vehicle: Vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      vehicle.id === activeVehicleId
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    disabled={switchVehicleMutation.isPending}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        vehicle.id === activeVehicleId ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Car className={`h-4 w-4 ${
                          vehicle.id === activeVehicleId ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{vehicle.color}</span>
                          <span>•</span>
                          <span>{vehicle.licensePlate}</span>
                          <span>•</span>
                          <span>{vehicle.type}</span>
                        </div>
                      </div>
                      
                      {vehicle.id === activeVehicleId && (
                        <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-3 pt-2 border-t text-center">
                <span className="text-xs text-gray-500">
                  {vehicles.length} vehicles available
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}