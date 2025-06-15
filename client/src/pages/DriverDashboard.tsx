import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Download,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import VehicleSwitcher from "@/components/VehicleSwitcher";
import ActiveVehicleDisplay from "@/components/ActiveVehicleDisplay";

interface PaymentMethod {
  id: number;
  type: string;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Earning {
  id: number;
  tripId: number;
  grossAmount: string;
  platformFee: string;
  netAmount: string;
  status: string;
  createdAt: string;
}

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

export default function DriverDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    lastFour: '',
    brand: 'visa',
    expiryMonth: '',
    expiryYear: ''
  });

  // Vehicle registration form
  const [vehicleForm, setVehicleForm] = useState({
    type: 'Sedan',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    seats: 4
  });

  // Fetch driver earnings
  const { data: earningsData } = useQuery({
    queryKey: ['/api/driver/earnings'],
    queryFn: () => apiRequest('GET', '/api/driver/earnings').then(res => res.json())
  });

  // Fetch payment methods
  const { data: paymentData } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: () => apiRequest('GET', '/api/payment-methods').then(res => res.json())
  });

  // Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  // Add test earnings mutation
  const addTestEarningsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/driver/add-test-earnings', {}).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/earnings'] });
      toast({
        title: "Success",
        description: "Test earnings added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add test earnings",
        variant: "destructive"
      });
    }
  });

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/payment-methods', {
      type: 'card',
      stripePaymentMethodId: `pm_test_${Date.now()}`,
      ...data
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setNewPaymentMethod({ lastFour: '', brand: 'visa', expiryMonth: '', expiryYear: '' });
      toast({
        title: "Success",
        description: "Payment method added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      });
    }
  });

  // Register vehicle mutation
  const registerVehicleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vehicles', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles/user/1'] });
      setVehicleForm({
        type: 'Sedan',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        licensePlate: '',
        seats: 4
      });
      toast({
        title: "Success",
        description: "Vehicle registered successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register vehicle",
        variant: "destructive"
      });
    }
  });

  // Process withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => apiRequest('POST', '/api/driver-payout', { amount }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/earnings'] });
      setWithdrawAmount('');
      toast({
        title: "Success",
        description: "Withdrawal processed successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive"
      });
    }
  });

  const earnings: Earning[] = earningsData?.earnings || [];
  const availableAmount = earningsData?.availableAmount || 0;
  const paymentMethods: PaymentMethod[] = paymentData?.paymentMethods || [];
  const vehicles: Vehicle[] = vehiclesData || [];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 20) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is $20",
        variant: "destructive"
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.lastFour || !newPaymentMethod.expiryMonth || !newPaymentMethod.expiryYear) {
      toast({
        title: "Error",
        description: "Please fill in all payment method details",
        variant: "destructive"
      });
      return;
    }
    addPaymentMethodMutation.mutate({
      ...newPaymentMethod,
      expiryMonth: parseInt(newPaymentMethod.expiryMonth),
      expiryYear: parseInt(newPaymentMethod.expiryYear)
    });
  };

  const handleRegisterVehicle = () => {
    if (!vehicleForm.make || !vehicleForm.model || !vehicleForm.color || !vehicleForm.licensePlate) {
      toast({
        title: "Error",
        description: "Please fill in all vehicle details",
        variant: "destructive"
      });
      return;
    }
    registerVehicleMutation.mutate(vehicleForm);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your vehicles, earnings, and payments</p>
        </div>

        {/* Active Vehicle Display */}
        <ActiveVehicleDisplay />

        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${availableAmount.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{earnings.length}</div>
                  <p className="text-xs text-muted-foreground">Completed trips</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Withdrawal</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Amount ($20 min)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || availableAmount < 20}
                    className="w-full"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Earnings History</CardTitle>
                <Button 
                  onClick={() => addTestEarningsMutation.mutate()}
                  disabled={addTestEarningsMutation.isPending}
                  variant="outline"
                >
                  Add Test Earnings
                </Button>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No earnings yet</p>
                ) : (
                  <div className="space-y-2">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Trip #{earning.tripId}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(earning.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${earning.netAmount}</p>
                          <Badge variant={earning.status === 'available' ? 'default' : 'secondary'}>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            {/* Vehicle Profile Switcher */}
            <VehicleSwitcher />

            <Card>
              <CardHeader>
                <CardTitle>Register New Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Make</label>
                    <Input
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                      placeholder="Toyota"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      placeholder="Camry"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Input
                      type="number"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({...vehicleForm, year: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <Input
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                      placeholder="Blue"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">License Plate</label>
                    <Input
                      value={vehicleForm.licensePlate}
                      onChange={(e) => setVehicleForm({...vehicleForm, licensePlate: e.target.value})}
                      placeholder="ABC123"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Seats</label>
                    <Input
                      type="number"
                      value={vehicleForm.seats}
                      onChange={(e) => setVehicleForm({...vehicleForm, seats: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleRegisterVehicle}
                  disabled={registerVehicleMutation.isPending}
                  className="w-full"
                >
                  {registerVehicleMutation.isPending ? "Registering..." : "Register Vehicle"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No vehicles registered</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Car className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="font-medium">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {vehicle.color} • {vehicle.licensePlate} • {vehicle.seats} seats
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Last 4 Digits</label>
                    <Input
                      value={newPaymentMethod.lastFour}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, lastFour: e.target.value})}
                      placeholder="4242"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Brand</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={newPaymentMethod.brand}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, brand: e.target.value})}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiry Month</label>
                    <Input
                      type="number"
                      value={newPaymentMethod.expiryMonth}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryMonth: e.target.value})}
                      placeholder="12"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiry Year</label>
                    <Input
                      type="number"
                      value={newPaymentMethod.expiryYear}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryYear: e.target.value})}
                      placeholder="2025"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddPaymentMethod}
                  disabled={addPaymentMethodMutation.isPending}
                  className="w-full"
                >
                  {addPaymentMethodMutation.isPending ? "Adding..." : "Add Payment Method"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No payment methods saved</p>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">
                              {method.brand.toUpperCase()} •••• {method.lastFour}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Stripe API keys configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Payment processing enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Driver payouts configured</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Test Mode Active</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    All transactions are in test mode. Use test credentials for safe testing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}