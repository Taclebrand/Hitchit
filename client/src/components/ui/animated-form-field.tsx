import React from 'react';
import { motion } from 'framer-motion';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "./form";
import { cn } from "@/lib/utils";

interface AnimatedFormFieldProps {
  name: string;
  control: any;
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function AnimatedFormField({
  name,
  control,
  label,
  description,
  children,
  className,
  index = 0,
}: AnimatedFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: index * 0.05, // Stagger effect
            ease: 'easeOut'
          }}
        >
          <FormItem className={cn("space-y-1", className)}>
            {label && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 + 0.1 }}
              >
                <FormLabel>{label}</FormLabel>
              </motion.div>
            )}
            <motion.div
              whileTap={{ scale: 0.995 }}
              animate={fieldState?.error ? { 
                x: [0, -2, 2, -2, 2, 0],
                transition: { duration: 0.4 }
              } : {}}
            >
              <FormControl>{children}</FormControl>
            </motion.div>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={fieldState?.error ? { 
                opacity: 1, 
                height: 'auto',
                transition: { duration: 0.2 } 
              } : { 
                opacity: 0, 
                height: 0,
                transition: { duration: 0.2 } 
              }}
            >
              <FormMessage />
            </motion.div>
          </FormItem>
        </motion.div>
      )}
    />
  );
}

export function AnimatedFormSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}