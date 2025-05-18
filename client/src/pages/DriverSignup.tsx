import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CarIcon, LicenseIcon, UserCheck } from "@/lib/icons";

const vehicleSchema = z.object({
  make: z.string().min(2, "Make is required"),
  model: z.string().min(2, "Model is required"),
  year: z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
  color: z.string().min(2, "Color is required"),
  licensePlate: z.string().min(2, "License plate is required"),
  seats: z.coerce.number().min(1).max(7, "Maximum 7 seats allowed"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const driverLicenseSchema = z.object({
  licenseNumber: z.string().min(4, "License number is required"),
  expiryDate: z.string().refine(data => !isNaN(Date.parse(data)), {
    message: "Valid expiry date is required",
  }),
});

type DriverLicenseFormValues = z.infer<typeof driverLicenseSchema>;

const DriverSignup = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'vehicle' | 'license' | 'complete'>('vehicle');
  const [vehicleData, setVehicleData] = useState<VehicleFormValues | null>(null);

  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      licensePlate: "",
      seats: 4,
    },
  });

  const licenseForm = useForm<DriverLicenseFormValues>({
    resolver: zodResolver(driverLicenseSchema),
    defaultValues: {
      licenseNumber: "",
      expiryDate: "",
    },
  });

  const onVehicleSubmit = async (data: VehicleFormValues) => {
    setIsLoading(true);
    try {
      // Store vehicle data for the next step
      setVehicleData(data);
      
      // Proceed to next step
      setStep('license');
      toast({
        title: "Vehicle information saved",
        description: "Now please provide your driver license details",
      });
    } catch (error) {
      console.error("Error submitting vehicle data:", error);
      toast({
        title: "Error",
        description: "Failed to save vehicle information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onLicenseSubmit = async (data: DriverLicenseFormValues) => {
    if (!vehicleData) {
      toast({
        title: "Error",
        description: "Vehicle information is missing. Please go back and try again.",
        variant: "destructive",
      });
      setStep('vehicle');
      return;
    }

    setIsLoading(true);
    try {
      // Get user ID (in real app, this would come from auth state)
      const userId = localStorage.getItem("userId") || "1";
      
      // First register the vehicle
      const vehicleResponse = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vehicleData,
          userId: parseInt(userId),
        }),
      });

      if (!vehicleResponse.ok) {
        throw new Error("Failed to register vehicle");
      }

      const vehicleResult = await vehicleResponse.json();
      
      // Mark registration as complete
      setStep('complete');
      localStorage.setItem("isDriver", "true");
      
      toast({
        title: "Success!",
        description: "Your driver account has been set up successfully",
      });
      
      // Redirect to trips page after a brief delay
      setTimeout(() => {
        setLocation("/trips");
      }, 2000);
    } catch (error) {
      console.error("Error registering as driver:", error);
      toast({
        title: "Error",
        description: "Failed to complete driver registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-lg mx-auto">
      {step === 'vehicle' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
              <CarIcon className="mr-2 h-5 w-5" /> Register Your Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...vehicleForm}>
              <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Camry" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="Silver" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Seats</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={7} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => setLocation("/profile")}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'license' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
              <LicenseIcon className="mr-2 h-5 w-5" /> Driver License Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...licenseForm}>
              <form onSubmit={licenseForm.handleSubmit(onLicenseSubmit)} className="space-y-6">
                <FormField
                  control={licenseForm.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="DL12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={licenseForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Complete Registration"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('vehicle')}>
              Back
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/profile")}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Registration Complete!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="bg-green-100 text-green-600 rounded-full p-6 mb-4">
              <UserCheck className="w-16 h-16" />
            </div>
            <p className="mb-4">Your driver account has been set up successfully. You can now create trips and start earning!</p>
            <Button onClick={() => setLocation("/create-trip")} className="mt-4">
              Create Your First Trip
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverSignup;