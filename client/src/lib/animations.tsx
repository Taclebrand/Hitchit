import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cn } from './utils';

export interface AnimatedContainerProps {
  children: React.ReactNode;
  animate?: boolean;
  delay?: number;
  className?: string;
  [key: string]: any;
}

// Subtle fade in animation for form elements and containers
export const AnimatedContainer = ({ 
  children, 
  animate = true, 
  delay = 0,
  className,
  ...props 
}: AnimatedContainerProps) => {
  return animate ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ) : (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Staggered animation for form fields
export const AnimatedFormField = ({ 
  children, 
  animate = true, 
  delay = 0,
  className,
  ...props 
}: AnimatedContainerProps) => {
  return animate ? (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ) : (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Appears with a subtle scale effect
export const PopIn = ({ 
  children, 
  animate = true, 
  delay = 0,
  className,
  ...props 
}: AnimatedContainerProps) => {
  return animate ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.2, 
        delay, 
        ease: [0.175, 0.885, 0.32, 1.275] // Custom easing for a slight bounce
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ) : (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Slide in animation - good for conditional elements/sections
export const SlideInFromRight = ({ 
  children, 
  animate = true,
  className,
  ...props 
}: AnimatedContainerProps) => {
  return (
    <AnimatePresence>
      {animate && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Success animation for form submission
export const SuccessCheck = ({ className }: { className?: string }) => {
  return (
    <motion.div 
      className={cn("rounded-full bg-green-100 p-2 inline-flex", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.1
      }}
    >
      <motion.svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-green-600"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </motion.svg>
    </motion.div>
  );
};

// Loading spinner with pulse animation
export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <motion.div 
      className={cn("h-5 w-5 rounded-full border-2 border-b-transparent", className)}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear"
      }}
    />
  );
};

// Animated form button
export const AnimatedButton = ({ 
  children, 
  isLoading = false,
  className,
  ...props 
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <LoadingSpinner className="mr-2 border-white" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Error shake animation
export const ErrorShake = ({ 
  children, 
  error = false,
  className,
  ...props 
}: {
  children: React.ReactNode;
  error?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <motion.div
      animate={error ? { 
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : {}}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Transition between steps
export const StepTransition = ({ 
  children, 
  step,
  className,
  ...props 
}: {
  children: React.ReactNode;
  step: number | string;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};