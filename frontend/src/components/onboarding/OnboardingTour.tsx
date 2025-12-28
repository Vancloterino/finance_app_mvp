/**
 * Onboarding tour walkthrough component.
 */
import React, { useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to FinanceApp!',
    description:
      'Manage shared finances with ease. Create spaces, track pledges, and handle payouts seamlessly.',
  },
  {
    title: 'Create a Space',
    description:
      'Start by creating a space for your group. A space is where you and your members can pool money together for shared goals.',
  },
  {
    title: 'Invite Members',
    description:
      'Add members to your space by sending email invitations. Members can view balances and contribute to the shared fund.',
  },
  {
    title: 'Create Pledges',
    description:
      'Set up pledges to collect contributions from members. Track who has paid and who still owes.',
  },
  {
    title: 'Request Payouts',
    description:
      'When it\'s time to spend, create a payout request. Members will approve, and you can execute the payment.',
  },
];

export const OnboardingTour: React.FC = () => {
  const { isActive, currentStep, nextStep, previousStep, skipTour, completeTour } = useOnboarding();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'ArrowRight' && !isLastStep) {
        nextStep();
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        previousStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, isFirstStep, isLastStep, nextStep, previousStep, skipTour]);

  if (!isActive) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative">
        {/* Close Button */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label="Close onboarding tour"
          tabIndex={0}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2
            id="onboarding-title"
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {step.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {step.description}
          </p>

          {/* Optional illustration placeholder */}
          {step.image && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
              <span className="text-gray-400">Illustration: {step.title}</span>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <Button
                variant="secondary"
                onClick={previousStep}
                className="flex items-center gap-2"
                tabIndex={0}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={skipTour} tabIndex={0}>
              Skip Tour
            </Button>

            {isLastStep ? (
              <Button onClick={completeTour} className="flex items-center gap-2" tabIndex={0}>
                Finish
              </Button>
            ) : (
              <Button onClick={nextStep} className="flex items-center gap-2" tabIndex={0}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
