import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import VehicleSwitcher from "@/components/VehicleSwitcher";
import CompactVehicleSwitcher from "@/components/CompactVehicleSwitcher";
import { Car, Plus, Settings, TrendingUp } from "lucide-react";

export default function VehicleManager() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Manager</h1>
          <p className="text-gray-600 mt-2">Manage your fleet with one-tap switching</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => setLocation('/driver-dashboard')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Full Dashboard</h3>
              <p className="text-sm text-gray-500 mt-1">Complete vehicle management</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation('/driver-registration')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Add Vehicle</h3>
              <p className="text-sm text-gray-500 mt-1">Register new vehicle</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation('/driver-pricing-test')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Pricing Tools</h3>
              <p className="text-sm text-gray-500 mt-1">Optimize your rates</p>
            </CardContent>
          </Card>
        </div>

        {/* Compact Switcher Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Quick Vehicle Switcher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Switch between your vehicles instantly with the compact switcher:
            </p>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Try it:</span>
              <CompactVehicleSwitcher />
            </div>
            <div className="text-sm text-gray-500">
              This switcher appears in your navigation bar for quick access during trips.
            </div>
          </CardContent>
        </Card>

        {/* Full Vehicle Switcher */}
        <VehicleSwitcher />

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Switching Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-sm">One-Tap Switching</h4>
                <p className="text-sm text-gray-600">Click any vehicle to instantly make it your active profile</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-sm">Navigation Access</h4>
                <p className="text-sm text-gray-600">Use the compact switcher in the navigation bar for quick changes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-sm">Automatic Updates</h4>
                <p className="text-sm text-gray-600">Your active vehicle updates across all trip and earnings data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}