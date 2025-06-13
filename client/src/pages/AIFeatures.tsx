import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import VehicleVerification from "@/components/VehicleVerification";
import VoiceAssistant from "@/components/VoiceAssistant";
import IntelligentTripMatching from "@/components/IntelligentTripMatching";
import PersonalizationDashboard from "@/components/PersonalizationDashboard";
import { Brain, Camera, Mic, Target, User, Sparkles } from "lucide-react";

export default function AIFeatures() {
  const [activeTab, setActiveTab] = useState("overview");

  const features = [
    {
      id: "vehicle-verification",
      title: "Vehicle Verification",
      description: "AI-powered computer vision for vehicle safety analysis and verification",
      icon: <Camera className="h-6 w-6" />,
      status: "active",
      capabilities: ["License plate recognition", "Vehicle type detection", "Safety analysis", "Damage assessment"]
    },
    {
      id: "voice-assistant",
      title: "Voice Assistant",
      description: "Conversational AI for hands-free booking and trip management",
      icon: <Mic className="h-6 w-6" />,
      status: "active",
      capabilities: ["Speech-to-text", "Natural language processing", "Voice booking", "Multi-turn conversation"]
    },
    {
      id: "trip-matching",
      title: "Intelligent Trip Matching",
      description: "Smart route optimization and demand-based trip recommendations",
      icon: <Target className="h-6 w-6" />,
      status: "active",
      capabilities: ["Route optimization", "Carbon footprint analysis", "Demand forecasting", "Cost efficiency"]
    },
    {
      id: "personalization",
      title: "Personalization Engine",
      description: "Machine learning-driven user experience and travel recommendations",
      icon: <User className="h-6 w-6" />,
      status: "active",
      capabilities: ["Behavior analysis", "Predictive recommendations", "UI adaptation", "Travel insights"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">AI-Powered Features</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of ride-sharing with our advanced artificial intelligence capabilities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vehicle-verification">Vehicle AI</TabsTrigger>
            <TabsTrigger value="voice-assistant">Voice AI</TabsTrigger>
            <TabsTrigger value="trip-matching">Trip AI</TabsTrigger>
            <TabsTrigger value="personalization">Personal AI</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <span>AI-First Platform</span>
                </CardTitle>
                <CardDescription>
                  Our platform integrates cutting-edge artificial intelligence to enhance every aspect of your ride-sharing experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Powered by:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">OpenAI GPT-4</Badge>
                      <Badge variant="outline">Computer Vision</Badge>
                      <Badge variant="outline">Machine Learning</Badge>
                      <Badge variant="outline">Natural Language Processing</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Benefits:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Enhanced safety through AI verification</li>
                      <li>• Optimized routes for efficiency</li>
                      <li>• Personalized user experience</li>
                      <li>• Voice-powered convenience</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card 
                  key={feature.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab(feature.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          {feature.icon}
                        </div>
                        <span>{feature.title}</span>
                      </div>
                      <Badge variant="secondary">{feature.status}</Badge>
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Capabilities:</h4>
                      <div className="flex flex-wrap gap-1">
                        {feature.capabilities.map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <div className="text-sm text-gray-600">Vehicle Verification Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">94.2%</div>
                    <div className="text-sm text-gray-600">Voice Recognition Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">87%</div>
                    <div className="text-sm text-gray-600">Route Optimization Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">92%</div>
                    <div className="text-sm text-gray-600">Personalization Satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Verification Tab */}
          <TabsContent value="vehicle-verification">
            <VehicleVerification />
          </TabsContent>

          {/* Voice Assistant Tab */}
          <TabsContent value="voice-assistant">
            <VoiceAssistant />
          </TabsContent>

          {/* Trip Matching Tab */}
          <TabsContent value="trip-matching">
            <IntelligentTripMatching />
          </TabsContent>

          {/* Personalization Tab */}
          <TabsContent value="personalization">
            <PersonalizationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}