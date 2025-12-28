import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../Input';

describe('Input - ARIA Accessibility', () => {
  it('should link label to input with htmlFor and id', () => {
    render(<Input label="Email Address" />);

    const label = screen.getByText('Email Address');
    const input = screen.getByLabelText('Email Address');

    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(label).toHaveAttribute('for');
    expect(input).toHaveAttribute('id');
  });

  it('should have aria-invalid="false" when no error', () => {
    render(<Input label="Username" />);

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should have aria-invalid="true" when error exists', () => {
    render(<Input label="Email" error="Invalid email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-describedby linking to error message', () => {
    render(<Input label="Password" error="Password too short" />);

    const input = screen.getByLabelText('Password');
    const errorMessage = screen.getByText('Password too short');

    expect(input).toHaveAttribute('aria-describedby');
    expect(errorMessage).toHaveAttribute('id');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('should have aria-describedby linking to helper text', () => {
    render(<Input label="Username" helperText="Choose a unique username" />);

    const input = screen.getByLabelText('Username');
    const helperText = screen.getByText('Choose a unique username');

    expect(input).toHaveAttribute('aria-describedby');
    expect(helperText).toHaveAttribute('id');
  });

  it('should have aria-required when required prop is true', () => {
    render(<Input label="Email" required />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('required');
  });

  it('should have role="alert" on error message', () => {
    render(<Input label="Email" error="Invalid email format" />);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid email format');
  });

  it('should generate unique IDs from label text', () => {
    const { container } = render(
      <>
        <Input label="First Name" />
        <Input label="Last Name" />
      </>
    );

    const inputs = container.querySelectorAll('input');
    const ids = Array.from(inputs).map(input => input.id);

    expect(ids[0]).toBe('input-first-name');
    expect(ids[1]).toBe('input-last-name');
    expect(new Set(ids).size).toBe(ids.length); // All IDs are unique
  });

  it('should have dark mode classes', () => {
    const { container } = render(<Input label="Email" />);

    const input = container.querySelector('input');
    expect(input?.className).toContain('dark:bg-gray-700');
    expect(input?.className).toContain('dark:text-white');
  });
});
