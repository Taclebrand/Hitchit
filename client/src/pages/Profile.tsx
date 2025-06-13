import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CarIcon, TruckIcon, SettingsIcon, HistoryIcon, UserCheck } from '@/lib/icons';
import { User, Mail, Calendar, Star, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Profile: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isDriverRegistered, setIsDriverRegistered] = useState(false);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    // Check if user is registered as a driver when component mounts
    const driverStatus = localStorage.getItem("isDriver") === "true";
    setIsDriverRegistered(driverStatus);
    
    // If they're registered as a driver, they might be in driver mode
    if (driverStatus) {
      const activeMode = localStorage.getItem("activeMode") || "rider";
      setIsDriverMode(activeMode === "driver");
    }
  }, []);
  
  const driverStats = {
    status: 'Active',
    earnings: '$1,245.50',
    rating: 4.9,
    completedRides: 85,
    hoursOnline: 120,
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: '2020',
      color: 'Silver',
      licensePlate: 'ABC 123'
    }
  };
  
  const handleNavigate = (path: string) => {
    setLocation(path);
  };
  
  const handleDriverModeToggle = () => {
    // Check if user is already registered as a driver
    if (!isDriverMode && !isDriverRegistered) {
      // If switching to driver mode and not registered as a driver, redirect to driver signup
      setLocation('/driver-signup');
      return;
    }
    
    // Otherwise toggle the mode and save it
    const newMode = !isDriverMode;
    setIsDriverMode(newMode);
    localStorage.setItem("activeMode", newMode ? "driver" : "rider");
  };
  
  return (
    <AppLayout>
      <div className="p-4 safe-area-top flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleNavigate('/notifications')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 relative"
            >
              <Bell width={20} height={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </button>
            <button 
              onClick={() => handleNavigate('/settings')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
            >
              <SettingsIcon width={20} height={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* User Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {currentUser?.displayName || 'User'}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{currentUser?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Member since {currentUser?.metadata?.creationTime 
                        ? formatDistanceToNow(new Date(currentUser.metadata.creationTime), { addSuffix: false })
                        : 'recently'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={currentUser?.emailVerified ? "default" : "secondary"}>
                    {currentUser?.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <p className="font-mono text-xs mt-1 break-all">{currentUser?.uid}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Sign In:</span>
                  <p className="mt-1">
                    {currentUser?.metadata?.lastSignInTime 
                      ? formatDistanceToNow(new Date(currentUser.metadata.lastSignInTime), { addSuffix: true })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Driver Mode Toggle */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  isDriverMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isDriverMode ? <CarIcon width={20} height={20} /> : <TruckIcon width={20} height={20} />}
                </div>
                <div>
                  <h3 className="font-medium">{isDriverMode ? 'Driver Mode' : 'Rider Mode'}</h3>
                  <p className="text-sm text-gray-500">
                    {isDriverMode 
                      ? 'You are currently in driver mode' 
                      : 'Switch to driver mode to start accepting rides'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isDriverMode}
                onCheckedChange={handleDriverModeToggle}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant="outline"
              className="py-6 bg-white border-gray-200 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/history')}
            >
              <HistoryIcon width={24} height={24} className="text-primary" />
              <span>Trip History</span>
            </Button>
            <Button
              variant="outline"
              className="py-6 bg-white border-gray-200 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/progress')}
            >
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Your Progress</span>
            </Button>
          </div>
          
          {/* Driver Registration Card (show when not registered) */}
          {!isDriverRegistered && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                    <CarIcon width={20} height={20} />
                  </div>
                  <h3 className="font-medium">Become a Driver</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-4">
                  Earn extra money by driving passengers or delivering packages in your spare time.
                </p>
                <Button 
                  onClick={() => setLocation('/driver-signup')} 
                  className="w-full"
                >
                  Sign Up as Driver
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Driver Stats (show only in driver mode) */}
          {isDriverMode && isDriverRegistered && driverStats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <h2 className="px-4 py-3 font-medium text-gray-800 bg-gray-50 border-b border-gray-100">
                Driver Stats
              </h2>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{driverStats.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="font-medium">{driverStats.earnings}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver Rating</p>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{driverStats.rating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Rides</p>
                  <p className="font-medium">{driverStats.completedRides}</p>
                </div>
              </div>
              
              <div className="px-4 py-3 border-t border-gray-100">
                <h3 className="font-medium mb-2">Vehicle Information</h3>
                <div className="text-sm">
                  <p className="text-gray-700">
                    <span className="text-gray-500">Vehicle: </span>
                    {driverStats.vehicle.year} {driverStats.vehicle.make} {driverStats.vehicle.model}, {driverStats.vehicle.color}
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">License Plate: </span>
                    {driverStats.vehicle.licensePlate}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => setLocation('/history')}
                >
                  <HistoryIcon width={24} height={24} />
                  <span className="text-sm">Trip History</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => setLocation('/settings')}
                >
                  <SettingsIcon width={24} height={24} />
                  <span className="text-sm">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;