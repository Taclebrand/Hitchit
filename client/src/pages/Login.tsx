import FirebaseLoginForm from "@/components/FirebaseLoginForm";

export default function Login() {
  const handleSwitchToRegister = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white">
      <FirebaseLoginForm onSwitchToRegister={handleSwitchToRegister} />
    </div>
  );
}