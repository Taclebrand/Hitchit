import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Share2, Download, Copy, Eye, Clock, QrCode } from 'lucide-react';

interface TripShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  tripDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    availableSeats: number;
    pricePerSeat: number;
  };
}

interface TripShareData {
  success: boolean;
  shareCode: string;
  shareUrl: string;
  qrCodeData: string;
  tripShare: {
    id: number;
    viewCount: number;
    createdAt: string;
  };
}

const TripShareModal: React.FC<TripShareModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripDetails
}) => {
  const [shareData, setShareData] = useState<TripShareData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const { toast } = useToast();

  const generateQRCode = async () => {
    setIsGenerating(true);
    
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const responseRaw = await apiRequest('POST', `/api/trips/${tripId}/share`, {
        expiresAt: expiresAt.toISOString()
      });
      
      const response = await responseRaw.json();
      setShareData(response);
      
      toast({
        title: "QR Code Generated",
        description: "Your trip share code is ready to use!",
      });
      
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!shareData?.qrCodeData) return;
    
    const link = document.createElement('a');
    link.download = `trip-qr-${shareData.shareCode}.png`;
    link.href = shareData.qrCodeData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: "QR code image saved to your device",
    });
  };

  const shareViaWebShare = async () => {
    if (!shareData?.shareUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rideshare Trip',
          text: `Check out this ride from ${tripDetails.origin} to ${tripDetails.destination}`,
          url: shareData.shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        copyToClipboard(shareData.shareUrl, "Share link");
      }
    } else {
      copyToClipboard(shareData.shareUrl, "Share link");
    }
  };

  const handleClose = () => {
    setShareData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Share Your Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Details Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{tripDetails.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{tripDetails.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-medium">{new Date(tripDetails.departureTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Seats:</span>
                  <Badge variant="secondary">{tripDetails.availableSeats}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Seat:</span>
                  <span className="font-medium">${tripDetails.pricePerSeat}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!shareData ? (
            <>
              {/* Expiration Settings */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Expiration</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                  <option value={30}>1 month</option>
                </select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateQRCode}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </div>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img 
                    src={shareData.qrCodeData} 
                    alt="Trip QR Code"
                    className="w-48 h-48"
                  />
                </div>
                
                {/* Share Code */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Share Code</p>
                  <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                    {shareData.shareCode}
                  </code>
                </div>

                {/* Share Statistics */}
                <div className="flex gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {shareData.tripShare.viewCount} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {new Date(shareData.tripShare.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(shareData.shareUrl, "Share link")}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadQRCode}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>

              <Button 
                onClick={shareViaWebShare}
                className="w-full flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Trip
              </Button>

              {/* Generate New Button */}
              <Button 
                variant="ghost" 
                onClick={() => setShareData(null)}
                className="w-full text-sm"
              >
                Generate New QR Code
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripShareModal;