/**
 * Mobile UI Test Runner
 * 
 * This utility helps run tests across different mobile device profiles
 * to ensure UI consistency across various screen sizes.
 */
import { DEVICE_SIZES } from './test-utils';

// Device profiles for testing
export const deviceProfiles = [
  { 
    name: 'iPhone SE', 
    viewport: DEVICE_SIZES.mobileSmall,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    touchEnabled: true,
    hasNotch: false
  },
  { 
    name: 'iPhone 13', 
    viewport: DEVICE_SIZES.mobileMedium,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    touchEnabled: true,
    hasNotch: true
  },
  { 
    name: 'iPhone 13 Pro Max', 
    viewport: DEVICE_SIZES.mobileLarge,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    touchEnabled: true,
    hasNotch: true
  },
  { 
    name: 'Samsung Galaxy S21', 
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G998U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36',
    touchEnabled: true,
    hasNotch: true
  }
];

// Set up device environment for testing
export function setupDeviceEnvironment(profile: typeof deviceProfiles[0]) {
  // Set viewport dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: profile.viewport.width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: profile.viewport.height,
  });
  
  // Set user agent
  Object.defineProperty(window.navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: profile.userAgent,
  });
  
  // Simulate touch capability
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: profile.touchEnabled ? 5 : 0,
  });
  
  // Set safe area insets for notched devices
  if (profile.hasNotch) {
    const safeAreaValue = 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.documentElement.style.setProperty('--safe-area-inset', safeAreaValue);
  } else {
    document.documentElement.style.setProperty('--safe-area-inset', '0px 0px 0px 0px');
  }
  
  // Dispatch resize event
  window.dispatchEvent(new Event('resize'));
}

// Run test on all devices
export function runTestOnAllDevices(testFn: (profile: typeof deviceProfiles[0]) => void) {
  deviceProfiles.forEach(profile => {
    describe(`UI on ${profile.name}`, () => {
      beforeEach(() => {
        setupDeviceEnvironment(profile);
      });
      
      testFn(profile);
    });
  });
}