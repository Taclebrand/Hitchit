import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Monitor, Zap, Wifi } from 'lucide-react';
import { showInstallPrompt, isPWAInstallable, isPWAInstalled, getPWADisplayMode } from '@/utils/pwa';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt = ({ onClose }: PWAInstallPromptProps) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [displayMode, setDisplayMode] = useState<string>('browser');

  useEffect(() => {
    const checkPWAStatus = () => {
      setIsInstallable(isPWAInstallable());
      setIsInstalled(isPWAInstalled());
      setDisplayMode(getPWADisplayMode());
    };

    checkPWAStatus();

    // Check periodically for changes
    const interval = setInterval(checkPWAStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        setIsInstalled(true);
        onClose?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-900 dark:text-green-100">
                App Installed!
              </CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                {displayMode}
              </Badge>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-green-700 dark:text-green-300">
            HitchIt is now installed and ready to use as a native app experience.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isInstallable) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                Progressive Web App
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                Active
              </Badge>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            HitchIt is running as a PWA with offline capabilities. Installation prompt will appear when available.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4 text-sm text-blue-600 dark:text-blue-400">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Fast Loading
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              Offline Ready
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg text-purple-900 dark:text-purple-100">
              Install HitchIt
            </CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
              Available
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-purple-700 dark:text-purple-300">
          Get the full app experience with offline access and push notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4 text-sm text-purple-600 dark:text-purple-400">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Native-like experience
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Works offline
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Instant loading
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              No app store needed
            </div>
          </div>
          <Button 
            onClick={handleInstall} 
            disabled={isInstalling}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="button-install-pwa"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};