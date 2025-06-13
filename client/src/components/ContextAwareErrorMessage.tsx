import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wifi, RefreshCw, Mail, Shield, Clock } from "lucide-react";

interface ErrorContext {
  type: 'network' | 'auth' | 'validation' | 'server' | 'permission' | 'timeout';
  code?: string;
  field?: string;
  action?: string;
}

interface ContextAwareErrorMessageProps {
  error: Error | string;
  context?: ErrorContext;
  onRetry?: () => void;
  className?: string;
}

export default function ContextAwareErrorMessage({ 
  error, 
  context, 
  onRetry, 
  className = "" 
}: ContextAwareErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const getContextualInfo = () => {
    if (!context) return { icon: AlertTriangle, title: "Something went wrong", suggestion: "Please try again." };

    switch (context.type) {
      case 'network':
        return {
          icon: Wifi,
          title: "Connection issue",
          suggestion: "Check your internet connection and try again. If you're on mobile data, try switching to Wi-Fi."
        };
      
      case 'auth':
        if (errorMessage.includes('user-not-found')) {
          return {
            icon: Mail,
            title: "Account not found",
            suggestion: "Double-check your email address or create a new account if you're new here."
          };
        }
        if (errorMessage.includes('wrong-password')) {
          return {
            icon: Shield,
            title: "Incorrect password",
            suggestion: "Try entering your password again, or use 'Forgot password?' to reset it."
          };
        }
        if (errorMessage.includes('too-many-requests')) {
          return {
            icon: Clock,
            title: "Too many attempts",
            suggestion: "Please wait a few minutes before trying again. This helps keep your account secure."
          };
        }
        return {
          icon: Shield,
          title: "Authentication problem",
          suggestion: "Please check your credentials and try signing in again."
        };
      
      case 'validation':
        return {
          icon: AlertTriangle,
          title: `Invalid ${context.field || 'input'}`,
          suggestion: `Please check your ${context.field || 'information'} and make sure it's in the correct format.`
        };
      
      case 'server':
        return {
          icon: RefreshCw,
          title: "Service temporarily unavailable",
          suggestion: "Our servers are experiencing high traffic. Please wait a moment and try again."
        };
      
      case 'permission':
        return {
          icon: Shield,
          title: "Permission denied",
          suggestion: "You don't have permission to perform this action. Contact support if you think this is an error."
        };
      
      case 'timeout':
        return {
          icon: Clock,
          title: "Request timed out",
          suggestion: "The operation took too long. Check your connection and try again."
        };
      
      default:
        return {
          icon: AlertTriangle,
          title: "Unexpected error",
          suggestion: "Something unexpected happened. Please try again or contact support if the problem persists."
        };
    }
  };

  const { icon: Icon, title, suggestion } = getContextualInfo();

  const getFriendlyNote = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    
    const notes = [
      `Don't worry - these things happen! 🌟`,
      `We're here to help you get back on track! 💪`,
      `No stress - let's sort this out together! ✨`,
      `Almost there - just a small hiccup! 🚀`,
      `Technical difficulties are temporary! 🔧`
    ];
    
    return `Good ${timeGreeting}! ${notes[Math.floor(Math.random() * notes.length)]}`;
  };

  return (
    <Alert variant="destructive" className={`border-red-200 bg-red-50 ${className}`}>
      <Icon className="h-4 w-4 text-red-600" />
      <AlertDescription className="space-y-3">
        <div>
          <div className="font-medium text-red-800 mb-1">{title}</div>
          <div className="text-red-700 text-sm mb-2">{suggestion}</div>
          
          {errorMessage && (
            <details className="text-xs text-red-600 mt-2">
              <summary className="cursor-pointer hover:text-red-800">Technical details</summary>
              <code className="block mt-1 p-2 bg-red-100 rounded text-red-800">{errorMessage}</code>
            </details>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-red-200">
          <div className="text-xs text-red-600 italic">{getFriendlyNote()}</div>
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}