import { useLocation } from "wouter";
import LoginForm from "@/components/LoginForm";
import CloudBackground from "@/components/CloudBackground";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLoginComplete = () => {
    setLocation("/home");
  };

  const handleGoogleLogin = () => {
    setLocation("/home");
  };

  const handleAppleLogin = () => {
    setLocation("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <CloudBackground />
      <div className="relative z-10 w-full">
        <LoginForm 
          onComplete={handleLoginComplete}
          onGoogleLogin={handleGoogleLogin}
          onAppleLogin={handleAppleLogin}
        />
      </div>
    </div>
  );
}