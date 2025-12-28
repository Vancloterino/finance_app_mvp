import { api } from './client';
import {
  User,
  UserCreate,
  UserUpdate,
  Space,
  SpaceCreate,
  SpaceUpdate,
  SpaceWithMembers,
  MemberAllocation,
  Pledge,
  PledgeCreate,
  PledgeUpdate,
  Payout,
  PayoutCreate,
  Consent,
  ConsentCreate,
  ConsentSummary,
  LedgerEntry,
  BalanceSummary,
  PaymentMethod,
  SetupIntent,
  StripeConfig,
  EmailTestRequest,
  NotificationConfig,
  PaginatedResponse,
  LoginForm,
} from '../types';

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }): Promise<{ access_token: string; token_type: string }> =>
    api.post('/auth/login-email', credentials),

  register: (userData: { name: string; email: string; password: string }): Promise<{ access_token: string; token_type: string }> =>
    api.post('/auth/register', userData),

  getCurrentUser: (): Promise<User> =>
    api.get('/users/me'),

  updateCurrentUser: (userData: UserUpdate): Promise<User> =>
    api.patch('/users/me', userData),

  changePassword: (passwordData: { current_password: string; new_password: string }): Promise<void> =>
    api.post('/users/me/change-password', passwordData),

  refreshToken: (): Promise<{ access_token: string; token_type: string }> =>
    api.post('/auth/refresh'),

  logout: (): Promise<void> =>
    api.post('/auth/logout'),

  logoutAll: (): Promise<void> =>
    api.post('/auth/logout-all'),
};

// Users API
export const usersApi = {
  getUser: (userId: string): Promise<User> =>
    api.get(`/users/${userId}`),

  updateUser: (userId: string, userData: UserUpdate): Promise<User> =>
    api.put(`/users/${userId}`, userData),

  deleteUser: (userId: string): Promise<void> =>
    api.delete(`/users/${userId}`),

  getUserSpaces: (userId: string): Promise<SpaceWithMembers[]> =>
    api.get(`/users/${userId}/spaces`),

  getUserBalance: (userId: string, spaceId?: string): Promise<BalanceSummary> =>
    api.get(`/users/${userId}/balance`, spaceId ? { space_id: spaceId } : undefined),

  getUserLedger: (userId: string, spaceId?: string): Promise<LedgerEntry[]> =>
    api.get(`/users/${userId}/ledger`, spaceId ? { space_id: spaceId } : undefined),
};

// Spaces API
export const spacesApi = {
  getSpaces: (): Promise<SpaceWithMembers[]> =>
    api.get('/spaces'),

  getSpace: (spaceId: string): Promise<SpaceWithMembers> =>
    api.get(`/spaces/${spaceId}`),

  createSpace: (spaceData: SpaceCreate): Promise<Space> =>
    api.post('/spaces', spaceData),

  updateSpace: (spaceId: string, spaceData: SpaceUpdate): Promise<Space> =>
    api.patch(`/spaces/${spaceId}`, spaceData),

  deleteSpace: (spaceId: string): Promise<void> =>
    api.delete(`/spaces/${spaceId}`),

  getSpaceMembers: (spaceId: string): Promise<MemberAllocation[]> =>
    api.get(`/spaces/${spaceId}/members`),

  addSpaceMember: (spaceId: string, memberData: { user_id: string; allocation_pct: number }): Promise<MemberAllocation> =>
    api.post(`/spaces/${spaceId}/members`, memberData),

  updateMemberAllocation: (spaceId: string, userId: string, allocationPct: number): Promise<MemberAllocation> =>
    api.put(`/spaces/${spaceId}/members/${userId}`, { allocation_pct: allocationPct }),

  removeSpaceMember: (spaceId: string, userId: string): Promise<void> =>
    api.delete(`/spaces/${spaceId}/members/${userId}`),

  inviteMember: (spaceId: string, email: string): Promise<{ message: string }> =>
    api.post(`/spaces/${spaceId}/invite`, { email }),

  getSpaceBalance: (spaceId: string): Promise<BalanceSummary> =>
    api.get(`/spaces/${spaceId}/balance`),

  getSpaceLedger: (spaceId: string): Promise<LedgerEntry[]> =>
    api.get(`/spaces/${spaceId}/ledger`),
};

