import { useState } from "react";
import FirebaseRegistration from "@/components/FirebaseRegistration";
import FirebaseLoginForm from "@/components/FirebaseLoginForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);

  const handleRegistrationComplete = () => {
    console.log("Registration complete, user authenticated via Firebase");
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white">
      {isLogin ? (
        <FirebaseLoginForm onSwitchToRegister={handleSwitchToRegister} />
      ) : (
        <FirebaseRegistration 
          onComplete={handleRegistrationComplete}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
};

export default Auth;