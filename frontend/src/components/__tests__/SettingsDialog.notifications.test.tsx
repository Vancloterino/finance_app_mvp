import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsDialog from '../SettingsDialog';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { BrowserRouter } from 'react-router-dom';
import * as apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
};

const MockProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('SettingsDialog - Notifications Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notifications tab', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    // Click on Notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    // Verify notification settings are visible
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Payment Notifications')).toBeInTheDocument();
    expect(screen.getByText('Space Updates')).toBeInTheDocument();
  });

  it('should load notification preferences on mount', async () => {
    const { api } = await import('../../api/client');
    const mockPreferences = {
      email_notifications: false,
      payment_notifications: true,
      space_updates: false,
      payout_notifications: true,
      pledge_reminders: false,
    };

    (api.get as any).mockResolvedValue({ data: mockPreferences });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    // Click notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    // Wait for API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/notifications/preferences');
    });
  });

  it('should toggle email notifications', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    (api.put as any).mockResolvedValue({
      data: {
        email_notifications: false,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    // Click notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    // Wait for preferences to load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Find and click email notifications toggle
    const emailToggle = screen.getByLabelText(/email notifications/i);
    await userEvent.click(emailToggle);

    // Verify API was called to update
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/notifications/preferences',
        expect.objectContaining({
          email_notifications: false,
        })
      );
    });
  });

  it('should toggle payment notifications independently', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    (api.put as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: false,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const paymentToggle = screen.getByLabelText(/payment notifications/i);
    await userEvent.click(paymentToggle);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/notifications/preferences',
        expect.objectContaining({
          payment_notifications: false,
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockRejectedValue(new Error('Network error'));

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    // Should show default toggles even if API fails
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    });
  });

  it('should update preferences immediately on toggle', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    (api.put as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: false,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const spaceToggle = screen.getByLabelText(/space updates/i);
    await userEvent.click(spaceToggle);

    // Should immediately update without save button
    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });
  });

  it('should show all notification types', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: true,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Payment Notifications')).toBeInTheDocument();
      expect(screen.getByText('Space Updates')).toBeInTheDocument();
    });
  });

  it('should persist toggle state across tab switches', async () => {
    const { api } = await import('../../api/client');
    (api.get as any).mockResolvedValue({
      data: {
        email_notifications: false,
        payment_notifications: true,
        space_updates: true,
        payout_notifications: true,
        pledge_reminders: true,
      },
    });

    render(
      <MockProviders>
        <SettingsDialog isOpen={true} onClose={vi.fn()} />
      </MockProviders>
    );

    // Go to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Switch to another tab
    const profileTab = screen.getByText('Profile');
    await userEvent.click(profileTab);

    // Switch back to notifications
    await userEvent.click(notificationsTab);

    // State should be preserved
    const emailToggle = screen.getByLabelText(/email notifications/i) as HTMLInputElement;
    expect(emailToggle.checked).toBe(false);
  });
});
