import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Building2, 
  Shield, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowUpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PaymentMethod {
  id: number;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: string;
}

interface DriverEarnings {
  available: number;
  pending: number;
  total: number;
}

interface PaymentSetupProps {
  userType: 'driver' | 'rider' | 'shipper';
  userId: number;
}

export const PaymentSetup: React.FC<PaymentSetupProps> = ({ userType, userId }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newCard, setNewCard] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: ''
  });
  const [newBank, setNewBank] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    bankName: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-methods');
      return response.json();
    }
  });

  // Fetch driver earnings (only for drivers)
  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ['/api/driver/earnings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/driver/earnings');
      return response.json();
    },
    enabled: userType === 'driver'
  });

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/payment-methods', paymentData);
      if (!response.ok) throw new Error('Failed to add payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setShowAddCard(false);
      setShowAddBank(false);
      setNewCard({ number: '', expiryMonth: '', expiryYear: '', cvc: '', name: '' });
      setNewBank({ accountNumber: '', routingNumber: '', accountType: 'checking', bankName: '' });
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive"
      });
    }
  });

  // Withdraw earnings mutation (drivers only)
  const withdrawMutation = useMutation({
    mutationFn: async (withdrawalData: any) => {
      const response = await apiRequest('POST', '/api/driver/withdraw', withdrawalData);
      if (!response.ok) throw new Error('Failed to process withdrawal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/earnings'] });
      setWithdrawAmount('');
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    }
  });

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiRequest('PUT', `/api/payment-methods/${methodId}/default`);
      if (!response.ok) throw new Error('Failed to set default');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Default Payment Updated",
        description: "Your default payment method has been updated.",
      });
    }
  });

  // Delete payment method
  const deleteMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiRequest('DELETE', `/api/payment-methods/${methodId}`);
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been removed.",
      });
    }
  });

  const handleAddCard = () => {
    if (!newCard.number || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvc || !newCard.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all card details",
        variant: "destructive"
      });
      return;
    }

    addPaymentMethodMutation.mutate({
      type: 'card',
      cardNumber: newCard.number,
      expiryMonth: parseInt(newCard.expiryMonth),
      expiryYear: parseInt(newCard.expiryYear),
      cvc: newCard.cvc,
      cardholderName: newCard.name
    });
  };

  const handleAddBank = () => {
    if (!newBank.accountNumber || !newBank.routingNumber || !newBank.bankName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank details",
        variant: "destructive"
      });
      return;
    }

    addPaymentMethodMutation.mutate({
      type: 'bank',
      accountNumber: newBank.accountNumber,
      routingNumber: newBank.routingNumber,
      accountType: newBank.accountType,
      bankName: newBank.bankName
    });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 20) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is $20",
        variant: "destructive"
      });
      return;
    }

    if (amount > (earnings?.available || 0)) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough available earnings",
        variant: "destructive"
      });
      return;
    }

    const defaultBankAccount = paymentMethods.find((method: PaymentMethod) => 
      method.type === 'bank' && method.isDefault
    );

    if (!defaultBankAccount) {
      toast({
        title: "No Bank Account",
        description: "Please add a bank account for withdrawals",
        variant: "destructive"
      });
      return;
    }

    withdrawMutation.mutate({
      amount,
      bankAccount: defaultBankAccount.id
    });
  };

  return (
    <div className="space-y-6">
      {/* Driver Earnings Section */}
      {userType === 'driver' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Earnings & Withdrawals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEarnings ? (
              <div className="text-center py-4">Loading earnings...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${earnings?.available?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      ${earnings?.pending?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${earnings?.total?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">Total Earned</div>
                  </div>
                </div>

                <Separator />

                {/* Withdrawal Section */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center space-x-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Withdraw Earnings</span>
                  </h4>
                  
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Amount (min $20)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="20"
                        step="0.01"
                      />
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending || !withdrawAmount || parseFloat(withdrawAmount) < 20}
                    >
                      {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Withdrawals are processed within 1-3 business days. Minimum amount: $20.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>
                {userType === 'driver' ? 'Bank Accounts' : 'Payment Methods'}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => userType === 'driver' ? setShowAddBank(true) : setShowAddCard(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {userType === 'driver' ? 'Bank' : 'Card'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMethods ? (
            <div className="text-center py-4">Loading payment methods...</div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No {userType === 'driver' ? 'bank accounts' : 'payment methods'} added yet
              </p>
              <Button
                className="mt-2"
                onClick={() => userType === 'driver' ? setShowAddBank(true) : setShowAddCard(true)}
              >
                Add {userType === 'driver' ? 'Bank Account' : 'Payment Method'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method: PaymentMethod) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {method.type === 'card' ? (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {method.type === 'card' 
                          ? `${method.brand} •••• ${method.last4}`
                          : `${method.bankName} •••• ${method.last4}`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.type === 'card' 
                          ? `Expires ${method.expiryMonth}/${method.expiryYear}`
                          : `${method.accountType} account`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {method.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultMutation.mutate(method.id)}
                      disabled={method.isDefault}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(method.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Modal */}
      {showAddCard && (
        <Card>
          <CardHeader>
            <CardTitle>Add Credit/Debit Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Card Number"
              value={newCard.number}
              onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
              maxLength={19}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="MM"
                value={newCard.expiryMonth}
                onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                maxLength={2}
              />
              <Input
                placeholder="YYYY"
                value={newCard.expiryYear}
                onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                maxLength={4}
              />
            </div>
            
            <Input
              placeholder="CVC"
              value={newCard.cvc}
              onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value })}
              maxLength={4}
            />
            
            <Input
              placeholder="Cardholder Name"
              value={newCard.name}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
            />
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAddCard}
                disabled={addPaymentMethodMutation.isPending}
                className="flex-1"
              >
                {addPaymentMethodMutation.isPending ? 'Adding...' : 'Add Card'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddCard(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Bank Modal */}
      {showAddBank && (
        <Card>
          <CardHeader>
            <CardTitle>Add Bank Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Bank Name"
              value={newBank.bankName}
              onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
            />
            
            <Input
              placeholder="Account Number"
              value={newBank.accountNumber}
              onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
            />
            
            <Input
              placeholder="Routing Number"
              value={newBank.routingNumber}
              onChange={(e) => setNewBank({ ...newBank, routingNumber: e.target.value })}
            />
            
            <select
              value={newBank.accountType}
              onChange={(e) => setNewBank({ ...newBank, accountType: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAddBank}
                disabled={addPaymentMethodMutation.isPending}
                className="flex-1"
              >
                {addPaymentMethodMutation.isPending ? 'Adding...' : 'Add Bank Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddBank(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentSetup;