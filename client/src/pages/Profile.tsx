import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CarIcon, TruckIcon, SettingsIcon, HistoryIcon, UserCheck } from '@/lib/icons';

const Profile: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isDriverRegistered, setIsDriverRegistered] = useState(false);
  
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
  
  // Mock user data - in a real app, this would come from the API or context
  const user = {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.8,
    totalRides: 68,
    memberSince: 'January 2023',
    favoriteLocations: [
      { name: 'Home', address: '123 Main St, New York, NY' },
      { name: 'Work', address: '456 Business Ave, New York, NY' },
      { name: 'Gym', address: '789 Fitness Blvd, New York, NY' }
    ]
  };
  
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
          <button 
            onClick={() => handleNavigate('/settings')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <SettingsIcon width={20} height={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* User Info Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{user.rating}</span>
                  <span className="mx-2">•</span>
                  <span>{user.totalRides} trips</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Member since {user.memberSince}</p>
              </div>
            </div>
          </div>
          
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
          
          {/* Favorite Locations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="font-medium text-gray-800">
                Saved Locations
              </h2>
              <Button variant="ghost" size="sm" className="text-primary text-sm h-8">
                Edit
              </Button>
            </div>
            <div className="divide-y divide-gray-100">
              {user.favoriteLocations.map((location, index) => (
                <div key={index} className="p-4 flex">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-600">
                    {location.name === 'Home' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : location.name === 'Work' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 10a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-gray-500">{location.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;