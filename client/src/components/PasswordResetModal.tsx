import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/firebase";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function PasswordResetModal({ isOpen, onClose, initialEmail = "" }: PasswordResetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await resetPassword(values.email);
      setSentToEmail(values.email);
      setEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: `Password reset instructions sent to ${values.email}`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      if (error.code === 'auth/user-not-found') {
        toast({
          title: "Email Not Found",
          description: "No account found with this email address. Please check your email or create a new account.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/too-many-requests') {
        toast({
          title: "Too Many Requests",
          description: "Too many password reset attempts. Please wait a few minutes before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Failed",
          description: error.message || "Failed to send password reset email. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setSentToEmail("");
    form.reset();
    onClose();
  };

  const handleResendEmail = async () => {
    if (sentToEmail) {
      setIsLoading(true);
      try {
        await resetPassword(sentToEmail);
        toast({
          title: "Email Resent",
          description: `Password reset instructions sent again to ${sentToEmail}`,
        });
      } catch (error: any) {
        toast({
          title: "Resend Failed",
          description: error.message || "Failed to resend email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Reset Your Password
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? "Check your email for reset instructions"
              : "Enter your email address to receive password reset instructions"
            }
          </DialogDescription>
        </DialogHeader>

        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Email Sent Successfully</p>
                <p className="text-sm text-green-600">
                  Reset instructions sent to <strong>{sentToEmail}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Next Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check your email inbox for a message from Firebase Auth</li>
                    <li>If you don't see it, check your spam/junk folder</li>
                    <li>Click the reset link in the email</li>
                    <li>Enter your new password when prompted</li>
                    <li>Return here to sign in with your new password</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Resending..." : "Resend Email"}
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}