import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal - ARIA Accessibility', () => {
  const mockOnClose = vi.fn();

  it('should have role="dialog"', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should have aria-modal="true"', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby referencing the title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Confirmation Dialog">
        <p>Are you sure?</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    const title = screen.getByText('Confirmation Dialog');

    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('should have aria-label on close button', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close dialog');
    expect(closeButton).toBeInTheDocument();
  });

  it('should have aria-hidden="true" on background overlay', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    // The background overlay should have aria-hidden
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have dark mode classes on modal container', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const modalContent = container.querySelector('.dark\\:bg-gray-800');
    expect(modalContent).toBeInTheDocument();
  });

  it('should have dark mode classes on overlay', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const overlay = container.querySelector('.dark\\:bg-gray-900');
    expect(overlay).toBeInTheDocument();
  });

  it('should have dark mode classes on title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const title = screen.getByText('Test Modal');
    expect(title.className).toContain('dark:text-white');
  });
});
