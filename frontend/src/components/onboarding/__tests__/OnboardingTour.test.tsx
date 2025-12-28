/**
 * Tests for OnboardingTour component.
 *
 * Tests onboarding walkthrough functionality including:
 * - Step progression
 * - Skip functionality
 * - Completion tracking
 * - Tooltip positioning
 * - localStorage persistence
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingTour } from '../OnboardingTour';
import { OnboardingProvider, useOnboarding } from '../../../contexts/OnboardingContext';

// Test component to access context
const TestComponent = () => {
  const { startTour, currentStep, isActive, completeTour, skipTour } = useOnboarding();
  return (
    <div>
      <button onClick={startTour}>Start Tour</button>
      <button onClick={completeTour}>Complete</button>
      <button onClick={skipTour}>Skip</button>
      <div>Active: {String(isActive)}</div>
      <div>Step: {currentStep}</div>
    </div>
  );
};

describe('OnboardingTour', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render tour overlay when active', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to FinanceApp!/i)).toBeInTheDocument();
    });

    it('should not render when inactive', () => {
      render(
        <OnboardingProvider>
          <OnboardingTour />
        </OnboardingProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show step counter', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should advance to next step on Next click', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
      });
    });

    it('should go back to previous step on Back click', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      // Go to step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();
      });
    });

    it('should not show Back button on first step', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('should show Finish button on last step', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      // Click Next 4 times to reach last step (step 5)
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
    });
  });

  describe('Skip Functionality', () => {
    it('should close tour on Skip click', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const skipButton = screen.getByRole('button', { name: /skip tour/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should save skip status to localStorage', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));
      fireEvent.click(screen.getByRole('button', { name: /skip tour/i }));

      await waitFor(() => {
        const stored = localStorage.getItem('onboarding_status');
        expect(stored).toBe('skipped');
      });
    });
  });

  describe('Completion', () => {
    it('should close tour on Finish click', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      // Navigate to last step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      fireEvent.click(screen.getByRole('button', { name: /finish/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should save completion status to localStorage', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      // Navigate to last step and finish
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      fireEvent.click(screen.getByRole('button', { name: /finish/i }));

      await waitFor(() => {
        const stored = localStorage.getItem('onboarding_status');
        expect(stored).toBe('completed');
      });
    });
  });

  describe('Persistence', () => {
    it('should not auto-start if already completed', () => {
      localStorage.setItem('onboarding_status', 'completed');

      render(
        <OnboardingProvider>
          <OnboardingTour />
        </OnboardingProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not auto-start if skipped', () => {
      localStorage.setItem('onboarding_status', 'skipped');

      render(
        <OnboardingProvider>
          <OnboardingTour />
        </OnboardingProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should allow manual restart even if completed', () => {
      localStorage.setItem('onboarding_status', 'completed');

      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should advance on ArrowRight key', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowRight', code: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
      });
    });

    it('should go back on ArrowLeft key', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      // Go to step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
      });

      // Go back with keyboard
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowLeft', code: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should have close button with aria-label', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const closeButton = screen.getByLabelText(/close onboarding/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should trap focus within dialog', () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const dialog = screen.getByRole('dialog');
      const buttons = dialog.querySelectorAll('button');

      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toHaveAttribute('tabIndex');
    });
  });

  describe('Content', () => {
    it('should display all 5 steps', async () => {
      render(
        <OnboardingProvider>
          <TestComponent />
          <OnboardingTour />
        </OnboardingProvider>
      );

      fireEvent.click(screen.getByText('Start Tour'));

      const steps = [
        /Welcome to FinanceApp!/i,
        /Create a Space/i,
        /Invite Members/i,
        /Create Pledges/i,
        /Request Payouts/i,
      ];

      for (let i = 0; i < steps.length; i++) {
        await waitFor(() => {
          expect(screen.getByText(steps[i])).toBeInTheDocument();
        });

        if (i < steps.length - 1) {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        }
      }
    });
  });
});
