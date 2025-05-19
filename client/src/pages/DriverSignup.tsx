import { useState, useRef } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CarIcon, 
  LicenseIcon, 
  UserCheck, 
  PackageIcon, 
  FileUploadIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon 
} from "@/lib/icons";
import { 
  FormStepContainer, 
  AnimatedField, 
  AnimatedTitle, 
  AnimatedButton, 
  SuccessIcon,
  StaggeredChildren
} from "@/components/MicroAnimations";

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
  state: z.string().min(2, "State is required"),
  dob: z.string().refine(data => !isNaN(Date.parse(data)), {
    message: "Valid date of birth is required",
  }),
  licenseImageFront: z.string().optional(),
  licenseImageBack: z.string().optional(),
});

type DriverLicenseFormValues = z.infer<typeof driverLicenseSchema>;

const backgroundCheckSchema = z.object({
  ssn: z.string().min(9, "SSN is required").max(11),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  consentToBackgroundCheck: z.boolean().refine(val => val === true, {
    message: "You must consent to the background check",
  }),
  consentToCriminalCheck: z.boolean().refine(val => val === true, {
    message: "You must consent to the criminal record check",
  }),
  consentToSexOffenderCheck: z.boolean().refine(val => val === true, {
    message: "You must consent to the sex offender registry check",
  }),
});

type BackgroundCheckFormValues = z.infer<typeof backgroundCheckSchema>;

