import React, { useState } from 'react';
import Card from './Card';

export interface WalkthroughStep {
  title: string;
  description: string;
  icon: string;
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  onComplete: () => void;
  role: 'student' | 'parent';
}

const Walkthrough: React.FC<WalkthroughProps> = ({ steps, onComplete, role }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const accentButton =
    role === 'student'
      ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105'
      : 'bg-gradient-to-r from-[#4f46e5] to-[#0284c7] hover:brightness-105';

  const activeBar =
    role === 'student'
      ? 'bg-gradient-to-r from-[#0d9488] to-[#06b6d4]'
      : 'bg-gradient-to-r from-[#4f46e5] to-[#0284c7]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0f3d3e]/35 backdrop-blur-sm">
      <Card className="w-full max-w-sm bg-white border border-[#bde6de] shadow-xl p-7 relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#14b8a6] via-[#0ea5e9] to-[#f97316]" />

        {/* Progress track */}
        <div className="flex justify-center space-x-2 mb-7 mt-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentStep ? `w-8 ${activeBar}` : 'w-2 bg-[#d4ece8]'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ccf7ef] via-[#e0f2fe] to-[#fff1e6] border border-[#bde6de] flex items-center justify-center text-4xl mb-5">
            {steps[currentStep].icon}
          </div>

          <h2 className="text-2xl font-bold mb-2.5 font-serif-elegant text-[#0f3d3e] text-balance">
            {steps[currentStep].title}
          </h2>

          <p className="text-sm text-[#335c5d] leading-relaxed mb-7 min-h-[72px]">
            {steps[currentStep].description}
          </p>

          <button
            type="button"
            onClick={handleNext}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] ${accentButton}`}
          >
            {isLastStep ? "Let's Get Started" : 'Next'}
          </button>

          {!isLastStep && (
            <button
              type="button"
              onClick={onComplete}
              className="mt-3 text-xs font-semibold text-[#4b7476] hover:text-[#0f3d3e] py-2 px-4 transition-colors min-h-[40px]"
            >
              Skip Tour
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Walkthrough;
