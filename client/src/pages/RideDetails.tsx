import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { CarIcon, PackageIcon } from '@/lib/icons';

const RideDetails: React.FC = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/ride-details/:id');
  const id = params?.id;

  // Mock data - in a real app, we would fetch this from the API based on the ID
  const rideDetails = {
    id: id || '123456',
    type: 'ride', // 'ride' or 'package'
    date: 'Today',
    time: '11:30 AM',
    status: 'completed', // 'completed', 'cancelled', 'in_progress'
    from: '123 Main St, New York',
    to: 'Empire State Building, NY',
    cost: '$24.50',
    distance: '3.5 miles',
    duration: '15 minutes',
    vehicle: 'Toyota Camry',
    paymentMethod: 'Visa ****4242',
    receiptUrl: '#',
    driver: {
      name: 'John Driver',
      rating: 4.8,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      phone: '+1 (555) 123-4567'
    },
    timeline: [
      { time: '11:15 AM', status: 'Ride requested' },
      { time: '11:17 AM', status: 'Driver accepted' },
      { time: '11:22 AM', status: 'Driver arrived' },
      { time: '11:25 AM', status: 'Ride started' },
      { time: '11:40 AM', status: 'Ride completed' }
    ]
  };

  const handleBack = () => {
    setLocation('/history');
  };

  const handleTrackRide = () => {
    setLocation('/driver-tracking');
  };

  // Function to render the status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let bgColor = 'bg-green-100';
    let textColor = 'text-green-800';

    if (status === 'cancelled') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    } else if (status === 'in_progress') {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
    }

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
        {status === 'completed' ? 'Completed' : 
         status === 'cancelled' ? 'Cancelled' : 'In Progress'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="relative px-4 py-3 bg-white shadow-sm z-10">
        <button 
          className="absolute left-2 top-3 p-2"
          onClick={handleBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">Trip Details</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {/* Status and Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
              rideDetails.type === 'ride' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'
            }`}>
              {rideDetails.type === 'ride' ? 
                <CarIcon width={24} height={24} /> : 
                <PackageIcon width={24} height={24} />
              }
            </div>
            <div>
              <h3 className="font-medium text-lg">
                {rideDetails.type === 'ride' ? 'Ride' : 'Package Delivery'}
              </h3>
              <div className="text-sm text-gray-500">
                {rideDetails.date} • {rideDetails.time}
              </div>
            </div>
          </div>
          <div>
            {renderStatusBadge(rideDetails.status)}
          </div>
        </div>
        
        {/* Trip Details Card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex my-3">
            <div className="mr-3 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div className="w-0.5 h-10 bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-gray-500 text-sm">From</div>
                <div className="font-medium">{rideDetails.from}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">To</div>
                <div className="font-medium">{rideDetails.to}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
            <div>
              <div className="text-gray-500 text-sm">Distance</div>
              <div className="font-medium">{rideDetails.distance}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Duration</div>
              <div className="font-medium">{rideDetails.duration}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Cost</div>
              <div className="font-medium">{rideDetails.cost}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Payment</div>
              <div className="font-medium">{rideDetails.paymentMethod}</div>
            </div>
          </div>
        </div>
        
        {/* Driver Info */}
        {rideDetails.driver && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <h3 className="font-semibold mb-3">Driver</h3>
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                <img 
                  src={rideDetails.driver.avatar} 
                  alt={rideDetails.driver.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium text-gray-900">{rideDetails.driver.name}</h4>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{rideDetails.driver.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{rideDetails.vehicle}</p>
                <p className="text-primary text-sm mt-1">{rideDetails.driver.phone}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Trip Timeline */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <h3 className="font-semibold mb-3">Trip Timeline</h3>
          <div className="space-y-4">
            {rideDetails.timeline.map((item, index) => (
              <div key={index} className="flex">
                <div className="mr-3 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === rideDetails.timeline.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  {index < rideDetails.timeline.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-gray-500 text-sm">{item.time}</div>
                  <div className="font-medium">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Get Receipt Button */}
        <Button 
          variant="outline" 
          className="w-full py-4 border-gray-300 mb-4"
        >
          Get Receipt
        </Button>
        
        {/* Track Ride Button - only show for in-progress rides */}
        {rideDetails.status === 'in_progress' && (
          <Button 
            className="w-full py-4 bg-primary"
            onClick={handleTrackRide}
          >
            Track Ride
          </Button>
        )}
      </div>
    </div>
  );
};

export default RideDetails;