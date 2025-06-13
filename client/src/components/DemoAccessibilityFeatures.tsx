import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import QuickProfileCustomization from "@/components/QuickProfileCustomization";
import ContextAwareErrorMessage from "@/components/ContextAwareErrorMessage";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { 
  Eye, 
  Type, 
  Palette, 
  User, 
  AlertTriangle,
  Settings,
  Zap,
  ChevronRight,
  Play,
  Edit2,
  Camera
} from "lucide-react";

export function DemoAccessibilityFeatures() {
  const { 
    highContrast, 
    toggleHighContrast, 
    fontSize, 
    setFontSize, 
    reducedMotion, 
    toggleReducedMotion 
  } = useAccessibility();

  const [demoError, setDemoError] = useState<any>(null);
  const [showProfileDemo, setShowProfileDemo] = useState(false);

  const triggerDemoError = () => {
    setDemoError({
      code: 'auth/invalid-email',
      message: 'The email address is badly formatted.'
    });
  };

  const clearDemoError = () => {
    setDemoError(null);
  };

  const mockUser = {
    displayName: "Demo User",
    email: "demo@example.com",
    photoURL: null
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className={`absolute inset-0 rounded-full bg-purple-400 opacity-20 ${!reducedMotion ? 'animate-ping' : ''}`} />
            </div>
            <h1 className="text-3xl font-bold">Accessibility Features Demo</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Experience the enhanced accessibility and user experience features while Firebase is being configured.
            All settings are saved and will work perfectly once authentication is enabled.
          </p>
        </div>

        {/* Live Controls */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className={`h-5 w-5 ${!reducedMotion ? 'animate-spin' : ''}`} />
              <span>Live Accessibility Controls</span>
            </CardTitle>
            <CardDescription>
              Toggle these settings to see immediate changes throughout the interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* High Contrast */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">High Contrast</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Enhanced visibility
                  </span>
                  <Switch 
                    checked={highContrast} 
                    onCheckedChange={toggleHighContrast}
                  />
                </div>
                <Badge variant={highContrast ? "default" : "secondary"}>
                  {highContrast ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span className="font-medium">Font Size</span>
                </div>
                <div className="flex space-x-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={fontSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFontSize(size)}
                      className="capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
                <Badge variant="outline">Current: {fontSize}</Badge>
              </div>

              {/* Reduced Motion */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span className="font-medium">Animations</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reduce motion
                  </span>
                  <Switch 
                    checked={reducedMotion} 
                    onCheckedChange={toggleReducedMotion}
                  />
                </div>
                <Badge variant={reducedMotion ? "destructive" : "default"}>
                  {reducedMotion ? "Reduced" : "Full"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Profile Customization Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Quick Profile Customization</span>
              </CardTitle>
              <CardDescription>
                Inline editing with visual feedback and smooth animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setShowProfileDemo(!showProfileDemo)}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {showProfileDemo ? "Hide Demo" : "Show Profile Demo"}
              </Button>
              
              {showProfileDemo && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                          {mockUser.displayName.charAt(0)}
                        </div>
                        <div className={`absolute inset-0 rounded-full bg-blue-400 opacity-30 ${!reducedMotion ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{mockUser.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                        <Badge variant="secondary" className="mt-1">Demo Profile</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Name
                      </Button>
                      <Button size="sm" variant="outline">
                        <Camera className="h-3 w-3 mr-1" />
                        Change Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Click avatar to see glow animation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Inline name editing with smooth transitions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Respects reduced motion preference</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context-Aware Error Messages Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Smart Error Messages</span>
              </CardTitle>
              <CardDescription>
                Context-aware errors with helpful guidance and retry options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={triggerDemoError}
                  variant="outline"
                  disabled={!!demoError}
                >
                  Trigger Demo Error
                </Button>
                <Button 
                  onClick={clearDemoError}
                  variant="ghost"
                  disabled={!demoError}
                >
                  Clear Error
                </Button>
              </div>

              {demoError && (
                <ContextAwareErrorMessage 
                  error={demoError}
                  context={{ 
                    type: 'auth',
                    code: demoError.code,
                    action: 'demo'
                  }}
                  onRetry={clearDemoError}
                />
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Friendly, encouraging error messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Specific guidance based on error type</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>One-click retry functionality</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Features Working</CardTitle>
            <CardDescription>
              These accessibility and UX improvements are fully functional and will enhance your app experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Accessibility</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• High contrast mode for better visibility</li>
                  <li>• Adjustable font sizes (small/medium/large)</li>
                  <li>• Reduced motion option</li>
                  <li>• Keyboard navigation support</li>
                  <li>• Screen reader friendly</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">User Experience</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Smooth animations and transitions</li>
                  <li>• Inline profile editing</li>
                  <li>• Context-aware error handling</li>
                  <li>• Responsive design</li>
                  <li>• Persistent settings</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Ready for Firebase</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete authentication system</li>
                  <li>• Email/password & Google Sign-In</li>
                  <li>• Password reset with guidance</li>
                  <li>• Secure user sessions</li>
                  <li>• Profile management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}