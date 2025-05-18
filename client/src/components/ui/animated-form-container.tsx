import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface AnimatedFormContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedFormContainer({
  children,
  className,
  delay = 0,
}: AnimatedFormContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut'
      }}
      className={cn("space-y-4", className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFormTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFormField({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.2,
        delay: 0.1 + index * 0.05,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFormButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}