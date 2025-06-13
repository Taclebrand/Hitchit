import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Settings, Copy, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function FirebaseSetupGuide() {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepNumber);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const setupSteps = [
    {
      title: "Create Firebase Project",
      description: "Go to Firebase Console and create a new project",
      action: "Visit Firebase Console",
      url: "https://console.firebase.google.com/",
      details: "Click 'Create a project' and follow the setup wizard"
    },
    {
      title: "Add Web App",
      description: "Register your web application with Firebase",
      action: "Add App",
      details: "Click 'Add app' → Select Web platform (</>) → Register app"
    },
    {
      title: "Get Configuration",
      description: "Copy your Firebase configuration values",
      action: "Get Config",
      details: "From 'SDK setup and configuration', copy apiKey, projectId, and appId",
      copyable: `apiKey: "AIza..." // Your API key
projectId: "your-project-id" // Your project ID  
appId: "1:123..." // Your app ID`
    },
    {
      title: "Enable Authentication",
      description: "Set up authentication methods",
      action: "Configure Auth",
      details: "Go to Authentication → Sign-in method → Enable Email/Password and Google"
    },
    {
      title: "Add Authorized Domain",
      description: "Allow your Replit domain for authentication",
      action: "Add Domain",
      details: "In Authentication → Settings → Authorized domains, add your Replit app domain"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Firebase Setup Required</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            To enable authentication features, you'll need to set up Firebase. 
            Follow these steps to get your app connected.
          </p>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Good news!</strong> All other features are working perfectly. 
            Once Firebase is configured, you'll have full authentication capabilities.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {setupSteps.map((step, index) => (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-sm">
                      Step {index + 1}
                    </Badge>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </div>
                  {step.url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(step.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {step.action}
                    </Button>
                  )}
                </div>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{step.details}</p>
                {step.copyable && (
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      <code>{step.copyable}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(step.copyable!, index)}
                    >
                      <Copy className="h-4 w-4" />
                      {copiedStep === index ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              What You'll Get
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Authentication Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Email/password registration & login</li>
                  <li>• Google Sign-In integration</li>
                  <li>• Password reset functionality</li>
                  <li>• Secure user sessions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Already Working:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Accessibility features & high contrast mode</li>
                  <li>• Quick profile customization</li>
                  <li>• Context-aware error messaging</li>
                  <li>• Responsive design & animations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Want to see the features in action?</h3>
              <p className="text-sm text-muted-foreground">
                While you set up Firebase, explore the accessibility and user experience improvements already working.
              </p>
              <Button 
                onClick={() => window.location.href = '/demo-features'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Try Interactive Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Check the{" "}
            <button 
              className="text-blue-600 hover:underline"
              onClick={() => window.open("https://firebase.google.com/docs/web/setup", '_blank')}
            >
              Firebase documentation
            </button>{" "}
            for detailed setup instructions.
          </p>
        </div>
      </div>
    </div>
  );
}