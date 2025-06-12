import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface OtpVerificationProps {
  phoneNumber: string;
  onComplete: () => void;
  onBack: () => void;
}

const OtpVerification = ({ phoneNumber, onComplete, onBack }: OtpVerificationProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [activeInput, setActiveInput] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
  const [currentVerificationId, setCurrentVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize verification flow
    const emailVerificationId = localStorage.getItem('emailVerificationId');
    if (emailVerificationId) {
      setCurrentVerificationId(emailVerificationId);
      setVerificationType('email');
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (secondsLeft > 0 && !canResend) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !canResend) {
      setCanResend(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [secondsLeft, canResend]);

  const handleResendCode = () => {
    if (canResend) {
      // Reset OTP fields
      setOtp(Array(4).fill(""));
      setActiveInput(0);
      
      // Reset timer
      setSecondsLeft(60);
      setCanResend(false);
      
      // TODO: Call API to resend OTP
      console.log("Resending OTP code...");
    }
  };

  const handleVerification = async () => {
    if (!currentVerificationId) return;
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationId: parseInt(currentVerificationId),
          code: otpCode,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (verificationType === 'email') {
          // Email verified, now request phone verification
          const userPhone = localStorage.getItem('userPhone');
          if (userPhone && result.user) {
            const phoneResponse = await fetch('/api/auth/verify-phone', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: result.user.id,
                phone: userPhone,
              }),
            });

            const phoneResult = await phoneResponse.json();
            
            if (phoneResult.success) {
              // Switch to phone verification
              setVerificationType('phone');
              setCurrentVerificationId(phoneResult.verificationId.toString());
              setOtp(Array(6).fill(""));
              setActiveInput(0);
              setSecondsLeft(60);
              setCanResend(false);
              console.log('Phone verification code sent');
            }
          }
        } else {
          // Phone verified, complete registration
          if (result.token) {
            localStorage.setItem('authToken', result.token);
          }
          // Clean up stored data
          localStorage.removeItem('emailVerificationId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userPhone');
          onComplete();
        }
      } else {
        console.error('Verification failed:', result.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (value: string) => {
    if (value === "delete") {
      // Handle backspace
      const newOtp = [...otp];
      
      if (newOtp[activeInput]) {
        // If current input has a value, clear it
        newOtp[activeInput] = "";
        setOtp(newOtp);
      } else if (activeInput > 0) {
        // Otherwise, move to previous input and clear it
        const newActiveInput = activeInput - 1;
        newOtp[newActiveInput] = "";
        setOtp(newOtp);
        setActiveInput(newActiveInput);
      }
    } else {
      // Handle number input
      if (activeInput < otp.length) {
        const newOtp = [...otp];
        newOtp[activeInput] = value;
        setOtp(newOtp);
        
        // Move to next input if available
        if (activeInput < otp.length - 1) {
          setActiveInput(activeInput + 1);
        }
        
        // Check if all inputs are filled
        if (newOtp.every(digit => digit !== "")) {
          // Auto-verify when all digits are entered
          setTimeout(() => {
            handleVerification();
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white p-4 sm:p-6 flex flex-col safe-area-top safe-area-bottom overflow-y-auto no-scrollbar">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center mb-4 sm:mb-6 touch-target"
        aria-label="Go back"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Progress Indicator */}
      <div className="flex space-x-2 mb-8">
        <div className="h-1 bg-primary rounded-full flex-1"></div>
        <div className="h-1 bg-primary rounded-full flex-1"></div>
        <div className="h-1 bg-neutral-200 rounded-full flex-1"></div>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {verificationType === 'email' ? 'Verify Email' : 'Verify Phone'}
        </h1>
        <p className="text-gray-600">
          {verificationType === 'email' 
            ? `Check your email! We've sent a verification code to ${localStorage.getItem('userEmail')}. Enter the code below to verify your email.`
            : `Check your messages! We've sent a verification code to ${phoneNumber}. Enter the code below to verify your phone and complete registration.`
          }
        </p>
      </div>
      
      {/* OTP Input Fields */}
      <div className="flex justify-between mb-4 max-w-sm mx-auto w-full">
        {otp.map((digit, index) => (
          <div
            key={index}
            className={`w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-semibold border rounded-md ${
              index === activeInput
                ? "border-primary border-2"
                : digit
                ? "border-gray-300 bg-white"
                : "border-gray-200 bg-gray-50"
            }`}
            aria-label={`OTP digit ${index + 1}`}
          >
            {digit}
          </div>
        ))}
      </div>
      
      {/* Resend Timer */}
      <div className="text-center mb-8">
        {canResend ? (
          <button 
            onClick={handleResendCode}
            className="text-primary font-medium hover:underline"
          >
            Resend code
          </button>
        ) : (
          <p className="text-gray-500">
            You can resend the code in <span className="text-primary font-medium">{secondsLeft}</span> seconds
          </p>
        )}
      </div>
      
      {/* Keypad */}
      <div className="mt-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "delete"].map((key, index) => (
            <button
              key={index}
              onClick={() => handleKeypadPress(key.toString())}
              className="py-4 sm:py-5 flex items-center justify-center text-lg sm:text-xl font-semibold rounded-md hover:bg-gray-100 touch-target"
              aria-label={key === "delete" ? "Delete" : `Number ${key}`}
            >
              {key === "delete" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
        
        {/* Bottom Indicator */}
        <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mt-6 mb-2 safe-area-bottom"></div>
      </div>
    </div>
  );
};

export default OtpVerification;