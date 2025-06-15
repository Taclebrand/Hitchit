import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Car } from "lucide-react";

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

interface ActiveVehicleDisplayProps {
  compact?: boolean;
  className?: string;
}

export default function ActiveVehicleDisplay({ compact = false, className = "" }: ActiveVehicleDisplayProps) {
  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  // For now, use the first vehicle as active (can be enhanced with actual active vehicle tracking)
  const activeVehicle = vehicles[0];

  if (!activeVehicle) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 text-center">
          <Car className="h-6 w-6 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No active vehicle</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-3">
          <Car className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${compact ? 'text-sm' : ''}`}>
              {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
            </h3>
            <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              {activeVehicle.color} • {activeVehicle.licensePlate}
            </p>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
            Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}