// Pledges API
export const pledgesApi = {
  getPledges: (spaceId?: string): Promise<Pledge[]> =>
    api.get('/pledges', spaceId ? { space_id: spaceId } : undefined),

  getPledge: (pledgeId: string): Promise<Pledge> =>
    api.get(`/pledges/${pledgeId}`),

  createPledge: (pledgeData: PledgeCreate): Promise<Pledge> => {
    // Map frontend field names to backend field names
    const backendPledgeData = {
      space_id: pledgeData.space_id,
      amount_minor: pledgeData.amount_minor,
      currency: pledgeData.currency,
      memo: pledgeData.description, // Map description to memo for backend
    };
    return api.post('/pledges', backendPledgeData).then((response: any) => ({
      ...response,
      description: response.memo, // Map memo back to description for frontend
    }));
  },

  updatePledge: (pledgeId: string, pledgeData: PledgeUpdate): Promise<Pledge> =>
    api.put(`/pledges/${pledgeId}`, pledgeData),

  deletePledge: (pledgeId: string): Promise<void> =>
    api.delete(`/pledges/${pledgeId}`),
};

// Payouts API
export const payoutsApi = {
  getPayouts: (spaceId?: string): Promise<Payout[]> =>
    api.get('/payouts', spaceId ? { space_id: spaceId } : undefined),

  getPayout: (payoutId: string): Promise<Payout> =>
    api.get(`/payouts/${payoutId}`),

  createPayout: (payoutData: PayoutCreate): Promise<Payout> =>
    api.post('/payouts', payoutData),

  getPayoutConsents: (payoutId: string): Promise<Consent[]> =>
    api.get(`/payouts/${payoutId}/consents`),

  submitConsent: (payoutId: string, consentData: ConsentCreate): Promise<Consent> =>
    api.post(`/payouts/${payoutId}/consent`, consentData),

  getConsentSummary: (payoutId: string): Promise<ConsentSummary> =>
    api.get(`/payouts/${payoutId}/consent-summary`),

  executePayout: (payoutId: string): Promise<void> =>
    api.post(`/payouts/${payoutId}/execute`),

  processPayoutPayments: (payoutId: string): Promise<{
    payout_id: string;
    message: string;
    payment_results: any[]
  }> =>
    api.post(`/payouts/${payoutId}/process-payments`),

  completePayout: (payoutId: string): Promise<void> =>
    api.post(`/payouts/${payoutId}/complete`),
};

// Payments API
export const paymentsApi = {
  getStripeConfig: (): Promise<StripeConfig> =>
    api.get('/payments/stripe-config'),

  createSetupIntent: (): Promise<SetupIntent> =>
    api.post('/payments/setup-intent'),

  getPaymentMethods: (): Promise<{ payment_methods: PaymentMethod[] }> =>
    api.get('/payments/payment-methods'),

  setDefaultPaymentMethod: (paymentMethodId: string): Promise<{ message: string }> =>
    api.post(`/payments/payment-methods/${paymentMethodId}/set-default`),

  removePaymentMethod: (paymentMethodId: string): Promise<{ message: string }> =>
    api.delete(`/payments/payment-methods/${paymentMethodId}`),
};

// Notifications API
export const notificationsApi = {
  testEmail: (emailData: EmailTestRequest): Promise<{ message: string; recipient: string }> =>
    api.post('/notifications/test-email', emailData),

  getConfig: (): Promise<NotificationConfig> =>
    api.get('/notifications/config'),
};

// Webhooks API (for testing purposes)
export const webhooksApi = {
  processStripeWebhook: (payload: any, signature: string): Promise<{ received: boolean; event_type: string }> =>
    api.post('/webhooks/stripe', payload, {
      headers: { 'stripe-signature': signature }
    }),

  processPayoutManually: (payoutId: string): Promise<{
    payout_id: string;
    status: string;
    message: string
  }> =>
    api.post(`/webhooks/process-payout/${payoutId}`),
};

// Transfers API
export const transfersApi = {
  createTransfer: (transferData: {
    from_space_id: string;
    to_space_id: string;
    amount_minor: number;
    currency: string;
    memo?: string;
  }): Promise<any> =>
    api.post('/transfers', transferData),
};

// Utility API
export const utilityApi = {
  ping: (): Promise<{ message: string }> =>
    api.get('/ping'),

  healthCheck: (): Promise<{ status: string; timestamp: string }> =>
    api.get('/health'),
};