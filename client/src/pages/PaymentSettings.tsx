import React from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PaymentSetup from '@/components/PaymentSetup';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSettings: React.FC = () => {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  
  // Determine user type based on localStorage or user properties
  const isDriver = localStorage.getItem("isDriver") === "true";
  const userType = isDriver ? 'driver' : 'rider';

  return (
    <AppLayout>
      <div className="p-4 safe-area-top">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/settings')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Settings</h1>
            <p className="text-sm text-gray-600">
              Manage your {userType === 'driver' ? 'earnings and bank accounts' : 'payment methods'}
            </p>
          </div>
        </div>

        {/* Payment Setup Component */}
        <PaymentSetup 
          userType={userType}
          userId={currentUser?.uid ? parseInt(currentUser.uid) : 1}
        />
      </div>
    </AppLayout>
  );
};

export default PaymentSettings;