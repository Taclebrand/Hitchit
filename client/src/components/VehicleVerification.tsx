import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, Car, Shield } from "lucide-react";

interface VehicleVerificationResult {
  isValid: boolean;
  confidence: number;
  vehicleType: string;
  licensePlate?: string;
  color: string;
  make?: string;
  model?: string;
  year?: number;
  issues: string[];
  recommendations: string[];
}

interface SafetyAnalysisResult {
  safetyScore: number;
  issues: string[];
  recommendations: string[];
}

export default function VehicleVerification() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VehicleVerificationResult | null>(null);
  const [safetyResult, setSafetyResult] = useState<SafetyAnalysisResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expectedVehicleInfo, setExpectedVehicleInfo] = useState({
    licensePlate: "",
    make: "",
    model: "",
    color: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // This would typically open a camera modal
      // For now, we'll just trigger the file input
      fileInputRef.current?.click();
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast({
        title: "Camera Access Failed",
        description: "Please use the upload button to select an image",
        variant: "destructive",
      });
      fileInputRef.current?.click();
    }
  };

  const handleVerification = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select or capture a vehicle image first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setSafetyResult(null);

    try {
      // Prepare form data for vehicle verification
      const formData = new FormData();
      formData.append('vehicleImage', selectedImage);
      
      if (expectedVehicleInfo.licensePlate || expectedVehicleInfo.make || 
          expectedVehicleInfo.model || expectedVehicleInfo.color) {
        formData.append('expectedVehicleInfo', JSON.stringify(expectedVehicleInfo));
      }

      // Perform vehicle verification
      const verificationResponse = await fetch('/api/ai/verify-vehicle', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!verificationResponse.ok) {
        throw new Error('Verification failed');
      }

      const verificationData = await verificationResponse.json();
      setVerificationResult(verificationData);

      // Perform safety analysis
      const safetyFormData = new FormData();
      safetyFormData.append('vehicleImage', selectedImage);

      const safetyResponse = await fetch('/api/ai/analyze-vehicle-safety', {
        method: 'POST',
        body: safetyFormData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (safetyResponse.ok) {
        const safetyData = await safetyResponse.json();
        setSafetyResult(safetyData);
      }

      toast({
        title: "Analysis Complete",
        description: `Vehicle verification ${verificationData.isValid ? 'passed' : 'failed'} with ${Math.round(verificationData.confidence * 100)}% confidence`,
        variant: verificationData.isValid ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to analyze the vehicle image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>AI Vehicle Verification</span>
          </CardTitle>
          <CardDescription>
            Upload a photo of your vehicle for AI-powered verification and safety analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expected Vehicle Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licensePlate">License Plate (Optional)</Label>
              <Input
                id="licensePlate"
                value={expectedVehicleInfo.licensePlate}
                onChange={(e) => setExpectedVehicleInfo(prev => ({ ...prev, licensePlate: e.target.value }))}
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <Label htmlFor="make">Make (Optional)</Label>
              <Input
                id="make"
                value={expectedVehicleInfo.make}
                onChange={(e) => setExpectedVehicleInfo(prev => ({ ...prev, make: e.target.value }))}
                placeholder="Toyota"
              />
            </div>
            <div>
              <Label htmlFor="model">Model (Optional)</Label>
              <Input
                id="model"
                value={expectedVehicleInfo.model}
                onChange={(e) => setExpectedVehicleInfo(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Camry"
              />
            </div>
            <div>
              <Label htmlFor="color">Color (Optional)</Label>
              <Input
                id="color"
                value={expectedVehicleInfo.color}
                onChange={(e) => setExpectedVehicleInfo(prev => ({ ...prev, color: e.target.value }))}
                placeholder="White"
              />
            </div>
          </div>

          <Separator />

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button 
                onClick={handleCameraCapture}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Photo</span>
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {imagePreview && (
              <div className="border rounded-lg p-4">
                <img 
                  src={imagePreview} 
                  alt="Vehicle preview" 
                  className="max-w-full h-64 object-contain mx-auto rounded"
                />
              </div>
            )}

            <Button 
              onClick={handleVerification}
              disabled={!selectedImage || isVerifying}
              className="w-full"
            >
              {isVerifying ? "Analyzing Vehicle..." : "Verify Vehicle"}
            </Button>
          </div>

          {/* Verification Results */}
          {verificationResult && (
            <div className="space-y-4">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verification Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      {verificationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span>Verification Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge variant={verificationResult.isValid ? "default" : "destructive"}>
                        {verificationResult.isValid ? "VERIFIED" : "FAILED"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Confidence:</span>
                      <span className={getConfidenceColor(verificationResult.confidence)}>
                        {Math.round(verificationResult.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vehicle Type:</span>
                      <Badge variant="outline">{verificationResult.vehicleType}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Color:</span>
                      <span>{verificationResult.color}</span>
                    </div>
                    {verificationResult.licensePlate && (
                      <div className="flex justify-between items-center">
                        <span>License Plate:</span>
                        <Badge variant="secondary">{verificationResult.licensePlate}</Badge>
                      </div>
                    )}
                    {verificationResult.make && verificationResult.model && (
                      <div className="flex justify-between items-center">
                        <span>Make/Model:</span>
                        <span>{verificationResult.make} {verificationResult.model}</span>
                      </div>
                    )}
                    {verificationResult.year && (
                      <div className="flex justify-between items-center">
                        <span>Year:</span>
                        <span>{verificationResult.year}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Safety Analysis */}
                {safetyResult && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Safety Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Safety Score:</span>
                        <span className={getSafetyScoreColor(safetyResult.safetyScore)}>
                          {safetyResult.safetyScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${safetyResult.safetyScore >= 80 ? 'bg-green-600' : 
                                      safetyResult.safetyScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${safetyResult.safetyScore}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Issues and Recommendations */}
              {(verificationResult.issues.length > 0 || verificationResult.recommendations.length > 0 || 
                (safetyResult && (safetyResult.issues.length > 0 || safetyResult.recommendations.length > 0))) && (
                <div className="space-y-4">
                  {(verificationResult.issues.length > 0 || (safetyResult && safetyResult.issues.length > 0)) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">Issues Found:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {verificationResult.issues.map((issue, index) => (
                              <li key={`verification-${index}`}>{issue}</li>
                            ))}
                            {safetyResult?.issues.map((issue, index) => (
                              <li key={`safety-${index}`}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {(verificationResult.recommendations.length > 0 || 
                    (safetyResult && safetyResult.recommendations.length > 0)) && (
                    <Alert>
                      <Car className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">Recommendations:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {verificationResult.recommendations.map((rec, index) => (
                              <li key={`verification-rec-${index}`}>{rec}</li>
                            ))}
                            {safetyResult?.recommendations.map((rec, index) => (
                              <li key={`safety-rec-${index}`}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}