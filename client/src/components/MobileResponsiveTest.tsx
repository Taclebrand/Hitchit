import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * MobileResponsiveTest
 * A component to test mobile responsiveness by displaying viewport information
 * and providing a way to test touch interactions
 */
export const MobileResponsiveTest = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [hasNotch, setHasNotch] = useState(false);
  const [orientationType, setOrientationType] = useState('portrait');
  const [touchEvents, setTouchEvents] = useState(0);
  
  useEffect(() => {
    // Update viewport size on resize
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setOrientationType(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };
    
    // Check for notch
    const checkForNotch = () => {
      // Try to detect a notch by checking if safe area inset top is > 0
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-top')
        .trim();
      
      setHasNotch(safeAreaTop !== '0px' && safeAreaTop !== '');
    };
    
    // Set up event listeners
    window.addEventListener('resize', handleResize);
    handleResize();
    checkForNotch();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle touch events
  const handleTouch = () => {
    setTouchEvents(prev => prev + 1);
  };
  
  return (
    <div className="fixed inset-0 bg-white safe-area-top safe-area-bottom p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-4">Mobile Responsive Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Device Information</h2>
          <ul className="space-y-1 text-sm">
            <li><strong>Viewport:</strong> {viewport.width}px × {viewport.height}px</li>
            <li><strong>Orientation:</strong> {orientationType}</li>
            <li><strong>Device Pixel Ratio:</strong> {window.devicePixelRatio}</li>
            <li><strong>Has Notch:</strong> {hasNotch ? 'Yes' : 'No/Unknown'}</li>
            <li><strong>Touch Enabled:</strong> {('ontouchstart' in window) ? 'Yes' : 'No'}</li>
          </ul>
        </div>
        
        <div className="p-4 border border-primary rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Touch Target Test</h2>
          <p className="text-sm mb-2">Tap the buttons below to test touch targets</p>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="h-12 touch-target"
              onTouchStart={handleTouch}
              onClick={handleTouch}
            >
              Standard Button
            </Button>
            
            <Button 
              variant="outline" 
              className="h-12 w-12 p-0 flex items-center justify-center touch-target"
              onTouchStart={handleTouch}
              onClick={handleTouch}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </div>
          
          <p className="text-sm mt-2">
            Touch events registered: <strong>{touchEvents}</strong>
          </p>
        </div>
        
        <div className="p-4 bg-secondary rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Text Scaling Test</h2>
          <p className="text-xs mb-1">Extra Small Text</p>
          <p className="text-sm mb-1">Small Text</p>
          <p className="mb-1">Base Text</p>
          <p className="text-lg mb-1">Large Text</p>
          <p className="text-xl mb-1">Extra Large Text</p>
        </div>
      </div>
      
      <div className="mt-auto text-center">
        <p className="text-sm text-gray-500 mb-2">
          This component helps test responsive design across different mobile devices
        </p>
        <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default MobileResponsiveTest;