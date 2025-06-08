import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, Package, Car, Phone } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface ActivityItem {
  id: string;
  type: 'ride' | 'package' | 'trip';
  status: 'completed' | 'active' | 'cancelled' | 'pending';
  title: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  driver?: string;
  rider?: string;
  phone?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "ride",
    status: "completed",
    title: "Ride to Downtown",
    from: "2618 Wayne Way, Rosenberg, TX",
    to: "Houston Downtown, TX",
    date: "2024-12-20",
    time: "2:30 PM",
    price: 25.50,
    driver: "John Smith",
    phone: "+1 (555) 123-4567"
  },
  {
    id: "2",
    type: "package",
    status: "active",
    title: "Package Delivery",
    from: "Sugar Land, TX",
    to: "Katy, TX",
    date: "2024-12-21",
    time: "10:00 AM",
    price: 15.00,
    driver: "Maria Garcia"
  },
  {
    id: "3",
    type: "trip",
    status: "pending",
    title: "Trip to Austin",
    from: "Houston, TX",
    to: "Austin, TX",
    date: "2024-12-22",
    time: "8:00 AM",
    price: 45.00,
    rider: "Sarah Johnson"
  }
];

const Activity = () => {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return <Car className="h-4 w-4" />;
      case 'package':
        return <Package className="h-4 w-4" />;
      case 'trip':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const filterActivities = (activities: ActivityItem[], filter: string) => {
    if (filter === "all") return activities;
    return activities.filter(activity => activity.type === filter);
  };

  const ActivityCard = ({ activity }: { activity: ActivityItem }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon(activity.type)}
            <h3 className="font-semibold text-gray-800">{activity.title}</h3>
          </div>
          <Badge className={getStatusColor(activity.status)}>
            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">From:</span>
            <span>{activity.from}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">To:</span>
            <span>{activity.to}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{activity.date} at {activity.time}</span>
          </div>
          {activity.driver && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">Driver:</span>
              <span>{activity.driver}</span>
            </div>
          )}
          {activity.rider && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">Rider:</span>
              <span>{activity.rider}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${activity.price.toFixed(2)}</span>
          <div className="flex gap-2">
            {activity.phone && activity.status === 'active' && (
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout showNavigation={true}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Activity</h1>
          <p className="text-gray-600">Track your rides, packages, and trips</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ride">Rides</TabsTrigger>
            <TabsTrigger value="package">Packages</TabsTrigger>
            <TabsTrigger value="trip">Trips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {mockActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="ride" className="mt-6">
            <div className="space-y-4">
              {filterActivities(mockActivities, "ride").map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="package" className="mt-6">
            <div className="space-y-4">
              {filterActivities(mockActivities, "package").map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trip" className="mt-6">
            <div className="space-y-4">
              {filterActivities(mockActivities, "trip").map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {mockActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Car className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Activity Yet</h3>
            <p className="text-gray-500">Your rides, packages, and trips will appear here</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Activity;