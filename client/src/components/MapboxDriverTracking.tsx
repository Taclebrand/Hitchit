import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapboxMapDisplay } from "@/components/MapboxMapDisplay";
import { DriverLocationUpdate } from "@/services/MapboxService";
import { Coordinates } from "@/services/GoogleMapsService";
import { MapPin, Navigation, Clock, Phone, X, MessageSquare } from "lucide-react";

interface MapboxDriverTrackingProps {
  rideId: string;
  tripInfo: {
    originAddress: string;
    originCoordinates: Coordinates;
    destinationAddress: string;
    destinationCoordinates: Coordinates;
    driverName: string;
    driverPhone: string;
    vehicleInfo: string;
    estimatedDuration: string;
    price: number;
  };
  onClose: () => void;
}

export function MapboxDriverTracking({
  rideId,
  tripInfo,
  onClose
}: MapboxDriverTrackingProps) {
  const [driverLocation, setDriverLocation] = useState<DriverLocationUpdate | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>(tripInfo.estimatedDuration);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{text: string, fromDriver: boolean, time: string}>>([
    {
      text: "I'm on my way to pick you up!",
      fromDriver: true,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  const [messageInput, setMessageInput] = useState<string>("");

  // Handle driver location updates
  const handleDriverUpdate = (update: DriverLocationUpdate) => {
    setDriverLocation(update);
    
    // Calculate new ETA based on driver's position and speed
    // This is a simplified calculation - in a real app, you'd use the remaining route distance
    const remainingMinutes = Math.max(5, Math.round(update.speed > 0 ? 
      (15 - (update.speed * 0.2)) : 15));
    setEstimatedArrival(`${remainingMinutes} min`);
  };

  // Handle sending a message to the driver
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Add user message
    setMessages(prev => [
      ...prev, 
      {
        text: messageInput,
        fromDriver: false,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }
    ]);
    setMessageInput("");
    
    // Simulate driver response after a short delay
    setTimeout(() => {
      const driverResponses = [
        "I'll be there soon!",
        "I'm stuck in a bit of traffic, but making progress.",
        "Looking forward to meeting you!",
        "Almost there, just a few more minutes.",
        "I can see your pickup location now."
      ];
      
      const randomResponse = driverResponses[Math.floor(Math.random() * driverResponses.length)];
      
      setMessages(prev => [
        ...prev, 
        {
          text: randomResponse,
          fromDriver: true,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Map section */}
      <div className="relative h-[45vh]">
        <MapboxMapDisplay
          originCoordinates={tripInfo.originCoordinates}
          destinationCoordinates={tripInfo.destinationCoordinates}
          showLiveTracking={true}
          onDriverUpdate={handleDriverUpdate}
          height="100%"
          width="100%"
        />
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 bg-white shadow-md z-30"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Driver info section */}
      <div className="flex-grow overflow-auto p-4">
        <Card className="bg-white p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{tripInfo.driverName}</h3>
              <p className="text-sm text-slate-500">{tripInfo.vehicleInfo}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-3 mb-4">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium">Your driver is on the way</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estimated arrival in</span>
              <span className="text-sm font-semibold">{estimatedArrival}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-xs text-slate-500">PICKUP</p>
                  <p className="text-sm font-medium">{tripInfo.originAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">DESTINATION</p>
                  <p className="text-sm font-medium">{tripInfo.destinationAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Chat section (conditionally rendered) */}
        {showChat && (
          <Card className="bg-white p-4 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Chat with {tripInfo.driverName}</h3>
            
            <div className="h-48 overflow-y-auto bg-slate-50 rounded-lg p-3 mb-3">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-2 ${msg.fromDriver ? 'text-left' : 'text-right'}`}
                >
                  <div 
                    className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                      msg.fromDriver 
                        ? 'bg-slate-200 text-slate-800' 
                        : 'bg-primary text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{msg.time}</div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                variant="primary"
                size="sm"
                onClick={handleSendMessage}
              >
                Send
              </Button>
            </div>
          </Card>
        )}

        {/* Ride details section */}
        <Card className="bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Ride Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Ride ID</span>
              <span className="text-sm font-medium">{rideId}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Payment</span>
              <span className="text-sm font-medium">Credit Card ••••4242</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Price</span>
              <span className="text-sm font-medium">${tripInfo.price.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}