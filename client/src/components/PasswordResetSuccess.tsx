import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/firebase";

interface PasswordResetSuccessProps {
  email: string;
  onBackToLogin: () => void;
}

export default function PasswordResetSuccess({ email, onBackToLogin }: PasswordResetSuccessProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resetPassword(email);
      toast({
        title: "Email Resent",
        description: `Password reset instructions sent again to ${email}`,
      });
      setTimeLeft(60);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-xl">Check Your Email</CardTitle>
        <CardDescription>
          We've sent password reset instructions to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">What to do next:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox for a message from Firebase Auth</li>
                <li>Look in your spam/junk folder if you don't see it</li>
                <li>Click the "Reset Password" link in the email</li>
                <li>Create a new secure password</li>
                <li>Return here to sign in with your new password</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Email not arriving?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Ensure {email} is correct</li>
                <li>Wait a few minutes - emails can take time to deliver</li>
                <li>Check if your email provider blocks automated emails</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleResendEmail}
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
                Resend Email
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Resend in {formatTime(timeLeft)}
              </>
            )}
          </Button>

          <Button onClick={onBackToLogin} className="w-full">
            Back to Login
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Reset links expire in 1 hour for security.
            <br />
            Still having trouble? Contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}