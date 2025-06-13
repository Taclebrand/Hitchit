import React, { useState } from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { UserIcon } from '@/lib/icons';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const [, setLocation] = useLocation();
  const { currentUser, userDocument } = useAuth();
  const { toast } = useToast();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [savePaymentInfo, setSavePaymentInfo] = useState(true);
  
  const handleLogout = async () => {
    try {
      await signOutUser();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditProfile = () => {
    setLocation('/profile-edit');
  };
  
  // Setting sections
  const sections = [
    {
      title: 'General',
      settings: [
        {
          id: 'notifications',
          label: 'Push Notifications',
          description: 'Receive notifications about your rides and updates',
          value: notifications,
          onChange: setNotifications
        },
        {
          id: 'location',
          label: 'Location Services',
          description: 'Allow app to access your location',
          value: locationServices,
          onChange: setLocationServices
        },
        {
          id: 'darkMode',
          label: 'Dark Mode',
          description: 'Use dark theme for the app',
          value: darkMode,
          onChange: setDarkMode
        }
      ]
    },
    {
      title: 'Privacy & Security',
      settings: [
        {
          id: 'biometric',
          label: 'Biometric Login',
          description: 'Use fingerprint or face ID to log in',
          value: biometricLogin,
          onChange: setBiometricLogin
        },
        {
          id: 'savePayment',
          label: 'Save Payment Information',
          description: 'Securely store payment details for future rides',
          value: savePaymentInfo,
          onChange: setSavePaymentInfo
        }
      ]
    }
  ];
  
  return (
    <AppLayout>
      <div className="p-4 safe-area-top flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <p className="text-gray-600 text-sm">{user.phone}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-2"
                onClick={handleEditProfile}
              >
                Edit
              </Button>
            </div>
          </div>
          
          {/* Settings Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <h2 className="px-4 py-3 font-medium text-gray-800 bg-gray-50 border-b border-gray-100">
                {section.title}
              </h2>
              <div className="divide-y divide-gray-100">
                {section.settings.map((setting) => (
                  <div key={setting.id} className="p-4 flex items-center justify-between">
                    <div className="mr-4">
                      <h3 className="font-medium">{setting.label}</h3>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <Switch
                      checked={setting.value}
                      onCheckedChange={setting.onChange}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* App Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <h2 className="px-4 py-3 font-medium text-gray-800 bg-gray-50 border-b border-gray-100">
              About
            </h2>
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium">App Version</h3>
                <span className="text-gray-500">1.0.0</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium">Terms of Service</h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium">Privacy Policy</h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            className="w-full py-3 text-red-600 border-red-200 hover:bg-red-50 mb-6"
            onClick={handleLogout}
          >
            Logout
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full py-3 text-gray-500 border-gray-200 mb-6"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;