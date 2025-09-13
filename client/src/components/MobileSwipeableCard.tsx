import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { hapticFeedback } from '@/utils/mobile-optimizations';

interface MobileSwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  swipeIndicators?: boolean;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const MobileSwipeableCard: React.FC<MobileSwipeableCardProps> = ({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  swipeIndicators = false,
  ...props
}) => {
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  const [isPressed, setIsPressed] = React.useState(false);

  const cardRef = useMobileGestures({
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        setSwipeDirection('left');
        hapticFeedback.medium();
        setTimeout(() => {
          onSwipeLeft();
          setSwipeDirection(null);
        }, 150);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        setSwipeDirection('right');
        hapticFeedback.medium();
        setTimeout(() => {
          onSwipeRight();
          setSwipeDirection(null);
        }, 150);
      }
    },
    onLongPress: () => {
      if (onLongPress) {
        setIsPressed(true);
        onLongPress();
        setTimeout(() => setIsPressed(false), 200);
      }
    },
    onTap: () => {
      hapticFeedback.selection();
    },
    minSwipeDistance: 80
  });

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Indicators */}
      {swipeIndicators && (onSwipeLeft || onSwipeRight) && (
        <>
          {onSwipeLeft && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none opacity-30">
              <div className="flex items-center text-red-500">
                <span className="text-sm font-medium mr-1">Swipe</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                </svg>
              </div>
            </div>
          )}
          {onSwipeRight && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none opacity-30">
              <div className="flex items-center text-green-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
                </svg>
                <span className="text-sm font-medium ml-1">Swipe</span>
              </div>
            </div>
          )}
        </>
      )}

      <Card
        ref={cardRef as any}
        {...props}
        className={cn(
          'mobile-smooth transition-all duration-200 cursor-pointer',
          swipeDirection === 'left' && 'transform -translate-x-2 bg-red-50 border-red-200',
          swipeDirection === 'right' && 'transform translate-x-2 bg-green-50 border-green-200',
          isPressed && 'scale-98 shadow-sm',
          className
        )}
        data-testid={`swipeable-card-${(props as any)['data-testid'] || 'default'}`}
      >
        {children}
      </Card>
    </div>
  );
};