import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageIcon, CarIcon, TrackingIcon } from "@/lib/icons";
import CloudBackground from "@/components/CloudBackground";

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingSlide = ({ 
  title, 
  description, 
  icon, 
  active, 
  totalSlides, 
  currentSlide, 
  onSkip, 
  onNext, 
  isLastSlide 
}: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  totalSlides: number;
  currentSlide: number;
  onSkip: () => void;
  onNext: () => void;
  isLastSlide: boolean;
}) => {
  if (!active) return null;
  
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-64 h-64 mb-8 rounded-t-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {icon}
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
        <p className="text-neutral-500 text-center">{description}</p>
      </div>
      <div className="pb-6">
        <ul className="onboarding-indicator flex items-center justify-center space-x-2 mb-8">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <li
              key={index}
              className={`h-2 rounded-full bg-${index === currentSlide ? "primary" : "neutral-200"} transition-all ${
                index === currentSlide ? "active" : "w-2"
              }`}
            ></li>
          ))}
        </ul>
        <div className="flex space-x-4">
          {!isLastSlide ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 py-4 px-6 bg-neutral-100 rounded-full text-neutral-500 font-medium" 
                onClick={onSkip}
              >
                Skip
              </Button>
              <Button 
                className="flex-1 py-4 px-6 bg-primary rounded-full text-white font-medium" 
                onClick={onNext}
              >
                Continue
              </Button>
            </>
          ) : (
            <Button 
              className="w-full py-4 bg-primary rounded-full text-white font-medium" 
              onClick={onNext}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Onboarding = ({ onComplete, onSkip }: OnboardingProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const slides = [
    {
      title: "Welcome to HitchIt",
      description: "Get ready to experience hassle-free transportation. We've got everything you need to travel with ease. Let's get started!",
      icon: <div className="relative w-64 h-64 flex items-end">
              <div className="h-1/2 w-full relative">
                <div className="absolute bottom-0 left-5 w-32 h-20 bg-secondary rounded-t-lg"></div>
                <div className="absolute bottom-6 left-14 w-14 h-10 bg-primary rounded"></div>
                <div className="absolute bottom-12 left-6 w-10 h-8 bg-primary-dark rounded"></div>
                <div className="absolute bottom-0 right-12 w-16 h-48 bg-neutral-700"></div>
              </div>
            </div>,
    },
    {
      title: "Your Journey, Your Way",
      description: "Get ready to experience hassle-free transportation. We've got everything you need to travel with ease. Let's get started!",
      icon: <div className="relative w-64 h-64 flex items-end">
              <div className="h-1/2 w-full relative">
                <div className="absolute bottom-0 left-1/4 w-24 h-16 bg-secondary rounded-lg"></div>
                <div className="absolute bottom-12 left-1/3 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="absolute bottom-0 right-12 w-16 h-48 bg-neutral-700"></div>
              </div>
            </div>,
    },
    {
      title: "Send & Track Packages",
      description: "Ship your packages with ease and track them in real-time. Fast, affordable, and reliable delivery at your fingertips.",
      icon: <div className="relative w-64 h-64 flex items-end">
              <div className="h-1/2 w-full relative">
                <div className="absolute bottom-10 left-1/4 w-40 h-20 bg-neutral-200 rounded-lg flex items-center justify-center">
                  <div className="w-4/5 h-3/5 bg-primary-light rounded"></div>
                </div>
                <div className="absolute bottom-0 right-8 w-20 h-40 bg-neutral-700"></div>
                <div className="absolute bottom-36 right-14 w-8 h-8 rounded-full bg-primary"></div>
              </div>
            </div>,
    },
  ];

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-white to-primary/5 z-40 overflow-hidden">
      <CloudBackground className="opacity-40" />
      <div className="h-full relative">
        {slides.map((slide, index) => (
          <OnboardingSlide
            key={index}
            title={slide.title}
            description={slide.description}
            icon={slide.icon}
            active={currentSlide === index}
            totalSlides={totalSlides}
            currentSlide={currentSlide}
            onSkip={onSkip}
            onNext={handleNext}
            isLastSlide={currentSlide === totalSlides - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
