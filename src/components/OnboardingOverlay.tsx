"use client";

import { useEffect, useState } from "react";

type OnboardingStep = 1 | 2 | 3;

const ONBOARDING_KEY = "taamun.onboarding.done";

const STEPS = [
  {
    title: "مرحباً بك في تمعّن",
    description: "28 يوماً من التمعّن القرآني العميق. رحلة نحو اكتشاف المعنى الحقيقي.",
  },
  {
    title: "كل يوم يبدأ بلحظة صمت",
    description: "ثم آية واحدة. وطبقة مخفية تكشفها بنفسك. بدون تسرع. بدون ضغط.",
  },
  {
    title: "لا كمال مطلوب",
    description: "تمعّن يسمح لك بأن تكون صادقاً مع نفسك. بحالتك. بمشاعرك. جاهز لتبدأ الآن؟",
  },
];

export function OnboardingOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDone = typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!isDone) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  const step = STEPS[currentStep - 1];
  const isLastStep = currentStep === 3;
  const progress = (currentStep / 3) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#15130f]/70 backdrop-blur-sm"
        onClick={() => handleComplete()}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#fcfaf7] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={() => handleComplete()}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#7d7362] hover:bg-[#f0e8db] transition-colors"
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Content */}
        <div className="space-y-4 text-center">
          <h2 className="tm-heading text-3xl leading-tight">{step.title}</h2>
          <p className="text-base text-[#5f5648] leading-7">{step.description}</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= currentStep ? "bg-[#8c7851]" : "bg-[#e1d7c7]"
                }`}
                style={{
                  width: i <= currentStep ? "24px" : "8px",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-[#7d7362]">
            {currentStep} من 3
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep((prev) => (prev - 1) as OnboardingStep)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#d8cdb9] text-[#5f5648] font-medium text-sm hover:bg-[#f9f3e7] transition-colors active:scale-95"
            >
              السابق
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 rounded-xl bg-[#8c7851] text-white font-medium text-sm hover:bg-[#7a6340] transition-colors active:scale-95"
          >
            {isLastStep ? "ابدأ التمعّن" : "التالي"}
          </button>
        </div>
      </div>
    </div>
  );
}
