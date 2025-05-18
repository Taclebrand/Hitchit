import React from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { CarIcon, PackageIcon } from '@/lib/icons';

interface HistoryItem {
  id: string;
  type: 'ride' | 'package';
  date: string;
  time: string;
  status: 'completed' | 'cancelled' | 'in_progress';
  from: string;
  to: string;
  cost: string;
  driver?: {
    name: string;
    rating: number;
    avatar: string;
  };
}

const RideHistory: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // This would normally come from an API call
  const historyItems: HistoryItem[] = [
    {
      id: '123456',
      type: 'ride',
      date: 'Today',
      time: '11:30 AM',
      status: 'completed',
      from: '123 Main St, New York',
      to: 'Empire State Building, NY',
      cost: '$24.50',
      driver: {
        name: 'John Driver',
        rating: 4.8,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    },
    {
      id: '123457',
      type: 'package',
      date: 'Yesterday',
      time: '3:45 PM',
      status: 'completed',
      from: '350 5th Ave, New York',
      to: '789 Broadway, New York',
      cost: '$12.75',
      driver: {
        name: 'Sarah Smith',
        rating: 4.9,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    },
    {
      id: '123458',
      type: 'ride',
      date: 'May 15, 2023',
      time: '9:20 AM',
      status: 'cancelled',
      from: 'Central Park West, NY',
      to: 'JFK Airport, Queens, NY',
      cost: '$0.00'
    },
    {
      id: '123459',
      type: 'ride',
      date: 'May 12, 2023',
      time: '7:15 PM',
      status: 'completed',
      from: 'Brooklyn Bridge, NY',
      to: 'Times Square, Manhattan, NY',
      cost: '$18.30',
      driver: {
        name: 'Michael Rodriguez',
        rating: 4.7,
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
      }
    },
    {
      id: '123460',
      type: 'package',
      date: 'May 10, 2023',
      time: '2:30 PM',
      status: 'completed',
      from: 'SoHo, Manhattan, NY',
      to: 'Williamsburg, Brooklyn, NY',
      cost: '$14.25',
      driver: {
        name: 'Lisa Johnson',
        rating: 4.6,
        avatar: 'https://randomuser.me/api/portraits/women/63.jpg'
      }
    }
  ];

  const viewRideDetails = (id: string) => {
    setLocation(`/ride-details/${id}`);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 safe-area-top flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Trip History</h1>
          <p className="text-gray-600">View all your past rides and deliveries</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" className="flex-1 rounded-full bg-white">
            All
          </Button>
          <Button variant="outline" className="flex-1 rounded-full bg-white">
            Rides
          </Button>
          <Button variant="outline" className="flex-1 rounded-full bg-white">
            Packages
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {historyItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
              onClick={() => viewRideDetails(item.id)}
            >
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    item.type === 'ride' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'ride' ? 
                      <CarIcon width={20} height={20} /> : 
                      <PackageIcon width={20} height={20} />
                    }
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {item.type === 'ride' ? 'Ride' : 'Package Delivery'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {item.date} • {item.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{item.cost}</div>
                  <div className={`text-sm ${
                    item.status === 'completed' ? 'text-green-600' : 
                    item.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {formatStatus(item.status)}
                  </div>
                </div>
              </div>

              <div className="flex my-3">
                <div className="mr-3 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-2">
                    <div className="text-gray-500">From</div>
                    <div className="font-medium truncate">{item.from}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">To</div>
                    <div className="font-medium truncate">{item.to}</div>
                  </div>
                </div>
              </div>

              {item.driver && (
                <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                    <img src={item.driver.avatar} alt={item.driver.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{item.driver.name}</div>
                    <div className="flex items-center text-gray-500">
                      <svg className="w-3.5 h-3.5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {item.driver.rating}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default RideHistory;