import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Device viewport sizes for consistent mobile testing
export const DEVICE_SIZES = {
  mobileSmall: { width: 320, height: 568 }, // iPhone SE
  mobileMedium: { width: 375, height: 667 }, // iPhone 8
  mobileLarge: { width: 428, height: 926 }, // iPhone 13 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 800 },
};

// Custom render that includes our providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    viewport?: { width: number; height: number } 
  }
) => {
  // Set viewport size for the test
  if (options?.viewport) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: options.viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: options.viewport.height,
    });
    
    // Trigger a resize event
    window.dispatchEvent(new Event('resize'));
  }

  // Custom wrapper with providers
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <div>{children}</div>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Setup userEvent
export const setupUserEvent = () => userEvent.setup();

// Helper to simulate different device orientations
export const simulateOrientation = (isPortrait: boolean) => {
  Object.defineProperty(window.screen, 'orientation', {
    writable: true,
    configurable: true,
    value: {
      type: isPortrait ? 'portrait-primary' : 'landscape-primary',
      angle: isPortrait ? 0 : 90,
    },
  });
  window.dispatchEvent(new Event('orientationchange'));
};

// Helper to validate responsive styles match correctly
export const getComputedStyle = (element: HTMLElement, property: string) => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

// Helper function to test touchable elements 
export const isTouchTargetSized = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44; // 44px is the recommended minimum touch target size
};