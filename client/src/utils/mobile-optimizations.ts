// Mobile-specific optimizations and utilities

interface MobileDeviceInfo {
  isTouchDevice: boolean;
  hasNotch: boolean;
  isStandalone: boolean;
  devicePixelRatio: number;
  viewportHeight: number;
  viewportWidth: number;
  orientation: 'portrait' | 'landscape';
  isIOS: boolean;
  isAndroid: boolean;
  supportsVibration: boolean;
}

export const getMobileDeviceInfo = (): MobileDeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasNotch: window.screen?.height / window.screen?.width > 2 || 
              getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') !== '0px',
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    supportsVibration: 'vibrate' in navigator
  };
};

// Haptic feedback utilities
export const hapticFeedback = {
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate([15, 10, 15]);
    }
  },
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate([25, 15, 25]);
    }
  },
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 5, 10, 5, 30]);
    }
  },
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 25, 50, 25, 100]);
    }
  },
  selection: () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }
};

// Touch gesture utilities
export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  minSwipeDistance?: number;
  maxTapDistance?: number;
  longPressDelay?: number;
}

export class TouchGestureHandler {
  private element: HTMLElement;
  private options: TouchGestureOptions;
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private longPressTimer: NodeJS.Timeout | null = null;
  private isLongPress: boolean = false;
  
  // Store bound handler references to prevent memory leaks
  private boundHandleTouchStart: (event: TouchEvent) => void;
  private boundHandleTouchEnd: (event: TouchEvent) => void;
  private boundHandleTouchMove: (event: TouchEvent) => void;

  constructor(element: HTMLElement, options: TouchGestureOptions) {
    this.element = element;
    this.options = {
      minSwipeDistance: 50,
      maxTapDistance: 10,
      longPressDelay: 500,
      ...options
    };

    // Bind handlers once and store references
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);

    this.bindEvents();
  }

  private bindEvents() {
    // Use stored bound references and optimize passive settings
    this.element.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
    this.element.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true });
    this.element.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
  }

  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isLongPress = false;

    if (this.options.onLongPress) {
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.options.onLongPress?.();
        hapticFeedback.medium();
      }, this.options.longPressDelay);
    }
  }

  private handleTouchMove() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.isLongPress) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.startTime;

    // Handle tap
    if (distance < (this.options.maxTapDistance || 10) && duration < 200) {
      this.options.onTap?.();
      hapticFeedback.light();
      return;
    }

    // Handle swipes
    const minDistance = this.options.minSwipeDistance || 50;
    if (distance > minDistance) {
      const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;
      
      if (angle < 45) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.options.onSwipeRight?.();
        } else {
          this.options.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.options.onSwipeDown?.();
        } else {
          this.options.onSwipeUp?.();
        }
      }
      hapticFeedback.light();
    }
  }

  public destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Use the same bound references that were added to properly remove listeners
    this.element.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.element.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.element.removeEventListener('touchmove', this.boundHandleTouchMove);
  }
}

// Mobile performance optimizations
export const mobilePerformance = {
  // Optimize images for mobile
  optimizeImageLoading: () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    images.forEach(img => imageObserver.observe(img));
  },

  // Prevent zoom on input focus (for better UX on mobile)
  preventInputZoom: () => {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    inputs.forEach((input) => {
      (input as HTMLInputElement).style.fontSize = '16px';
    });
  },

  // Optimize scrolling performance
  optimizeScrolling: () => {
    const scrollElements = document.querySelectorAll('[data-scroll-optimize]');
    scrollElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      (htmlElement.style as any).webkitOverflowScrolling = 'touch';
      htmlElement.style.overscrollBehavior = 'contain';
    });
  },

  // Add momentum scrolling for iOS
  addMomentumScrolling: () => {
    (document.body.style as any).webkitOverflowScrolling = 'touch';
  }
};

// Mobile-specific CSS utility classes
export const addMobileCSSClasses = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Touch-friendly button sizes */
    .touch-target {
      min-height: 44px;
      min-width: 44px;
      position: relative;
    }
    
    /* Prevent text selection on touch */
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Safe area handling */
    .safe-area-top {
      padding-top: env(safe-area-inset-top, 0px);
    }
    
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    
    .safe-area-left {
      padding-left: env(safe-area-inset-left, 0px);
    }
    
    .safe-area-right {
      padding-right: env(safe-area-inset-right, 0px);
    }
    
    /* Mobile scroll optimization */
    .mobile-scroll {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    
    /* Mobile pull-to-refresh disable */
    .no-pull-refresh {
      overscroll-behavior-y: contain;
    }
    
    /* Smooth mobile interactions */
    .mobile-smooth {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transform: translateZ(0);
    }
    
    /* Mobile-optimized buttons */
    .mobile-button {
      cursor: pointer;
      transition: transform 0.1s ease, background-color 0.1s ease;
    }
    
    .mobile-button:active {
      transform: scale(0.98);
    }
    
    /* iOS specific fixes */
    @supports (-webkit-touch-callout: none) {
      .ios-fix {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
      }
    }
    
    /* High DPI optimizations */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .hidpi-optimized {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
    }
  `;
  document.head.appendChild(style);
};

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  const deviceInfo = getMobileDeviceInfo();
  
  if (deviceInfo.isTouchDevice) {
    document.body.classList.add('touch-device');
    addMobileCSSClasses();
    mobilePerformance.preventInputZoom();
    mobilePerformance.optimizeScrolling();
    mobilePerformance.addMomentumScrolling();
    mobilePerformance.optimizeImageLoading();
  }
  
  if (deviceInfo.isIOS) {
    document.body.classList.add('ios-device');
  }
  
  if (deviceInfo.isAndroid) {
    document.body.classList.add('android-device');
  }
  
  if (deviceInfo.hasNotch) {
    document.body.classList.add('has-notch');
  }
  
  if (deviceInfo.isStandalone) {
    document.body.classList.add('standalone-app');
  }

  return deviceInfo;
};