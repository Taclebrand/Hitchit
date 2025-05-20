import React, { useState } from 'react';
import { MapPinIcon, CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GoogleMapDisplay } from '@/components/GoogleMapDisplay';
import { MapboxMapDisplay } from '@/components/MapboxMapDisplay';
import { useToast } from '@/hooks/use-toast';

interface AddressVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  useMapbox?: boolean;
}

export const AddressVerificationModal: React.FC<AddressVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  address,
  coordinates,
  useMapbox = true
}) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  
  const handleConfirm = () => {
    setIsVerifying(true);
    
    // Confirm immediately
    setTimeout(() => {
      setIsVerifying(false);
      onConfirm();
    }, 500);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-primary" />
            Verify Your Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {/* Map Preview */}
          <div className="h-[200px] w-full overflow-hidden rounded-md border">
            {useMapbox ? (
              <MapboxMapDisplay
                originCoordinates={coordinates}
                destinationCoordinates={coordinates}
                height="100%"
                width="100%"
                zoom={15}
              />
            ) : (
              <GoogleMapDisplay
                originCoordinates={coordinates}
                destinationCoordinates={coordinates}
                height="100%"
                width="100%"
                zoom={15}
              />
            )}
          </div>
          
          {/* Address Display */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Your location</p>
                <p className="text-sm text-muted-foreground break-words">{address}</p>
              </div>
            </div>
          </Card>
          
          <p className="text-sm text-center text-muted-foreground">
            Is this location correct? Please confirm to continue.
          </p>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <XIcon className="h-4 w-4 mr-2" />
            Edit & Correct
          </Button>
          <Button onClick={handleConfirm} disabled={isVerifying} className="flex-1 sm:flex-none">
            {isVerifying ? (
              <span className="flex items-center">Verifying...</span>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Confirm Address
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};