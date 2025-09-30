// User types
export interface User {
  id: string;
  email: string;
  name: string;
  stripe_customer_id?: string;
  payment_method_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
}

// Space types
export interface Space {
  id: string;
  name: string;
  description: string;
  currency: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceCreate {
  name: string;
  description: string;
  currency: string;
}

export interface SpaceUpdate {
  name?: string;
  description?: string;
  currency?: string;
  is_active?: boolean;
}

export interface MemberAllocation {
  id: string;
  space_id: string;
  user_id: string;
  allocation_pct: number;
  is_active: boolean;
  joined_at: string;
}

export interface SpaceWithMembers extends Space {
  members: MemberAllocation[];
  member_count: number;
  user_allocation?: number;
}

// Pledge types
export interface Pledge {
  id: string;
  space_id: string;
  user_id: string;
  amount_minor: number;
  currency: string;
  description: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PledgeCreate {
  space_id: string;
  amount_minor: number;
  currency: string;
  description: string;
  due_date?: string;
}

export interface PledgeUpdate {
  amount_minor?: number;
  description?: string;
  due_date?: string;
}

// Payout types
export type PayoutStatus = 'PROPOSED' | 'CONSENT_PENDING' | 'READY' | 'EXECUTING' | 'SETTLED' | 'FAILED';
export type ConsentDecision = 'PENDING' | 'APPROVE' | 'DENY' | 'AUTO_APPROVE';

export interface Payout {
  id: string;
  space_id: string;
  payee_name: string;
  amount_minor: number;
  currency: string;
  description: string;
  status: PayoutStatus;
  consent_deadline: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutCreate {
  space_id: string;
  payee_name: string;
  amount_minor: number;
  currency: string;
  description: string;
}

export interface Consent {
  id: string;
  payout_id: string;
  user_id: string;
  decision: ConsentDecision;
  reason?: string;
  decided_at?: string;
  created_at: string;
}

export interface ConsentCreate {
  decision: ConsentDecision;
  reason?: string;
}

export interface ConsentSummary {
  payout_id: string;
  total_members: number;
  total_allocation: number;
  consent_counts: {
    approved: number;
    denied: number;
    pending: number;
    auto_approved: number;
  };
  consent_allocations: {
    approved: number;
    denied: number;
    pending: number;
    auto_approved: number;
  };
  quorum_needed: number;
  ready_for_execution: boolean;
}

// Ledger types
export type LedgerEntryType = 'PLEDGE' | 'DEBIT' | 'CREDIT' | 'ADJUST';

export interface LedgerEntry {
  id: string;
  space_id: string;
  user_id: string;
  type: LedgerEntryType;
  currency: string;
  amount_minor: number;
  ref_type?: string;
  ref_id?: string;
  event_time: string;
  idempotency_key: string;
  memo?: string;
  created_at: string;
}

export interface BalanceSummary {
  pledged: number;
  debited: number;
  credited: number;
  adjusted: number;
  net_balance: number;
  status: 'surplus' | 'settled' | 'deficit';
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface SetupIntent {
  client_secret: string;
  setup_intent_id: string;
}

export interface StripeConfig {
  publishable_key: string;
}

// Notification types
export interface EmailTestRequest {
  to_email: string;
  subject?: string;
  message?: string;
}

export interface NotificationConfig {
  email_configured: boolean;
  email_host: string;
  email_port: number;
  email_from: string;
  email_use_tls: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// App state types
export interface AppState {
  user: User | null;
  currentSpace: Space | null;
  isLoading: boolean;
  error: string | null;
}

// API Error type
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}