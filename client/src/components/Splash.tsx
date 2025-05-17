import { TruckIcon } from "@/lib/icons";

const Splash = () => {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50 splash-screen">
      <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3">
        <div className="w-full h-full relative">
          <TruckIcon className="w-12 h-12 text-primary" />
        </div>
      </div>
      <h1 className="text-white text-3xl font-bold mt-4">HitchIt</h1>
      <div className="mt-12">
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5"></circle>
          <circle className="loading-circle" cx="25" cy="25" r="20" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round"></circle>
        </svg>
      </div>
    </div>
  );
};

export default Splash;
