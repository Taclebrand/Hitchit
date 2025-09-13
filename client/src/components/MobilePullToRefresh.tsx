import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/utils/mobile-optimizations';
import { RefreshCw } from 'lucide-react';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  refreshThreshold?: number;
  disabled?: boolean;
}

export const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  refreshThreshold = 60,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const lastTouchY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    lastTouchY.current = touch.clientY;
    isPulling.current = false;
    setIsReleased(false);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY.current;
    const containerElement = containerRef.current;
    
    if (!containerElement) return;
    
    // Only start pulling if at the top of the container
    const isAtTop = containerElement.scrollTop === 0;
    
    if (isAtTop && deltaY > 0) {
      isPulling.current = true;
      
      // Prevent default scrolling
      e.preventDefault();
      
      // Calculate pull distance with resistance
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, refreshThreshold * 1.5);
      
      setPullDistance(distance);
      
      // Haptic feedback when reaching threshold
      if (distance >= refreshThreshold && lastTouchY.current < currentY) {
        hapticFeedback.light();
      }
      
      lastTouchY.current = currentY;
    }
  }, [disabled, isRefreshing, refreshThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling.current) return;
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      setIsReleased(true);
      hapticFeedback.success();
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        hapticFeedback.error();
      } finally {
        setIsRefreshing(false);
        setIsReleased(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setIsReleased(true);
      setTimeout(() => {
        setPullDistance(0);
        setIsReleased(false);
      }, 200);
    }
    
    isPulling.current = false;
  }, [disabled, isRefreshing, pullDistance, refreshThreshold, onRefresh]);

  const pullPercentage = Math.min((pullDistance / refreshThreshold) * 100, 100);
  const isThresholdReached = pullDistance >= refreshThreshold;

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative h-full overflow-auto mobile-scroll',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pull-to-refresh-container"
    >
      {/* Pull to refresh indicator */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10',
          'bg-gradient-to-b from-blue-50 to-transparent',
          isReleased && 'transition-transform duration-300 ease-out'
        )}
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          transform: `translateY(${isReleased ? -pullDistance : 0}px)`
        }}
      >
        {pullDistance > 0 && (
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                'transition-all duration-200',
                isThresholdReached ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              )}
              style={{
                transform: `rotate(${pullPercentage * 3.6}deg)`,
                opacity: Math.min(pullDistance / 30, 1)
              }}
            >
              <RefreshCw 
                size={16} 
                className={cn(
                  'transition-all duration-200',
                  (isRefreshing || isThresholdReached) && 'animate-spin'
                )}
              />
            </div>
            <span 
              className={cn(
                'text-xs font-medium mt-1 transition-all duration-200',
                isThresholdReached ? 'text-blue-600' : 'text-gray-500'
              )}
              style={{ opacity: Math.min(pullDistance / 40, 1) }}
            >
              {isRefreshing ? 'Refreshing...' : 
               isThresholdReached ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div 
        className={cn(
          'transition-transform duration-200',
          isReleased && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: `translateY(${isReleased ? 0 : pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
};