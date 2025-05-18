import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// SVG component for the custom icons
const DriverOptionIcons = () => (
  <svg width="430" height="698" viewBox="0 0 430 698" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 105C24 95.5719 24 90.8579 26.9289 87.9289C29.8579 85 34.5719 85 44 85H386C395.428 85 400.142 85 403.071 87.9289C406 90.8579 406 95.5719 406 105V149C406 158.428 406 163.142 403.071 166.071C400.142 169 395.428 169 386 169H44C34.5719 169 29.8579 169 26.9289 166.071C24 163.142 24 158.428 24 149V105Z" fill="#FAFAFA"/>
    <path d="M68.0001 141.199C75.8418 141.199 82.1987 134.842 82.1987 127C82.1987 119.158 75.8418 112.801 68.0001 112.801C60.1584 112.801 53.8014 119.158 53.8014 127C53.8014 134.842 60.1584 141.199 68.0001 141.199Z" fill="white"/>
    <path d="M67.9999 108.381C57.7166 108.381 49.3806 116.717 49.3806 127C49.3806 137.283 57.7166 145.619 67.9999 145.619C78.2833 145.619 86.6193 137.283 86.6193 127C86.6193 116.717 78.2833 108.381 67.9999 108.381ZM67.9999 140.944C60.2993 140.944 54.0559 134.701 54.0559 127C54.0559 119.299 60.2999 113.056 67.9999 113.056C75.6999 113.056 81.9439 119.3 81.9439 127C81.9439 134.7 75.6999 140.944 67.9999 140.944Z" fill="#3F3F3F"/>
    <path d="M68 122.496C66.8054 122.496 65.6598 122.97 64.8152 123.815C63.9705 124.66 63.496 125.805 63.496 127C63.496 128.195 63.9705 129.34 64.8152 130.185C65.6598 131.029 66.8054 131.504 68 131.504C69.1945 131.504 70.3401 131.029 71.1848 130.185C72.0294 129.34 72.504 128.195 72.504 127C72.504 125.805 72.0294 124.66 71.1848 123.815C70.3401 122.97 69.1945 122.496 68 122.496Z" fill="white"/>
    <path d="M67.9999 145.619C78.2831 145.619 86.6193 137.283 86.6193 127C86.6193 116.717 78.2831 108.381 67.9999 108.381C57.7168 108.381 49.3806 116.717 49.3806 127C49.3806 137.283 57.7168 145.619 67.9999 145.619Z" stroke="black" strokeWidth="0.5" strokeMiterlimit="10"/>
    <path d="M67.9999 141.199C75.8416 141.199 82.1986 134.842 82.1986 127C82.1986 119.158 75.8416 112.801 67.9999 112.801C60.1582 112.801 53.8013 119.158 53.8013 127C53.8013 134.842 60.1582 141.199 67.9999 141.199Z" stroke="black" strokeWidth="0.5" strokeMiterlimit="10"/>
    <path d="M58.0213 136.979L64.8153 130.185M71.6519 140.631L69.1659 131.351M81.6306 130.652L72.3506 128.166M77.9786 117.021L71.1846 123.815M64.3473 113.369L66.8346 122.65M54.3693 123.347L63.6486 125.834" stroke="black" strokeWidth="0.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M68 131.504C70.4875 131.504 72.504 129.487 72.504 127C72.504 124.512 70.4875 122.496 68 122.496C65.5125 122.496 63.496 124.512 63.496 127C63.496 129.487 65.5125 131.504 68 131.504Z" stroke="black" strokeWidth="0.5" strokeMiterlimit="10"/>
    <path d="M68 129C69.1046 129 70 128.105 70 127C70 125.895 69.1046 125 68 125C66.8954 125 66 125.895 66 127C66 128.105 66.8954 129 68 129Z" stroke="black" strokeWidth="0.5" strokeMiterlimit="10"/>
    
    <path d="M24 205C24 195.572 24 190.858 26.9289 187.929C29.8579 185 34.5719 185 44 185H386C395.428 185 400.142 185 403.071 187.929C406 190.858 406 195.572 406 205V249C406 258.428 406 263.142 403.071 266.071C400.142 269 395.428 269 386 269H44C34.5719 269 29.8579 269 26.9289 266.071C24 263.142 24 258.428 24 249V205Z" fill="#FAFAFA"/>
    <path d="M52 242.24H84V210.24H52V242.24Z" fill="black"/>
    
    <path d="M24 305C24 295.572 24 290.858 26.9289 287.929C29.8579 285 34.5719 285 44 285H386C395.428 285 400.142 285 403.071 287.929C406 290.858 406 295.572 406 305V349C406 358.428 406 363.142 403.071 366.071C400.142 369 395.428 369 386 369H44C34.5719 369 29.8579 369 26.9289 366.071C24 363.142 24 358.428 24 349V305Z" fill="#FAFAFA"/>
    <g clipPath="url(#clip0_13_2416)">
      <path d="M67.4526 304.815L47.8926 314.899C47.4651 315.15 47.3413 315.525 47.3451 316.069L47.3826 316.747L68.0338 327.337L88.6363 316.916C88.6363 316.916 88.6588 316.811 88.6588 316.444C88.6588 316.444 88.6401 315.96 88.5313 315.735C88.4113 315.48 88.1563 315.251 87.9913 315.112C87.5526 314.749 87.1138 314.426 86.3676 314.006C75.6688 307.957 68.6338 304.841 68.6338 304.841C68.1801 304.672 67.8051 304.612 67.4526 304.815Z" fill="#DEA66C"/>
      <path d="M47.6526 339.06C48.7926 339.814 50.8738 340.804 52.9776 341.944C57.8676 344.591 64.0476 347.809 67.1226 349.072C67.5388 349.245 67.7863 349.327 68.0751 349.342C68.2888 349.354 68.6413 349.211 68.6413 349.211C68.6413 349.211 68.0676 328.515 68.0338 327.334C68.0001 326.179 67.5163 325.796 67.0888 325.519C66.4213 325.091 64.9738 324.424 64.9738 324.424C64.9738 324.424 59.9038 321.904 54.8413 319.249C52.4338 317.985 50.4013 316.691 48.2151 315.626C47.8138 315.435 47.3413 315.251 47.3413 316.073C47.3376 316.721 47.3376 317.744 47.3451 318.461C47.3413 322.499 47.3563 337.875 47.6526 339.06Z" fill="#DEA66C"/>
      <path d="M88.0926 339.191L68.6826 349.2C68.3713 349.361 68.0001 349.136 68.0001 348.784L68.0338 327.341C68.0338 327.135 67.9701 326.681 67.9063 326.501C67.7301 325.976 68.1126 325.766 68.2851 325.68L87.5376 315.765C88.0476 315.503 88.6588 315.874 88.6588 316.448V338.269C88.6588 338.655 88.4413 339.011 88.0926 339.191Z" fill="#966239"/>
      <path opacity="0.5" d="M79.4225 320.846C79.4225 320.846 68.7837 326.287 68.6112 326.749C68.4387 327.206 76.9587 323.111 77.9562 322.597C79.085 322.016 87.95 317.276 87.95 316.755C87.9537 316.327 79.4225 320.846 79.4225 320.846Z" fill="#212121"/>
      <g opacity="0.5">
        <path d="M48.8037 337.819C50.1875 338.516 51.56 339.236 53.27 340.11V339.442C51.5675 338.572 50.1912 337.856 48.8037 337.151V337.819ZM51.7175 338.122C52.1075 338.321 52.3025 338.422 52.67 338.61C52.6737 337.447 52.6737 336.866 52.6775 335.704C52.31 335.516 52.1187 335.419 51.7325 335.22C51.725 336.382 51.7212 336.96 51.7175 338.122ZM49.295 336.877C49.6175 337.042 49.7975 337.136 50.165 337.324L50.1837 334.429C49.8125 334.237 49.6325 334.147 49.3062 333.975C49.3025 335.137 49.2987 335.715 49.295 336.877Z" fill="#212121"/>
        <path d="M51.1062 335.246C51.995 335.7 52.4675 335.944 53.2512 336.341C52.8612 335.632 52.6475 335.272 52.22 334.545C51.7812 334.83 51.5525 334.969 51.1062 335.246ZM48.8037 334.065C49.4675 334.41 49.9137 334.639 50.7912 335.089C50.3562 334.357 50.1387 333.994 49.7375 333.277C49.3287 333.574 49.1375 333.727 48.8037 334.065Z" fill="#212121"/>
      </g>
      <g opacity="0.5">
        <path d="M55.9287 341.025C56.24 341.186 56.4012 341.272 56.7125 341.434C56.69 340.054 56.6787 339.364 56.6525 337.984C56.3525 337.826 56.2025 337.748 55.9025 337.594C55.9137 338.966 55.9175 339.653 55.9287 341.025Z" fill="#212121"/>
        <path d="M54.7849 340.781C55.9249 341.381 56.8099 341.831 57.9049 342.416C57.8974 342.023 57.5937 341.546 57.1812 341.325C56.5362 340.984 56.1687 340.796 55.5162 340.455C55.0962 340.241 54.7849 340.395 54.7849 340.781Z" fill="#212121"/>
      </g>
      <path d="M81.7775 318.559C81.59 318.42 61.4562 307.901 61.4562 307.901L55.2087 311.13L75.8525 321.776L75.8637 321.787L81.905 318.694C81.905 318.694 81.8937 318.664 81.86 318.626C81.8337 318.604 81.7887 318.57 81.7775 318.559Z" fill="#FFE0B2"/>
      <path d="M81.875 318.649C78.455 320.333 75.8525 321.776 75.8525 321.776C75.9388 321.863 75.9425 321.975 75.9425 322.031C75.9313 322.466 75.9238 322.811 75.9125 323.243C75.86 325.474 75.83 327.709 75.755 329.94C76.0063 329.79 76.31 330.12 76.5388 329.94C76.8913 329.663 77.6413 328.44 77.7538 328.403C77.9038 328.354 78.065 328.391 78.2188 328.384C78.8938 328.346 80.405 326.97 80.7275 326.906C81.0388 326.846 82.0663 327.045 82.0663 327.045C82.0663 327.045 81.995 320.239 81.9688 319.034C81.9425 317.834 81.875 318.649 81.875 318.649Z" fill="#FF80AB"/>
    </g>
    
    <defs>
      <clipPath id="clip0_13_2416">
        <rect width="48" height="48" fill="white" transform="translate(44 303)"/>
      </clipPath>
    </defs>
  </svg>
);

