import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

// Animated form container for smooth transitions between steps
export const FormStepContainer = ({ 
  children, 
  isActive, 
  stepKey 
}: { 
  children: React.ReactNode, 
  isActive: boolean,
  stepKey: string 
}) => {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animated form field for smooth entry
export const AnimatedField = ({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode, 
  delay?: number 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  );
};

// Animated form title
export const AnimatedTitle = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Animated button with loading state
export const AnimatedButton = ({ 
  children, 
  isLoading = false,
  onClick,
  className,
  ...props
}: { 
  children: React.ReactNode, 
  isLoading?: boolean,
  onClick?: () => void,
  className?: string,
  [key: string]: any
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
    >
      <Button 
        onClick={onClick} 
        disabled={isLoading}
        className={className}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : children}
      </Button>
    </motion.div>
  );
};

// Success animation for completed form steps
export const SuccessIcon = () => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      className="bg-green-100 rounded-full p-3 text-green-600"
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
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </motion.svg>
    </motion.div>
  );
};

// Staggered children animation with delay between each child
export const StaggeredChildren = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        },
        hidden: {}
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 20 }
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};