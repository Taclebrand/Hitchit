import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmailVerification } from "@/lib/firebase";

interface EmailVerificationFlowProps {
  onVerified: () => void;
  onSkip?: () => void;
}

export default function EmailVerificationFlow({ onVerified, onSkip }: EmailVerificationFlowProps) {
  const { currentUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    // Check verification status periodically
    const interval = setInterval(async () => {
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          onVerified();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, onVerified]);

  const handleResendVerification = async () => {
    if (!currentUser) return;

    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast({
        title: "Verification Email Sent",
        description: `Verification email sent to ${currentUser.email}`,
      });
      setTimeLeft(60);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Could not send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!currentUser) return;

    setCheckingVerification(true);
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified!",
        });
        onVerified();
      } else {
        toast({
          title: "Not Verified Yet",
          description: "Please click the verification link in your email first.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Check Failed",
        description: error.message || "Could not check verification status.",
        variant: "destructive",
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentUser) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification email to <strong>{currentUser.email}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please check your email and click the verification link to continue.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Verification steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open the email from Firebase Auth</li>
                <li>Click the "Verify Email Address" button</li>
                <li>Return here and click "I've Verified My Email"</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCheckVerification}
            disabled={checkingVerification}
            className="w-full"
          >
            {checkingVerification ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "I've Verified My Email"
            )}
          </Button>

          <Button
            onClick={handleResendVerification}
            disabled={!canResend || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : canResend ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Resend in {formatTime(timeLeft)}
              </>
            )}
          </Button>

          {onSkip && (
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Can't find the email? Check your spam folder.
            <br />
            Verification links expire in 1 hour.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}