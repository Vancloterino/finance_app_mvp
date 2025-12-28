import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';

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

const renderLayout = () => {
  return render(
    <BrowserRouter>
      <Layout>
        <div>Page Content</div>
      </Layout>
    </BrowserRouter>
  );
};

describe('Layout - ARIA Accessibility', () => {
  describe('Desktop Navigation', () => {
    it('should have aria-label="Main navigation" on nav element', () => {
      renderLayout();

      const nav = screen.getByLabelText('Main navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe('NAV');
    });

    it('should have aria-current="page" on active navigation link', () => {
      renderLayout();

      // The dashboard link should be active (we're on root path)
      const links = screen.getAllByRole('link');
      const activeLinks = links.filter(link => link.getAttribute('aria-current') === 'page');

      expect(activeLinks.length).toBeGreaterThan(0);
    });

    it('should have semantic nav element', () => {
      const { container } = renderLayout();

      const navElements = container.querySelectorAll('nav');
      expect(navElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Menu', () => {
    it('should have aria-label on user menu button', () => {
      renderLayout();

      const userMenuButton = screen.getByLabelText('User menu');
      expect(userMenuButton).toBeInTheDocument();
    });

    it('should have aria-expanded on user menu button', () => {
      renderLayout();

      const userMenuButton = screen.getByLabelText('User menu');
      expect(userMenuButton).toHaveAttribute('aria-expanded');
    });

    it('should have aria-haspopup on user menu button', () => {
      renderLayout();

      const userMenuButton = screen.getByLabelText('User menu');
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('Mobile Menu', () => {
    it('should have aria-label on mobile menu open button', () => {
      renderLayout();

      const mobileMenuButton = screen.getByLabelText('Open mobile menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should have aria-expanded on mobile menu button', () => {
      renderLayout();

      const mobileMenuButton = screen.getByLabelText('Open mobile menu');
      expect(mobileMenuButton).toHaveAttribute('aria-expanded');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes on main container', () => {
      const { container } = renderLayout();

      const mainContainer = container.querySelector('.dark\\:from-gray-900');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should include ThemeToggle component', () => {
      renderLayout();

      const themeToggle = screen.getByLabelText('Toggle theme');
      expect(themeToggle).toBeInTheDocument();
    });
  });

  describe('Semantic HTML', () => {
    it('should have main element for content', () => {
      const { container } = renderLayout();

      const mainElements = container.querySelectorAll('main');
      expect(mainElements.length).toBeGreaterThan(0);
    });

    it('should display page content', () => {
      renderLayout();

      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should have aria-label on settings button', () => {
      renderLayout();

      const settingsButton = screen.getByLabelText('Open settings');
      expect(settingsButton).toBeInTheDocument();
    });

    it('should have aria-label on sign out buttons', () => {
      renderLayout();

      const signOutButtons = screen.getAllByLabelText(/sign out/i);
      expect(signOutButtons.length).toBeGreaterThan(0);
    });
  });
});