interface DriverOptionProps {
  id: string;
  name: string;
  active?: boolean;
  onClick: () => void;
}

const DriverOption: React.FC<DriverOptionProps> = ({ id, name, active = false, onClick }) => {
  return (
    <div 
      className={cn(
        "flex items-center p-4 mb-4 rounded-lg border cursor-pointer transition-all",
        active 
          ? "border-primary bg-primary/5" 
          : "border-gray-200 bg-[#FAFAFA]"
      )}
      onClick={onClick}
    >
      <div className="mr-4">
        {/* We'll use different icons based on the option id */}
        {id === 'carplay' && (
          <div className="w-12 h-12 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V15C2 16.1046 2.89543 17 4 17H20C21.1046 17 22 16.1046 22 15V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12H6.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {id === 'ac' && (
          <div className="w-12 h-12 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7L12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.5 10.5L8.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 10.5L15.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {id === 'bikerack' && (
          <div className="w-12 h-12 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 10L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10.5L14.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10.5L9.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15L9.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-base font-medium text-gray-800">{name}</h3>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        active 
          ? "border-primary" 
          : "border-gray-300"
      )}>
        {active && <div className="w-3 h-3 rounded-full bg-primary"></div>}
      </div>
    </div>
  );
};

interface DriverRegistrationOptionsProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DriverRegistrationOptions: React.FC<DriverRegistrationOptionsProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({
    carplay: false,
    ac: false,
    bikerack: false
  });

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleContinue = () => {
    // Send selected options to backend or process them
    // For now we'll just call onComplete
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-white p-4 sm:p-6 flex flex-col safe-area-top safe-area-bottom">
      {/* Progress Indicator */}
      <div className="flex space-x-2 mb-8">
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
        <div className="h-1.5 bg-primary rounded-full flex-1"></div>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Driver Registration</h1>
        <p className="text-gray-600">
          Select the amenities your vehicle has to offer passengers.
        </p>
      </div>
      
      {/* Options */}
      <div className="flex-1 overflow-y-auto">
        <DriverOption 
          id="carplay" 
          name="Apple CarPlay / Android Auto" 
          active={selectedOptions.carplay} 
          onClick={() => toggleOption('carplay')}
        />
        
        <DriverOption 
          id="ac" 
          name="Air Conditioning" 
          active={selectedOptions.ac} 
          onClick={() => toggleOption('ac')}
        />
        
        <DriverOption 
          id="bikerack" 
          name="Bike Rack" 
          active={selectedOptions.bikerack} 
          onClick={() => toggleOption('bikerack')}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4 mt-8">
        <Button
          onClick={handleContinue}
          className="w-full py-6 rounded-full bg-primary"
        >
          Continue
        </Button>
        
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full py-3 text-gray-600"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};

export default DriverRegistrationOptions;