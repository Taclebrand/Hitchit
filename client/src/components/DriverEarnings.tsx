import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, TrendingUp, Wallet, Download, Clock, CheckCircle } from "lucide-react";

const withdrawalSchema = z.object({
  amount: z.number().min(20, "Minimum withdrawal amount is $20"),
  bankAccount: z.string().min(4, "Bank account last 4 digits required"),
});

interface DriverEarning {
  id: number;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

interface DriverWithdrawal {
  id: number;
  amount: number;
  status: string;
  bankAccount: string;
  processedAt?: string;
  createdAt: string;
}

export function DriverEarnings() {
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      bankAccount: "",
    },
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["/api/driver/earnings"],
    retry: false,
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/driver/withdrawals"],
    retry: false,
  });

  const requestWithdrawal = useMutation({
    mutationFn: async (data: z.infer<typeof withdrawalSchema>) => {
      const token = localStorage.getItem("authToken");
      const response = await apiRequest("POST", "/api/driver/withdraw", data, {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/withdrawals"] });
      setShowWithdrawForm(false);
      form.reset();
      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal request has been submitted and will be processed within 1-3 business days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Failed to process withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof withdrawalSchema>) => {
    requestWithdrawal.mutate(values);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      available: { variant: "default" as const, label: "Available" },
      withdrawn: { variant: "outline" as const, label: "Withdrawn" },
      processing: { variant: "secondary" as const, label: "Processing" },
      completed: { variant: "default" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (earningsLoading || withdrawalsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const availableAmount = earningsData?.availableAmount || 0;
  const canWithdraw = earningsData?.canWithdraw || false;
  const earnings = earningsData?.earnings || [];
  const withdrawals = withdrawalsData?.withdrawals || [];

  return (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(availableAmount)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(earnings.reduce((sum: number, earning: DriverEarning) => sum + earning.netAmount, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">{earnings.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Withdraw Earnings
            {canWithdraw && !showWithdrawForm && (
              <Button
                onClick={() => setShowWithdrawForm(true)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Request Withdrawal
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {canWithdraw 
              ? "You can withdraw your available earnings. Minimum withdrawal amount is $20."
              : availableAmount < 20 
                ? `You need at least $20 to withdraw. Current balance: ${formatCurrency(availableAmount)}`
                : "Withdrawal not available at this time."
            }
          </CardDescription>
        </CardHeader>
        {showWithdrawForm && (
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="20.00"
                          min={20}
                          max={availableAmount}
                          step={0.01}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        Available: {formatCurrency(availableAmount)}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account (Last 4 digits)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234"
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={requestWithdrawal.isPending}
                    className="flex-1"
                  >
                    {requestWithdrawal.isPending ? "Processing..." : "Request Withdrawal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* Recent Withdrawals */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
            <CardDescription>
              Your withdrawal history and status updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.map((withdrawal: DriverWithdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bank •••• {withdrawal.bankAccount} • {formatDate(withdrawal.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.processedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Processed {formatDate(withdrawal.processedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            Detailed breakdown of your trip earnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings yet</p>
              <p className="text-sm">Complete trips to start earning money</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning: DriverEarning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">
                        Trip Earning
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(earning.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(earning.netAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Gross: {formatCurrency(earning.amount)} • Fee: {formatCurrency(earning.platformFee)}
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(earning.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}