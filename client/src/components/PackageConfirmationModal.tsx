import { Button } from "@/components/ui/button";

interface PackageConfirmationModalProps {
  onClose: () => void;
}

const PackageConfirmationModal = ({ onClose }: PackageConfirmationModalProps) => {
  // Mock data for package confirmation
  const packageData = {
    pickup: "123 Main St",
    delivery: "789 Destination Ave",
    size: "Small",
    deliveryOption: "Standard (2-3 hours)",
    trackingNumber: "HITCH28756390",
    priceDetails: {
      baseFare: "$6.00",
      distanceFee: "$2.00",
      serviceFee: "$0.50",
      total: "$8.50"
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full rounded-t-3xl p-5 slide-in max-h-[80%] overflow-auto">
        <div className="w-16 h-1 bg-neutral-300 rounded-full mx-auto mb-5"></div>
        
        {/* Package Status */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-1">Package Shipment Confirmed!</h3>
          <p className="text-neutral-500">Your package will be picked up soon</p>
        </div>
        
        {/* Map Placeholder */}
        <div className="h-40 bg-neutral-100 rounded-xl mb-5 flex items-center justify-center">
          <p className="text-neutral-400">Map View</p>
        </div>
        
        {/* Package Info */}
        <div className="p-4 bg-neutral-50 rounded-xl mb-5">
          <div className="flex items-start mb-4">
            <div className="mr-3 pt-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-0.5 h-12 bg-neutral-300 mx-auto my-1"></div>
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
            </div>
            <div>
              <div className="mb-3">
                <p className="text-sm text-neutral-500">Pickup</p>
                <p className="font-medium">{packageData.pickup}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Delivery</p>
                <p className="font-medium">{packageData.delivery}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-3">
            <div className="flex justify-between mb-2">
              <p className="text-sm text-neutral-500">Package Size</p>
              <p className="font-medium">{packageData.size}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-sm text-neutral-500">Delivery Option</p>
              <p className="font-medium">{packageData.deliveryOption}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-neutral-500">Tracking Number</p>
              <p className="font-medium">{packageData.trackingNumber}</p>
            </div>
          </div>
        </div>
        
        {/* Price Details */}
        <div className="p-4 bg-neutral-50 rounded-xl mb-5">
          <h4 className="font-medium mb-3">Price Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-neutral-500">Base Fare</p>
              <p>{packageData.priceDetails.baseFare}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-neutral-500">Distance Fee</p>
              <p>{packageData.priceDetails.distanceFee}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-neutral-500">Service Fee</p>
              <p>{packageData.priceDetails.serviceFee}</p>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-neutral-200">
              <p>Total</p>
              <p>{packageData.priceDetails.total}</p>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full py-4 bg-primary rounded-full text-white font-medium"
          onClick={onClose}
        >
          Track Package
        </Button>
      </div>
    </div>
  );
};

export default PackageConfirmationModal;
