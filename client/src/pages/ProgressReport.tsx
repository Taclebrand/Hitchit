import React, { useState } from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';

const ProgressReport: React.FC = () => {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Mock data for demonstration - in a real app this would come from the API
  const reportData = {
    week: {
      totalTrips: 5,
      totalDistance: 23.5,
      totalTime: 87,
      totalSaved: 12.25,
      co2Reduced: 4.2,
      badge: 'Frequent Rider',
      level: 2,
      levelProgress: 70,
      statistics: [
        { day: 'Mon', trips: 1 },
        { day: 'Tue', trips: 0 },
        { day: 'Wed', trips: 2 },
        { day: 'Thu', trips: 0 },
        { day: 'Fri', trips: 1 },
        { day: 'Sat', trips: 1 },
        { day: 'Sun', trips: 0 }
      ]
    },
    month: {
      totalTrips: 18,
      totalDistance: 95.2,
      totalTime: 320,
      totalSaved: 38.75,
      co2Reduced: 17.8,
      badge: 'Super Rider',
      level: 3,
      levelProgress: 45,
      statistics: [
        { week: 'Week 1', trips: 3 },
        { week: 'Week 2', trips: 5 },
        { week: 'Week 3', trips: 7 },
        { week: 'Week 4', trips: 3 }
      ]
    },
    year: {
      totalTrips: 187,
      totalDistance: 1250.5,
      totalTime: 3860,
      totalSaved: 425.50,
      co2Reduced: 223.4,
      badge: 'Ultimate Rider',
      level: 5,
      levelProgress: 90,
      statistics: [
        { month: 'Jan', trips: 12 },
        { month: 'Feb', trips: 15 },
        { month: 'Mar', trips: 18 },
        { month: 'Apr', trips: 14 },
        { month: 'May', trips: 20 },
        { month: 'Jun', trips: 16 },
        { month: 'Jul', trips: 22 },
        { month: 'Aug', trips: 18 },
        { month: 'Sep', trips: 15 },
        { month: 'Oct', trips: 14 },
        { month: 'Nov', trips: 11 },
        { month: 'Dec', trips: 12 }
      ]
    }
  };

  const currentData = reportData[timeRange];

  const renderStatisticsChart = () => {
    const data = currentData.statistics;
    const maxTrips = Math.max(...data.map(item => (item as any).trips));
    
    return (
      <div className="mt-6">
        <h3 className="font-medium mb-3">Ride Frequency</h3>
        <div className="flex h-40 items-end space-x-2">
          {data.map((item, index) => {
            const label = 'day' in item ? item.day : 'week' in item ? item.week : item.month;
            const trips = (item as any).trips;
            const percentage = (trips / maxTrips) * 100 || 0;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-100 rounded-t-sm relative" style={{ height: `${percentage}%` }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm" style={{ height: `${percentage}%` }}></div>
                </div>
                <div className="text-xs mt-1 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 safe-area-top flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Your Progress</h1>
          <p className="text-gray-600">Track your ride statistics and milestones</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={timeRange === 'week' ? 'default' : 'outline'} 
            className={`flex-1 rounded-full ${timeRange === 'week' ? 'bg-primary' : 'bg-white'}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button 
            variant={timeRange === 'month' ? 'default' : 'outline'} 
            className={`flex-1 rounded-full ${timeRange === 'month' ? 'bg-primary' : 'bg-white'}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button 
            variant={timeRange === 'year' ? 'default' : 'outline'} 
            className={`flex-1 rounded-full ${timeRange === 'year' ? 'bg-primary' : 'bg-white'}`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Total Trips</div>
              <div className="text-2xl font-bold">{currentData.totalTrips}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Distance</div>
              <div className="text-2xl font-bold">{currentData.totalDistance} <span className="text-sm font-normal">mi</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Time Saved</div>
              <div className="text-2xl font-bold">{Math.floor(currentData.totalTime / 60)} <span className="text-sm font-normal">hr {currentData.totalTime % 60} min</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Money Saved</div>
              <div className="text-2xl font-bold">${currentData.totalSaved.toFixed(2)}</div>
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Environmental Impact</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.66347 17H14.3365" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 14.3333V19.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.2002 10.5L4.8002 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.8002 10.5L19.2002 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 4.33333C8.77611 7.11111 6.66675 9.88889 6.66675 12C6.66675 14.1111 8.77611 16.8889 12 19.6667C15.2239 16.8889 17.3334 14.1111 17.3334 12C17.3334 9.88889 15.2239 7.11111 12 4.33333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-green-800 font-medium">{currentData.co2Reduced} kg CO₂ reduced</div>
                <div className="text-sm text-green-600">Equivalent to planting {Math.round(currentData.co2Reduced / 0.5)} trees</div>
              </div>
            </div>
          </div>

          {/* Rider Level */}
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Rider Level</h3>
              <div className="text-sm text-primary font-medium">{currentData.badge}</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                {currentData.level}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full mb-1">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${currentData.levelProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {currentData.levelProgress}% to Level {currentData.level + 1}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Chart */}
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
            {renderStatisticsChart()}
          </div>

          {/* Export Button */}
          <Button
            variant="outline"
            className="w-full py-3 mb-6"
          >
            Export Report
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProgressReport;