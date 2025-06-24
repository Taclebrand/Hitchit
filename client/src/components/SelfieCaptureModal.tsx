import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface SelfieCaptureModalProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

const SelfieCaptureModal: React.FC<SelfieCaptureModalProps> = ({ onCapture, onClose }) => {
  const [step, setStep] = useState<'initial' | 'camera' | 'preview'>('initial');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Request camera permission with proper constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: false 
      });
      
      setStream(mediaStream);
      setStep('camera');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays after setting source
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);
      let errorMessage = "Unable to access camera. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera access in your browser settings and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found. Please connect a camera and try again.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is being used by another application.";
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      setCapturedImage(imageDataUrl);
      
      // Stop camera
      stopCamera();
      
      // Move to preview step
      setStep('preview');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const confirmImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleBack = () => {
    if (step === 'camera') {
      stopCamera();
      setStep('initial');
    } else if (step === 'preview') {
      setStep('initial');
      setCapturedImage(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col safe-area-top safe-area-bottom z-50">
      {/* Header */}
      <div className="p-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center touch-target"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex space-x-2 px-4 mb-6">
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {step === 'initial' && (
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gray-100 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-dashed m-4"></div>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="1">
                <path d="M9 3a4 4 0 100 8 4 4 0 000-8z" />
                <path d="M12 13.5c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5V13c0-1.18.78-2.37 1.5-3 .5-.45 1-.5 1.5-.5s1 .05 1.5.5c.72.63 1.5 1.82 1.5 3v.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-center">Please move your face into frame</h2>
            
            <Button 
              onClick={startCamera} 
              className="w-full py-6 rounded-full bg-primary"
            >
              Take Selfie
            </Button>
            
            <div className="text-gray-500">or</div>
            
            <Button 
              variant="outline" 
              className="w-full py-6 rounded-full border-gray-300"
              onClick={triggerFileUpload}
            >
              Upload from Gallery
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              className="hidden" 
              onChange={handleFileSelect}
            />
          </div>
        )}

        {step === 'camera' && (
          <div className="flex flex-col items-center space-y-8 w-full">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="min-h-full min-w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 z-10">
                <div className="w-full h-full relative">
                  {/* Top semicircle */}
                  <div className="absolute top-0 left-1/4 w-1/2 h-[2px] border-t-2 border-primary rounded-t-full"></div>
                  <div className="absolute top-0 left-0 w-1/4 h-1/4 border-t-2 border-l-2 border-primary rounded-tl-full"></div>
                  <div className="absolute top-0 right-0 w-1/4 h-1/4 border-t-2 border-r-2 border-primary rounded-tr-full"></div>
                  
                  {/* Bottom semicircle */}
                  <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] border-b-2 border-primary rounded-b-full"></div>
                  <div className="absolute bottom-0 left-0 w-1/4 h-1/4 border-b-2 border-l-2 border-primary rounded-bl-full"></div>
                  <div className="absolute bottom-0 right-0 w-1/4 h-1/4 border-b-2 border-r-2 border-primary rounded-br-full"></div>
                  
                  {/* Face guide outline */}
                  <div className="absolute inset-8 border-2 border-dashed border-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={takeSelfie} 
              className="w-full py-6 rounded-full bg-primary mt-8"
            >
              Take Selfie
            </Button>
            
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        )}

        {step === 'preview' && capturedImage && (
          <div className="flex flex-col items-center space-y-8 w-full">
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden">
              <img 
                src={capturedImage} 
                alt="Captured selfie" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex flex-col space-y-4 w-full">
              <Button 
                onClick={confirmImage} 
                className="w-full py-6 rounded-full bg-primary"
              >
                Use Photo
              </Button>
              <Button 
                variant="outline" 
                onClick={retakeImage} 
                className="w-full py-6 rounded-full border-gray-300"
              >
                Retake
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfieCaptureModal;