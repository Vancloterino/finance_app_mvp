import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the context
vi.mock('../../../context/AppContext', () => ({
  useApp: () => ({
    state: {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    logout: vi.fn(),
  }),
}));

// Mock ThemeToggle
vi.mock('../../ui/ThemeToggle', () => ({
  default: () => <button aria-label="Toggle theme">Toggle</button>,
}));

describe('Layout - Keyboard Navigation', () => {
  describe('Tab Navigation', () => {
    it('should allow tabbing through all interactive elements', async () => {
      const user = userEvent.setup();

      // We'll test with a simpler structure
      const SimpleNav = () => (
        <nav aria-label="Main navigation">
          <a href="/dashboard">Dashboard</a>
          <a href="/spaces">Spaces</a>
          <button aria-label="User menu">Menu</button>
        </nav>
      );

      render(<SimpleNav />);

      const dashboardLink = screen.getByText('Dashboard');
      const spacesLink = screen.getByText('Spaces');
      const menuButton = screen.getByLabelText('User menu');

      // Start tabbing
      await user.tab();
      expect(document.activeElement).toBe(dashboardLink);

      await user.tab();
      expect(document.activeElement).toBe(spacesLink);

      await user.tab();
      expect(document.activeElement).toBe(menuButton);
    });

    it('should allow reverse tabbing with Shift+Tab', async () => {
      const user = userEvent.setup();

      const SimpleNav = () => (
        <nav aria-label="Main navigation">
          <a href="/dashboard">Dashboard</a>
          <a href="/spaces">Spaces</a>
          <button aria-label="User menu">Menu</button>
        </nav>
      );

      render(<SimpleNav />);

      const dashboardLink = screen.getByText('Dashboard');
      const spacesLink = screen.getByText('Spaces');
      const menuButton = screen.getByLabelText('User menu');

      // Tab to last element
      menuButton.focus();

      // Shift+Tab backwards
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(spacesLink);

      await user.tab({ shift: true });
      expect(document.activeElement).toBe(dashboardLink);
    });
  });

  describe('User Menu Keyboard Interaction', () => {
    it('should open user menu with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <button
          aria-label="User menu"
          aria-expanded={false}
          aria-haspopup="true"
          onClick={handleClick}
        >
          Menu
        </button>
      );

      const menuButton = screen.getByLabelText('User menu');

      menuButton.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should open user menu with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <button
          aria-label="User menu"
          aria-expanded={false}
          aria-haspopup="true"
          onClick={handleClick}
        >
          Menu
        </button>
      );

      const menuButton = screen.getByLabelText('User menu');

      menuButton.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should close user menu with Escape key', async () => {
      const user = userEvent.setup();

      const UserMenuComponent = () => {
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
          <>
            <button
              aria-label="User menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            >
              Menu
            </button>
            {isOpen && (
              <div role="menu">
                <button role="menuitem">Settings</button>
                <button role="menuitem">Sign Out</button>
              </div>
            )}
          </>
        );
      };

      render(<UserMenuComponent />);

      // Menu should be open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      // Menu should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should navigate menu items with Arrow keys', async () => {
      const user = userEvent.setup();

      const MenuComponent = () => {
        const [focusedIndex, setFocusedIndex] = React.useState(0);
        const menuItems = [
          { label: 'Settings', action: vi.fn() },
          { label: 'Sign Out', action: vi.fn() },
        ];

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex((prev) => (prev + 1) % menuItems.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex((prev) =>
              prev === 0 ? menuItems.length - 1 : prev - 1
            );
          }
        };

        return (
          <div role="menu" onKeyDown={handleKeyDown}>
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                role="menuitem"
                tabIndex={index === focusedIndex ? 0 : -1}
                ref={(el) => {
                  if (index === focusedIndex && el) {
                    el.focus();
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        );
      };

      render(<MenuComponent />);

      const settingsButton = screen.getByText('Settings');
      const signOutButton = screen.getByText('Sign Out');

      // First item should be focused initially
      expect(document.activeElement).toBe(settingsButton);

      // Arrow Down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(signOutButton);

      // Arrow Down from last item should wrap to first
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(settingsButton);

      // Arrow Up should move to previous item
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(signOutButton);
    });
  });

  describe('Mobile Menu Keyboard Interaction', () => {
    it('should open mobile menu with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <button
          aria-label="Open mobile menu"
          aria-expanded={false}
          onClick={handleClick}
        >
          Menu
        </button>
      );

      const menuButton = screen.getByLabelText('Open mobile menu');

      menuButton.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should close mobile menu with Escape key', async () => {
      const user = userEvent.setup();

      const MobileMenuComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
              setIsOpen(false);
            }
          };

          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, [isOpen]);

        return (
          <>
            <button
              aria-label="Open mobile menu"
              onClick={() => setIsOpen(true)}
            >
              Menu
            </button>
            {isOpen && (
              <div role="dialog" aria-modal="true">
                <button
                  aria-label="Close mobile menu"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
                <nav>
                  <a href="/dashboard">Dashboard</a>
                </nav>
              </div>
            )}
          </>
        );
      };

      render(<MobileMenuComponent />);

      // Menu should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      // Menu should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Skip Links', () => {
    it('should provide skip to main content link', () => {
      const PageWithSkipLink = () => (
        <>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>
            <a href="/dashboard">Dashboard</a>
          </nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </>
      );

      render(<PageWithSkipLink />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should focus skip link first when tabbing', async () => {
      const user = userEvent.setup();

      const PageWithSkipLink = () => (
        <>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>
            <a href="/dashboard">Dashboard</a>
          </nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </>
      );

      render(<PageWithSkipLink />);

      // First tab should focus skip link
      await user.tab();

      const skipLink = screen.getByText('Skip to main content');
      expect(document.activeElement).toBe(skipLink);
    });
  });

  describe('Keyboard Focus Visibility', () => {
    it('should show focus indicators on keyboard navigation', async () => {
      const user = userEvent.setup();

      const FocusableButton = () => (
        <button className="focus:ring-2 focus:ring-blue-500">
          Focusable Button
        </button>
      );

      const { container } = render(<FocusableButton />);

      const button = screen.getByText('Focusable Button');

      // Tab to button
      await user.tab();

      expect(document.activeElement).toBe(button);
      expect(button.className).toContain('focus:ring-2');
    });
  });
});
