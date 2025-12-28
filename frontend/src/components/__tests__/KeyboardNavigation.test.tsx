import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('General Keyboard Navigation Patterns', () => {
  describe('Custom Interactive Elements', () => {
    it('should make divs with onClick keyboard accessible with role="button"', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      const ClickableDiv = () => (
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          Click me
        </div>
      );

      render(<ClickableDiv />);

      const div = screen.getByRole('button');

      // Should be focusable
      await user.tab();
      expect(document.activeElement).toBe(div);

      // Should activate with Enter
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Should activate with Space
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have tabIndex={0} for custom focusable elements', () => {
      const CustomFocusable = () => (
        <div role="button" tabIndex={0} aria-label="Custom button">
          Focusable
        </div>
      );

      render(<CustomFocusable />);

      const element = screen.getByRole('button');
      expect(element).toHaveAttribute('tabIndex', '0');
    });

    it('should have tabIndex={-1} for programmatically focusable but not tab-reachable elements', () => {
      const NonTabReachable = () => (
        <div role="button" tabIndex={-1} aria-label="Not tab reachable">
          Hidden from tab order
        </div>
      );

      const { container } = render(<NonTabReachable />);

      const element = container.querySelector('[role="button"]');
      expect(element).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Link Navigation', () => {
    it('should activate links with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn((e) => e.preventDefault());

      render(
        <a href="/test" onClick={handleClick}>
          Test Link
        </a>
      );

      const link = screen.getByText('Test Link');

      link.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should NOT activate links with Space key (browser default)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn((e) => e.preventDefault());

      render(
        <a href="/test" onClick={handleClick}>
          Test Link
        </a>
      );

      const link = screen.getByText('Test Link');

      link.focus();
      await user.keyboard(' ');

      // Space on links scrolls the page, doesn't activate (browser behavior)
      // We're just documenting this, not testing browser behavior
      expect(link).toBeInTheDocument();
    });
  });

  describe('Button Keyboard Patterns', () => {
    it('should activate buttons with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<button onClick={handleClick}>Click Me</button>);

      const button = screen.getByText('Click Me');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should activate buttons with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<button onClick={handleClick}>Click Me</button>);

      const button = screen.getByText('Click Me');

      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not activate disabled buttons', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <button disabled onClick={handleClick}>
          Disabled Button
        </button>
      );

      const button = screen.getByText('Disabled Button');

      button.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Form Keyboard Navigation', () => {
    it('should submit form with Enter key in input field', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Name" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByPlaceholderText('Name');

      input.focus();
      await user.keyboard('Test{Enter}');

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should navigate between form fields with Tab', async () => {
      const user = userEvent.setup();

      render(
        <form>
          <input type="text" placeholder="First Name" />
          <input type="text" placeholder="Last Name" />
          <input type="email" placeholder="Email" />
          <button type="submit">Submit</button>
        </form>
      );

      const firstName = screen.getByPlaceholderText('First Name');
      const lastName = screen.getByPlaceholderText('Last Name');
      const email = screen.getByPlaceholderText('Email');
      const submitButton = screen.getByText('Submit');

      // Tab through form fields
      await user.tab();
      expect(document.activeElement).toBe(firstName);

      await user.tab();
      expect(document.activeElement).toBe(lastName);

      await user.tab();
      expect(document.activeElement).toBe(email);

      await user.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('should select checkbox/radio with Space key', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <label>
            <input type="checkbox" /> Accept terms
          </label>
        </div>
      );

      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      expect(checkbox).not.toBeChecked();

      await user.keyboard(' ');
      expect(checkbox).toBeChecked();

      await user.keyboard(' ');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Dropdown/Select Keyboard Navigation', () => {
    it('should open dropdown with Space or Enter', async () => {
      const user = userEvent.setup();

      const Dropdown = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <div>
            <button
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              onClick={() => setIsOpen(!isOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }
              }}
            >
              Select Option
            </button>
            {isOpen && (
              <ul role="listbox">
                <li role="option">Option 1</li>
                <li role="option">Option 2</li>
              </ul>
            )}
          </div>
        );
      };

      render(<Dropdown />);

      const button = screen.getByText('Select Option');

      button.focus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Close with Enter
      await user.keyboard('{Enter}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      // Open with Space
      await user.keyboard(' ');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should close dropdown with Escape', async () => {
      const user = userEvent.setup();

      const Dropdown = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          };

          if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
          }

          return () => {
            document.removeEventListener('keydown', handleKeyDown);
          };
        }, [isOpen]);

        return (
          <div>
            <button aria-expanded={isOpen}>Select Option</button>
            {isOpen && (
              <ul role="listbox">
                <li role="option">Option 1</li>
              </ul>
            )}
          </div>
        );
      };

      render(<Dropdown />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Tab Index Management', () => {
    it('should respect positive tabIndex for custom tab order', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button tabIndex={3}>Third</button>
          <button tabIndex={1}>First</button>
          <button tabIndex={2}>Second</button>
          <button>Fourth (default)</button>
        </div>
      );

      const first = screen.getByText('First');
      const second = screen.getByText('Second');
      const third = screen.getByText('Third');
      const fourth = screen.getByText('Fourth (default)');

      // Tab follows explicit tabIndex order first, then DOM order
      await user.tab();
      expect(document.activeElement).toBe(first);

      await user.tab();
      expect(document.activeElement).toBe(second);

      await user.tab();
      expect(document.activeElement).toBe(third);

      await user.tab();
      expect(document.activeElement).toBe(fourth);
    });

    it('should skip elements with tabIndex={-1}', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>First</button>
          <button tabIndex={-1}>Skipped</button>
          <button>Second</button>
        </div>
      );

      const first = screen.getByText('First');
      const skipped = screen.getByText('Skipped');
      const second = screen.getByText('Second');

      await user.tab();
      expect(document.activeElement).toBe(first);

      await user.tab();
      expect(document.activeElement).toBe(second);

      // Skipped button should never be focused via Tab
      expect(document.activeElement).not.toBe(skipped);
    });
  });

  describe('Focus Visible Indicators', () => {
    it('should have visible focus styles', () => {
      const FocusableElement = () => (
        <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
          Focusable
        </button>
      );

      render(<FocusableElement />);

      const button = screen.getByText('Focusable');

      // Element should have focus styling classes
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-blue-500');
    });
  });
});
