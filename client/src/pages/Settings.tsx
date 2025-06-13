import React, { useState } from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings as SettingsIcon, Moon, Sun, Type, Eye, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import QuickProfileCustomization from '@/components/QuickProfileCustomization';

const Settings: React.FC = () => {
  const [, setLocation] = useLocation();
  const { currentUser, userDocument } = useAuth();
  const { 
    highContrast, 
    toggleHighContrast, 
    fontSize, 
    setFontSize, 
    reducedMotion, 
    toggleReducedMotion 
  } = useAccessibility();
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
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <SettingsIcon className="w-8 h-8 text-blue-600 mr-3 gear-spin" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>

          {/* Quick Profile Customization */}
          <QuickProfileCustomization />

          {/* Accessibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">High Contrast Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Improve visibility with enhanced contrast
                  </div>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={toggleHighContrast}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="font-medium">Font Size</div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={fontSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFontSize(size)}
                      className="capitalize"
                    >
                      <Type className="w-3 h-3 mr-1" />
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Reduce Motion</div>
                  <div className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </div>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={toggleReducedMotion}
                />
              </div>
            </CardContent>
          </Card>
          
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
          
          {/* AI Features */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <h2 className="px-4 py-3 font-medium text-gray-800 bg-gray-50 border-b border-gray-100">
              AI Features
            </h2>
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setLocation('/ai-features')}>
                <div>
                  <h3 className="font-medium">AI-Powered Tools</h3>
                  <p className="text-sm text-gray-500">Vehicle verification, voice assistant, trip matching, and personalization</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

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