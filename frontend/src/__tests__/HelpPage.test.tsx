/**
 * Tests for Help/FAQ Page
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HelpPage from '../pages/HelpPage';

describe('HelpPage', () => {
  const renderHelpPage = () => {
    return render(
      <BrowserRouter>
        <HelpPage />
      </BrowserRouter>
    );
  };

  it('renders help page heading', () => {
    renderHelpPage();
    expect(screen.getByText(/Help Center/i)).toBeInTheDocument();
  });

  it('displays FAQ sections', () => {
    renderHelpPage();
    // Should have multiple FAQ sections
    expect(screen.getByText(/Getting Started/i)).toBeInTheDocument();
    expect(screen.getByText(/Spaces/i)).toBeInTheDocument();
    expect(screen.getByText(/Payments/i)).toBeInTheDocument();
  });

  it('has searchable content', () => {
    renderHelpPage();
    // Should have a search input
    const searchInput = screen.queryByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('displays common questions', () => {
    renderHelpPage();
    // Should have common questions visible
    expect(screen.getByText(/How do I create a space/i)).toBeInTheDocument();
    expect(screen.getByText(/How do I add payment method/i)).toBeInTheDocument();
  });

  it('has contact support link', () => {
    renderHelpPage();
    const contactLink = screen.getByText(/Contact Support/i);
    expect(contactLink).toBeInTheDocument();
  });

  it('renders multiple FAQ categories', () => {
    renderHelpPage();
    // Check for various categories
    expect(screen.getByText(/Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Security/i)).toBeInTheDocument();
  });
});
