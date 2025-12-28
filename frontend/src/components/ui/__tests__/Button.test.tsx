import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button - ARIA Accessibility', () => {
  it('should have aria-busy="true" when loading', () => {
    render(<Button loading>Submit</Button>);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('should have aria-busy="false" when not loading', () => {
    render(<Button loading={false}>Submit</Button>);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Delete</Button>);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeDisabled();
  });

  it('should have proper button role and accessible text', () => {
    render(<Button>Click Me</Button>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
  });

  it('should render with custom aria-label', () => {
    render(<Button aria-label="Close dialog">×</Button>);

    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('×');
  });

  it('should have dark mode classes for secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('dark:bg-gray-700');
    expect(button?.className).toContain('dark:text-gray-100');
  });

  it('should have dark mode classes for ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('dark:text-gray-200');
    expect(button?.className).toContain('dark:hover:bg-gray-700');
  });

  it('should preserve custom aria attributes', () => {
    render(
      <Button aria-label="Delete item" aria-describedby="delete-help">
        Delete
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Delete item' });
    expect(button).toHaveAttribute('aria-describedby', 'delete-help');
  });
});
