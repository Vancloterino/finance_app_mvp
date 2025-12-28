/**
 * Onboarding context for managing walkthrough state.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'onboarding_status';
const TOTAL_STEPS = 5;

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if onboarding was completed or skipped
  useEffect(() => {
    const status = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    // Don't auto-start if completed or skipped
    if (!status || status === 'pending') {
      // Could auto-start here for new users, but we'll let them trigger it manually
    }
  }, []);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'skipped');
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed');
  }, []);

  const resetTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }, []);

  const value: OnboardingContextType = {
    isActive,
    currentStep,
    totalSteps: TOTAL_STEPS,
    startTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour,
    completeTour,
    resetTour,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