const DriverSignup = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'vehicle' | 'license' | 'verification' | 'background' | 'review' | 'processing' | 'complete'>('vehicle');
  const [vehicleData, setVehicleData] = useState<VehicleFormValues | null>(null);
  const [licenseData, setLicenseData] = useState<DriverLicenseFormValues | null>(null);
  const [backgroundData, setBackgroundData] = useState<BackgroundCheckFormValues | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState({
    identity: false,
    criminal: false,
    sexOffender: false,
    driving: false
  });
  const fileInputRefFront = useRef<HTMLInputElement>(null);
  const fileInputRefBack = useRef<HTMLInputElement>(null);

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
      state: "",
      dob: "",
      licenseImageFront: "",
      licenseImageBack: "",
    },
  });
  
  const backgroundForm = useForm<BackgroundCheckFormValues>({
    resolver: zodResolver(backgroundCheckSchema),
    defaultValues: {
      ssn: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      consentToBackgroundCheck: false,
      consentToCriminalCheck: false,
      consentToSexOffenderCheck: false,
    },
  });

  // Function to handle selfie capture
  const startCamera = async () => {
    try {
      // Check if camera is available through navigator.mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this browser or environment");
      }
      
      if (videoRef.current) {
        // Request camera access with standard constraints
        const constraints = { 
          video: true,
          audio: false
        };
        
        console.log("Requesting camera access...");
        
        // Use a timeout to ensure users have time to see the permission dialog
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Camera access request timed out")), 10000);
        });
        
        // Race between the camera access request and the timeout
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          timeoutPromise
        ]) as MediaStream;
        
        console.log("Camera access granted");
        
        // Set up the video element with the stream
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Error playing video:", e));
        };
        
        setCameraActive(true);
        toast({
          title: "Camera Active",
          description: "Your camera is now active. Position your face in the frame.",
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Could not access your camera.";
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = "Camera access was denied. Please check your browser permissions.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera device was found on your device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Your camera is in use by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "Camera constraints specified are not supported by your device.";
        } else if (error.name === 'SecurityError') {
          errorMessage = "Camera access was blocked due to security restrictions.";
        }
      }
      
      toast({
        title: "Camera Access Issue",
        description: errorMessage + " You can upload a photo instead.",
        variant: "destructive",
      });
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          // Set canvas dimensions to match the video feed
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          
          // Draw the current video frame to the canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL (image)
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setSelfieImage(imageDataUrl);
          
          // Success notification
          toast({
            title: "Selfie Captured",
            description: "Your selfie has been captured successfully.",
          });
          
          // Stop the camera stream
          try {
            const stream = video.srcObject as MediaStream;
            if (stream) {
              const tracks = stream.getTracks();
              tracks.forEach(track => track.stop());
            }
            video.srcObject = null;
          } catch (err) {
            console.error("Error stopping camera:", err);
          }
          
          setCameraActive(false);
        }
      } catch (error) {
        console.error("Error capturing selfie:", error);
        toast({
          title: "Capture Error",
          description: "Failed to capture selfie. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Camera Not Ready",
        description: "Please ensure camera is activated before capturing.",
        variant: "destructive",
      });
    }
  };
  
  const handleLicenseImageUpload = (side: 'front' | 'back') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (side === 'front') {
          licenseForm.setValue('licenseImageFront', result);
        } else {
          licenseForm.setValue('licenseImageBack', result);
        }
        
        toast({
          title: `License ${side} uploaded`,
          description: "Image uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to run verification checks (simulated for demo)
  const runVerificationChecks = () => {
    setIsLoading(true);
    
    // Simulate API calls to verification services
    setTimeout(() => {
      // Simulate successful verification checks
      setVerificationChecks({
        identity: true,
        criminal: true,
        sexOffender: true,
        driving: true
      });
      
      toast({
        title: "Verification Complete",
        description: "All verification checks passed successfully.",
      });
      
      setStep('review');
      setIsLoading(false);
    }, 3000);
  };

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
    
    if (!data.licenseImageFront || !data.licenseImageBack) {
      toast({
        title: "Missing Documents",
        description: "Please upload both sides of your driver's license.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store license data for the next step
      setLicenseData(data);
      
      // Proceed to verification step
      setStep('verification');
      toast({
        title: "License information saved",
        description: "Please complete identity verification",
      });
    } catch (error) {
      console.error("Error submitting license data:", error);
      toast({
        title: "Error",
        description: "Failed to save license information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onVerificationComplete = () => {
    if (!selfieImage) {
      // For testing purposes, we'll provide a temporary selfie
      // In production, this should be removed and require an actual selfie
      const tempSelfie = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3ccircle cx='100' cy='80' r='50' fill='%23e2e8f0'/%3e%3ccircle cx='100' cy='230' r='100' fill='%23e2e8f0'/%3e%3c/svg%3e";
      setSelfieImage(tempSelfie);
      
      toast({
        title: "Test Mode Activated",
        description: "Using a placeholder selfie for testing purposes.",
      });
    }
    
    // Move to background check step
    setStep('background');
  };
  
  const onBackgroundSubmit = async (data: BackgroundCheckFormValues) => {
    setIsLoading(true);
    try {
      // Store background check data
      setBackgroundData(data);
      
      // Run verification checks
      runVerificationChecks();
    } catch (error) {
      console.error("Error submitting background check data:", error);
      toast({
        title: "Error",
        description: "Failed to process background check. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const completeRegistration = async () => {
    if (!vehicleData || !licenseData || !backgroundData || !selfieImage) {
      toast({
        title: "Missing Information",
        description: "Please complete all steps of the registration process.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStep('processing');
    
    try {
      // Use demo user ID for this example - in a real app this would come from authentication
      const userId = 1;
      
      // First register the vehicle
      const vehicleResponse = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vehicleData,
          userId: userId,
        }),
      });

      if (!vehicleResponse.ok) {
        throw new Error("Failed to register vehicle");
      }

      // In a real application, we would submit all the data to a background check service
      // and store the license images and selfie in a secure storage
      
      // Set a timer to simulate processing time
      setTimeout(() => {
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
        
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error("Error registering as driver:", error);
      toast({
        title: "Error",
        description: "Failed to complete driver registration. Please try again.",
        variant: "destructive",
      });
      setStep('review');
      setIsLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-lg mx-auto">
      {/* Vehicle Information Form */}
      <FormStepContainer isActive={step === 'vehicle'} stepKey="vehicle">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <CarIcon className="mr-2 h-5 w-5" /> Register Your Vehicle
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent>
            <Form {...vehicleForm}>
              <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-6">
                <StaggeredChildren>
                  <AnimatedField delay={0.1}>
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
                  </AnimatedField>
                  
                  <AnimatedField delay={0.2}>
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
                  </AnimatedField>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedField delay={0.3}>
                      <FormField
                        control={vehicleForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input type="number" min={1980} max={new Date().getFullYear() + 1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                    
                    <AnimatedField delay={0.3}>
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
                    </AnimatedField>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedField delay={0.4}>
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
                    </AnimatedField>
                    
                    <AnimatedField delay={0.4}>
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
                    </AnimatedField>
                  </div>
                </StaggeredChildren>
                
                <AnimatedButton 
                  type="submit" 
                  className="w-full" 
                  isLoading={isLoading}
                >
                  Continue
                </AnimatedButton>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <AnimatedField delay={0.5}>
              <Button variant="ghost" onClick={() => setLocation("/profile")}>
                Cancel
              </Button>
            </AnimatedField>
          </CardFooter>
        </Card>
      </FormStepContainer>

      {/* License Information Form */}
      <FormStepContainer isActive={step === 'license'} stepKey="license">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <LicenseIcon className="mr-2 h-5 w-5" /> Driver License Details
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent>
            <Form {...licenseForm}>
              <form onSubmit={licenseForm.handleSubmit(onLicenseSubmit)} className="space-y-6">
                <StaggeredChildren>
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedField delay={0.1}>
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
                    </AnimatedField>
                    
                    <AnimatedField delay={0.1}>
                      <FormField
                        control={licenseForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedField delay={0.2}>
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
                    </AnimatedField>
                    
                    <AnimatedField delay={0.2}>
                      <FormField
                        control={licenseForm.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                  </div>
                  
                  {/* License Images Upload */}
                  <AnimatedField delay={0.3}>
                    <div className="space-y-4 pt-3">
                      <h3 className="text-sm font-medium">Upload License Images</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="file"
                            ref={fileInputRefFront}
                            accept="image/*"
                            className="hidden"
                            onChange={handleLicenseImageUpload('front')}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => fileInputRefFront.current?.click()}
                          >
                            <FileUploadIcon className="w-4 h-4 mr-2" />
                            Front Side
                          </Button>
                          {licenseForm.getValues('licenseImageFront') && (
                            <div className="mt-2 text-center text-xs text-green-600">
                              <CheckCircleIcon className="inline-block w-4 h-4 mr-1" />
                              Uploaded
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={fileInputRefBack}
                            accept="image/*"
                            className="hidden"
                            onChange={handleLicenseImageUpload('back')}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => fileInputRefBack.current?.click()}
                          >
                            <FileUploadIcon className="w-4 h-4 mr-2" />
                            Back Side
                          </Button>
                          {licenseForm.getValues('licenseImageBack') && (
                            <div className="mt-2 text-center text-xs text-green-600">
                              <CheckCircleIcon className="inline-block w-4 h-4 mr-1" />
                              Uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedField>
                </StaggeredChildren>
                
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('vehicle')}
                  >
                    Back
                  </Button>
                  <AnimatedButton type="submit" className="flex-1" isLoading={isLoading}>
                    Next: Identity Verification
                  </AnimatedButton>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </FormStepContainer>
      
      {/* Identity Verification Form */}
      <FormStepContainer isActive={step === 'verification'} stepKey="verification">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <UserIcon className="mr-2 h-5 w-5" /> Identity Verification
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatedField delay={0.1}>
              <div className="text-center">
                <p className="mb-4">We need to verify your identity with a selfie to ensure driver safety.</p>
                
                {!selfieImage ? (
                  <>
                    <div className="relative w-full h-64 bg-slate-100 rounded-lg mb-4 overflow-hidden">
                      {cameraActive ? (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 border-4 border-dashed border-primary/30 pointer-events-none"></div>
                          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                            Camera active
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <UserIcon className="w-20 h-20 text-slate-300 mb-2" />
                          <p className="text-sm text-slate-500">
                            Upload a photo or use your camera
                          </p>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        {cameraActive ? (
                          <Button onClick={captureImage} className="w-full relative bg-green-600 hover:bg-green-700">
                            <span className="relative z-10 flex items-center justify-center">
                              <span className="mr-1">📸</span> Capture
                            </span>
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              toast({
                                title: "Starting Camera",
                                description: "Please allow camera access when prompted by your browser",
                              });
                              setTimeout(() => startCamera(), 500);
                            }} 
                            className="w-full flex items-center justify-center"
                          >
                            <span className="mr-2">🎥</span> Use Camera
                          </Button>
                        )}
                        
                        <div className="relative">
                          <input
                            type="file"
                            id="selfieUpload"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSelfieImage(reader.result as string);
                                  toast({
                                    title: "Photo Uploaded",
                                    description: "Your photo has been successfully uploaded.",
                                  });
                                };
                                reader.readAsDataURL(files[0]);
                              }
                            }}
                          />
                          <Button variant="outline" className="w-full flex items-center justify-center">
                            <span className="mr-1">📎</span> Upload Photo
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {cameraActive 
                          ? "Position your face within the frame and click capture" 
                          : "You can either use your camera or upload a photo for verification"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-full h-64 bg-slate-100 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={selfieImage} 
                        alt="Selfie" 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <CheckCircleIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-green-600 font-medium">Selfie captured successfully!</p>
                      <Button 
                        onClick={() => {
                          setSelfieImage(null);
                          setTimeout(() => startCamera(), 500);
                        }} 
                        variant="outline" 
                        className="w-full mb-2"
                      >
                        Retake Selfie
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </AnimatedField>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('license')}
              >
                Back
              </Button>
              <AnimatedButton 
                onClick={onVerificationComplete} 
                className="flex-1" 
                disabled={!selfieImage || isLoading}
              >
                Next: Background Check
              </AnimatedButton>
            </div>
          </CardContent>
        </Card>
      </FormStepContainer>
      
      {/* Background Check Form */}
      <FormStepContainer isActive={step === 'background'} stepKey="background">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <ShieldCheckIcon className="mr-2 h-5 w-5" /> Background Check
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent>
            <Form {...backgroundForm}>
              <form onSubmit={backgroundForm.handleSubmit(onBackgroundSubmit)} className="space-y-6">
                <StaggeredChildren>
                  <AnimatedField delay={0.1}>
                    <FormField
                      control={backgroundForm.control}
                      name="ssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Security Number</FormLabel>
                          <FormControl>
                            <Input placeholder="123-45-6789" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your SSN is required for background checks.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AnimatedField>
                  
                  <AnimatedField delay={0.2}>
                    <FormField
                      control={backgroundForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AnimatedField>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <AnimatedField delay={0.3}>
                      <FormField
                        control={backgroundForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                    <AnimatedField delay={0.3}>
                      <FormField
                        control={backgroundForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                    <AnimatedField delay={0.3}>
                      <FormField
                        control={backgroundForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="94103" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AnimatedField>
                  </div>
                </StaggeredChildren>
                
                <Separator />
                
                <AnimatedField delay={0.4}>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Consent for Background Checks</h3>
                    
                    <FormField
                      control={backgroundForm.control}
                      name="consentToBackgroundCheck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I consent to a background check
                            </FormLabel>
                            <FormDescription>
                              Allow us to verify your identity and background information.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={backgroundForm.control}
                      name="consentToCriminalCheck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I consent to a criminal record check
                            </FormLabel>
                            <FormDescription>
                              Allow us to verify your criminal history.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={backgroundForm.control}
                      name="consentToSexOffenderCheck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I consent to a sex offender registry check
                            </FormLabel>
                            <FormDescription>
                              Allow us to verify your status in the sex offender registry.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </AnimatedField>
                
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('verification')}
                  >
                    Back
                  </Button>
                  <AnimatedButton type="submit" className="flex-1" isLoading={isLoading}>
                    Submit for Verification
                  </AnimatedButton>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </FormStepContainer>
      
      {/* Review and Confirm Form */}
      <FormStepContainer isActive={step === 'review'} stepKey="review">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <CheckCircleIcon className="mr-2 h-5 w-5" /> Review and Confirm
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatedField delay={0.1}>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Verification Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${verificationChecks.identity ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    Identity Verification
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${verificationChecks.criminal ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    Criminal Record Check
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${verificationChecks.sexOffender ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    Sex Offender Check
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${verificationChecks.driving ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    Driving Record Check
                  </div>
                </div>
              </div>
            </AnimatedField>
            
            <AnimatedField delay={0.2}>
              <Tabs defaultValue="vehicle">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                  <TabsTrigger value="license">License</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="vehicle" className="space-y-4 pt-4">
                  {vehicleData && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Make</p>
                        <p>{vehicleData.make}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p>{vehicleData.model}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Year</p>
                        <p>{vehicleData.year}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p>{vehicleData.color}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">License Plate</p>
                        <p>{vehicleData.licensePlate}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Seats</p>
                        <p>{vehicleData.seats}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="license" className="space-y-4 pt-4">
                  {licenseData && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">License Number</p>
                        <p>{licenseData.licenseNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">State</p>
                        <p>{licenseData.state}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        <p>{new Date(licenseData.expiryDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p>{new Date(licenseData.dob).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-xs text-muted-foreground">License Images</p>
                        <p className="text-green-600">
                          <CheckCircleIcon className="inline-block w-4 h-4 mr-1" />
                          Uploaded and verified
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="profile" className="space-y-4 pt-4">
                  {selfieImage && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden">
                        <img src={selfieImage} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm text-green-600">
                        <CheckCircleIcon className="inline-block w-4 h-4 mr-1" />
                        Identity verified
                      </p>
                    </div>
                  )}
                  {backgroundData && (
                    <div className="text-sm mt-4">
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p>{backgroundData.address}, {backgroundData.city}, {backgroundData.state} {backgroundData.zipCode}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </AnimatedField>
            
            <AnimatedField delay={0.3}>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-800 text-sm">
                  <CheckCircleIcon className="inline-block w-5 h-5 mr-1 text-green-600" />
                  Congratulations! All verification checks have passed. You're ready to complete your driver registration.
                </p>
              </div>
            </AnimatedField>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('background')}
              >
                Back
              </Button>
              <AnimatedButton 
                onClick={completeRegistration} 
                className="flex-1" 
                disabled={isLoading}
              >
                Complete Registration
              </AnimatedButton>
            </div>
          </CardContent>
        </Card>
      </FormStepContainer>
      
      {/* Processing Form */}
      <FormStepContainer isActive={step === 'processing'} stepKey="processing">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <ShieldCheckIcon className="mr-2 h-5 w-5 animate-pulse" /> Processing Registration
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center py-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p>Please wait while we complete your registration...</p>
            <ul className="text-sm space-y-2 text-left max-w-xs mx-auto">
              <li className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                Verifying personal information
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                Validating vehicle details
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Processing background check
              </li>
              <li className="flex items-center text-muted-foreground">
                <div className="w-5 h-5 mr-2 rounded-full border border-muted-foreground"></div>
                Completing registration
              </li>
            </ul>
          </CardContent>
        </Card>
      </FormStepContainer>

      {/* Complete Form */}
      <FormStepContainer isActive={step === 'complete'} stepKey="complete">
        <Card>
          <CardHeader>
            <AnimatedTitle>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center text-green-600">
                <CheckCircleIcon className="mr-2 h-5 w-5" /> Registration Complete
              </CardTitle>
            </AnimatedTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <SuccessIcon />
            
            <div>
              <h3 className="text-lg font-medium">Congratulations!</h3>
              <p className="text-muted-foreground mb-4">You are now registered as a driver.</p>
            </div>
            
            <AnimatedField delay={0.3}>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-left">
                <p className="font-medium mb-2">What's next?</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
                    Create your first trip
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
                    Accept ride requests
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
                    Manage your schedule
                  </li>
                </ul>
              </div>
            </AnimatedField>
            
            <p className="text-sm">You will be redirected to the trips page shortly...</p>
          </CardContent>
        </Card>
      </FormStepContainer>
    </div>
  );
};

export default DriverSignup;