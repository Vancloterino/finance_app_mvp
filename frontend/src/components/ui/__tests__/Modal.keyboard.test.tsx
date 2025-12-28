import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Modal from '../Modal';

describe('Modal - Keyboard Navigation', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Escape Key', () => {
    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when Escape is pressed if modal is not open', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Trapping', () => {
    it('should trap focus within modal when open', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>
            <button>First Button</button>
            <button>Second Button</button>
            <button>Third Button</button>
          </div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const thirdButton = screen.getByText('Third Button');

      // Focus should start at close button or first focusable element
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab through elements
      await user.tab();
      expect(document.activeElement).toBe(firstButton);

      await user.tab();
      expect(document.activeElement).toBe(secondButton);

      await user.tab();
      expect(document.activeElement).toBe(thirdButton);

      // Tab from last element should wrap to first
      await user.tab();
      expect(document.activeElement).toBe(closeButton);
    });

    it('should trap focus when tabbing backwards (Shift+Tab)', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>
            <button>First Button</button>
            <button>Second Button</button>
          </div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');

      // Start at close button
      closeButton.focus();

      // Shift+Tab from first element should wrap to last
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(secondButton);

      await user.tab({ shift: true });
      expect(document.activeElement).toBe(firstButton);
    });

    it('should set focus to first focusable element when modal opens', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <button>Focus Me</button>
        </Modal>
      );

      // Modal not open, nothing should be focused
      expect(document.activeElement).toBe(document.body);

      // Open modal
      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <button>Focus Me</button>
        </Modal>
      );

      // Focus should be set to first focusable element or close button
      const closeButton = screen.getByLabelText('Close dialog');
      const contentButton = screen.getByText('Focus Me');

      const focusedElement = document.activeElement;
      expect(
        focusedElement === closeButton || focusedElement === contentButton
      ).toBe(true);
    });

    it('should restore focus to trigger element when modal closes', async () => {
      const user = userEvent.setup();

      const TriggerComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test">
              <p>Content</p>
            </Modal>
          </>
        );
      };

      render(<TriggerComponent />);

      const triggerButton = screen.getByText('Open Modal');

      // Click trigger button
      await user.click(triggerButton);

      // Modal should be open, focus should be in modal
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Close modal with Escape
      await user.keyboard('{Escape}');

      // Focus should return to trigger button
      expect(document.activeElement).toBe(triggerButton);
    });
  });

  describe('Interactive Elements', () => {
    it('should allow keyboard interaction with buttons inside modal', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <button onClick={handleClick}>Click Me</button>
        </Modal>
      );

      const button = screen.getByText('Click Me');
      button.focus();

      // Press Enter to activate button
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Press Space to activate button
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should allow form submission with Enter key', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      const input = screen.getByPlaceholderText('Name');
      input.focus();

      await user.keyboard('Test{Enter}');

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Behavior', () => {
    it('should prevent body scroll when modal is open', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      // Body should be scrollable when modal is closed
      expect(document.body.style.overflow).not.toBe('hidden');

      // Open modal
      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      // Body scroll should be prevented
      expect(document.body.style.overflow).toBe('hidden');

      // Close modal
      rerender(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      // Body should be scrollable again
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('should not allow background elements to receive focus when modal is open', async () => {
      const user = userEvent.setup();

      const TestComponent = () => (
        <>
          <button>Background Button</button>
          <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
            <button>Modal Button</button>
          </Modal>
        </>
      );

      render(<TestComponent />);

      const backgroundButton = screen.getByText('Background Button');
      const modalButton = screen.getByText('Modal Button');

      // Try to focus background button
      backgroundButton.focus();

      // Focus should either stay on modal elements or move to modal
      // (implementation dependent on focus trap)
      expect(document.activeElement).not.toBe(backgroundButton);
    });
  });
});
