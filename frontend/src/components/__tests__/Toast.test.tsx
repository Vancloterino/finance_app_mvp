import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast - ARIA Accessibility', () => {
  const mockOnClose = vi.fn();

  it('should have role="alert" on toast container', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      message: 'Operation successful',
    };

    render(<Toast toast={toast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Operation successful');
  });

  it('should have aria-live="assertive" for error toasts', () => {
    const errorToast = {
      id: '1',
      type: 'error' as const,
      message: 'An error occurred',
    };

    const { container } = render(<Toast toast={errorToast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should have aria-live="polite" for success toasts', () => {
    const successToast = {
      id: '1',
      type: 'success' as const,
      message: 'Saved successfully',
    };

    render(<Toast toast={successToast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-live="polite" for info toasts', () => {
    const infoToast = {
      id: '1',
      type: 'info' as const,
      message: 'New update available',
    };

    render(<Toast toast={infoToast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-live="polite" for warning toasts', () => {
    const warningToast = {
      id: '1',
      type: 'warning' as const,
      message: 'Please review your input',
    };

    render(<Toast toast={warningToast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-atomic="true"', () => {
    const toast = {
      id: '1',
      type: 'info' as const,
      message: 'Information message',
    };

    render(<Toast toast={toast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('should have aria-label on close button', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      message: 'Success',
    };

    render(<Toast toast={toast} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });

  it('should have aria-hidden="true" on decorative icon', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      message: 'Success message',
    };

    const { container } = render(<Toast toast={toast} onClose={mockOnClose} />);

    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should have dark mode classes for success toast', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      message: 'Success',
    };

    const { container } = render(<Toast toast={toast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('dark:bg-green-900/30');
    expect(alert.className).toContain('dark:text-green-200');
  });

  it('should have dark mode classes for error toast', () => {
    const toast = {
      id: '1',
      type: 'error' as const,
      message: 'Error',
    };

    const { container } = render(<Toast toast={toast} onClose={mockOnClose} />);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('dark:bg-red-900/30');
    expect(alert.className).toContain('dark:text-red-200');
  });
});
