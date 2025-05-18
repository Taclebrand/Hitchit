import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function AnimatedButton({
  children,
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        className={cn(className)}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}

export function AnimatedIconButton({
  children,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <AnimatedButton className={cn("p-2", className)} size="icon" {...props}>
      {children}
    </AnimatedButton>
  );
}

export function SuccessButton({
  children,
  className,
  duration = 1500,
  onComplete,
  ...props
}: AnimatedButtonProps & { duration?: number; onComplete?: () => void }) {
  const [showSuccess, setShowSuccess] = React.useState(false);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);
  };
  
  return (
    <AnimatedButton
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {showSuccess ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center"
        >
          <svg 
            className="mr-1 h-4 w-4 text-white" 
            fill="none" 
            height="24" 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="3" 
            viewBox="0 0 24 24" 
            width="24"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Success!</span>
        </motion.div>
      ) : (
        children
      )}
    </AnimatedButton>
  );
}