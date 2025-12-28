/**
 * Tests for TimezoneSelector component
 * TDD approach: Write tests first, then implement
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneSelector from '../TimezoneSelector';

describe('TimezoneSelector Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render timezone selector', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should display current timezone value', () => {
    render(<TimezoneSelector value="America/New_York" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('America/New_York');
  });

  it('should display placeholder when no timezone selected', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const placeholder = screen.getByText(/select timezone/i);
    expect(placeholder).toBeInTheDocument();
  });

  it('should have label for accessibility', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} label="Timezone" />);

    const label = screen.getByText('Timezone');
    expect(label).toBeInTheDocument();
  });

  it('should include common timezones', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    const optionValues = options.map(opt => opt.value);

    expect(optionValues).toContain('America/New_York');
    expect(optionValues).toContain('America/Los_Angeles');
    expect(optionValues).toContain('Europe/London');
    expect(optionValues).toContain('Asia/Tokyo');
    expect(optionValues).toContain('UTC');
  });

  it('should call onChange when timezone selected', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'America/Los_Angeles');

    expect(mockOnChange).toHaveBeenCalledWith('America/Los_Angeles');
  });

  it('should allow clearing timezone', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelector value="America/New_York" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('should group timezones by region', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    const optgroups = select.querySelectorAll('optgroup');

    expect(optgroups.length).toBeGreaterThan(0);

    const labels = Array.from(optgroups).map(og => og.label);
    expect(labels).toContain('Americas');
    expect(labels).toContain('Europe');
    expect(labels).toContain('Asia');
  });

  it('should display timezone offset in options', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));

    // Check that at least some options have offsets (e.g., "(UTC-5)")
    const hasOffsets = options.some(opt =>
      opt.textContent?.includes('UTC') || opt.textContent?.includes('GMT')
    );
    expect(hasOffsets).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} disabled={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should have proper ARIA attributes', () => {
    render(<TimezoneSelector value={null} onChange={mockOnChange} label="Timezone" />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label');
  });
});

describe('TimezoneSelector with form integration', () => {
  it('should work within a form', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const handleChange = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <TimezoneSelector value={null} onChange={handleChange} />
        <button type="submit">Submit</button>
      </form>
    );

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'Europe/Paris');

    expect(handleChange).toHaveBeenCalledWith('Europe/Paris');
  });
});
