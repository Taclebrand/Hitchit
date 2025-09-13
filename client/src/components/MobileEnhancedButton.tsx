import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/utils/mobile-optimizations';

interface MobileEnhancedButtonProps extends ButtonProps {
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';
  longPressAction?: () => void;
  swipeActions?: {
    left?: () => void;
    right?: () => void;
  };
}

export const MobileEnhancedButton: React.FC<MobileEnhancedButtonProps> = ({
  children,
  className,
  onClick,
  haptic = 'light',
  longPressAction,
  swipeActions,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const startPos = React.useRef({ x: 0, y: 0 });

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);
    
    if (longPressAction) {
      longPressTimer.current = setTimeout(() => {
        hapticFeedback.medium();
        longPressAction();
      }, 500);
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 10) {
      setIsPressed(false);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    setIsPressed(false);
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Handle swipes
    if (distance > 30 && swipeActions) {
      const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;
      
      if (angle < 45) {
        if (deltaX > 0 && swipeActions.right) {
          hapticFeedback.light();
          swipeActions.right();
          return;
        } else if (deltaX < 0 && swipeActions.left) {
          hapticFeedback.light();
          swipeActions.left();
          return;
        }
      }
    }
    
    // Handle regular click if no significant movement
    if (distance < 10) {
      hapticFeedback[haptic]();
      onClick?.(event as any);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Only handle mouse clicks if not on touch device
    if (!('ontouchstart' in window)) {
      hapticFeedback[haptic]();
      onClick?.(event);
    }
  };

  return (
    <Button
      {...props}
      className={cn(
        'touch-target mobile-button no-select transition-all duration-100',
        isPressed && 'scale-95 brightness-95',
        className
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid={`mobile-button-${(props as any)['data-testid'] || 'default'}`}
    >
      {children}
    </Button>
  );
};