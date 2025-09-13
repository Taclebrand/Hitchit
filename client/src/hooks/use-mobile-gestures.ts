import { useEffect, useRef } from 'react';
import { TouchGestureHandler, TouchGestureOptions } from '@/utils/mobile-optimizations';

export const useMobileGestures = (options: TouchGestureOptions) => {
  const elementRef = useRef<HTMLElement>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler | null>(null);

  useEffect(() => {
    if (elementRef.current && 'ontouchstart' in window) {
      gestureHandlerRef.current = new TouchGestureHandler(elementRef.current, options);
    }

    return () => {
      gestureHandlerRef.current?.destroy();
    };
  }, [options]);

  return elementRef;
};