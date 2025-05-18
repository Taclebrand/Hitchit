import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SelfieCaptureModal from "@/components/SelfieCaptureModal";

const ProfileSetup = () => {
  const [, setLocation] = useLocation();
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleCapture = (image: string) => {
    setProfileImage(image);
    setShowSelfieModal(false);
  };

  const handleContinue = () => {
    // In a real app, we would upload the profile image to a server here
    // After successful upload, proceed to the next screen
    localStorage.setItem("hasSetupProfile", "true");
    setLocation("/home");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSetupProfile", "true");
    setLocation("/home");
  };

  return (
    <div className="fixed inset-0 bg-white p-4 sm:p-6 flex flex-col safe-area-top safe-area-bottom">
      {/* Progress Indicator */}
      <div className="flex space-x-2 mb-8">
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-neutral-200 rounded-full flex-1"></div>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Set Up Your Profile</h1>
        <p className="text-gray-600">
          Add a profile photo so drivers and other users can recognize you.
        </p>
      </div>
      
      {/* Profile Image Area */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div 
          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full mb-6 overflow-hidden flex items-center justify-center border-2 border-dashed border-primary p-1"
          onClick={() => setShowSelfieModal(true)}
        >
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-100 flex flex-col items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="1.5">
                <path d="M9 3a4 4 0 100 8 4 4 0 000-8z" />
                <path d="M12 13.5c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5V13c0-1.18.78-2.37 1.5-3 .5-.45 1-.5 1.5-.5s1 .05 1.5.5c.72.63 1.5 1.82 1.5 3v.5z" />
              </svg>
              <p className="text-gray-500 text-sm mt-3">Tap to add photo</p>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Your profile photo helps people recognize you
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4 mt-auto">
        <Button
          onClick={handleContinue}
          disabled={!profileImage}
          className="w-full py-6 rounded-full bg-primary"
        >
          Continue
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full py-3 text-gray-600"
        >
          Skip for now
        </Button>
      </div>
      
      {/* Selfie Capture Modal */}
      {showSelfieModal && (
        <SelfieCaptureModal
          onCapture={handleCapture}
          onClose={() => setShowSelfieModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileSetup;