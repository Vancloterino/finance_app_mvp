import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../contexts/ToastContext';
import { usePolling } from '../hooks/usePolling';
import { spacesApi, pledgesApi, payoutsApi, paymentsApi } from '../api/services';
import {
  SpaceWithMembers,
  Pledge,
  PledgeCreate,
  PledgeUpdate,
  Payout,
  PayoutCreate,
  ConsentCreate,
  ConsentSummary,
  Consent,
  LedgerEntry
} from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import FilterSelect from '../components/ui/FilterSelect';
import SearchInput from '../components/ui/SearchInput';
import PledgeList from '../components/pledges/PledgeList';
import CreatePledgeModal from '../components/pledges/CreatePledgeModal';
import PledgeDetailModal from '../components/pledges/PledgeDetailModal';
import PayoutList from '../components/payouts/PayoutList';
import CreatePayoutModal from '../components/payouts/CreatePayoutModal';
import PayoutDetailModal from '../components/payouts/PayoutDetailModal';
import ConsentModal from '../components/payouts/ConsentModal';
import PaymentHistory from '../components/payments/PaymentHistory';
import { ArrowLeft, Users, DollarSign, Settings, Plus, CreditCard, AlertTriangle, TrendingUp, TrendingDown, Minus, Send, BarChart3 } from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const SpaceDetailPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { state, setCurrentSpace } = useApp();
  const toast = useToast();
  const [space, setSpace] = useState<SpaceWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Pledge-related state
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgesLoading, setPledgesLoading] = useState(false);
  const [isCreatePledgeModalOpen, setIsCreatePledgeModalOpen] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [isPledgeDetailModalOpen, setIsPledgeDetailModalOpen] = useState(false);

  // Payout-related state
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [isCreatePayoutModalOpen, setIsCreatePayoutModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isPayoutDetailModalOpen, setIsPayoutDetailModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentSummary, setConsentSummary] = useState<ConsentSummary | null>(null);
  const [consents, setConsents] = useState<Consent[]>([]);

  // Payment-related state
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);

  // Ledger/Transaction history state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filter and search state
  const [pledgeSearch, setPledgeSearch] = useState('');
  const [payoutFilter, setPayoutFilter] = useState('');

  useEffect(() => {
    const loadSpace = async () => {
      if (!spaceId) {
        setError('Invalid space ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const spaceData = await spacesApi.getSpace(spaceId);
        setSpace(spaceData);
        setCurrentSpace(spaceData);
      } catch (err: any) {
        setError(err.message || 'Failed to load space');
      } finally {
        setLoading(false);
      }
    };

    loadSpace();
  }, [spaceId, setCurrentSpace]);

  // Load pledges when space is loaded and pledges tab is active
  useEffect(() => {
    if (space && (activeTab === 'pledges' || activeTab === 'overview')) {
      loadPledges();
    }
  }, [space, activeTab]);

  // Load payouts when space is loaded and payouts tab is active
  useEffect(() => {
    if (space && (activeTab === 'payouts' || activeTab === 'overview')) {
      loadPayouts();
    }
  }, [space, activeTab]);

  // Load ledger when space is loaded and overview tab is active
  useEffect(() => {
    if (space && activeTab === 'overview') {
      loadLedger();
    }
  }, [space, activeTab]);

  // Load payment method status when space is loaded
  useEffect(() => {
    if (space) {
      loadPaymentMethodStatus();
    }
  }, [space]);

  const loadPledges = async () => {
    if (!spaceId) return;

    setPledgesLoading(true);
    try {
      const pledgeData = await pledgesApi.getPledges(spaceId);
      setPledges(pledgeData);
    } catch (err: any) {
      console.error('Failed to load pledges:', err);
    } finally {
      setPledgesLoading(false);
    }
  };

  const loadLedger = async () => {
    if (!spaceId) return;

    setLedgerLoading(true);
    try {
      const ledgerData = await spacesApi.getSpaceLedger(spaceId);
      setLedgerEntries(ledgerData);
    } catch (err: any) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCreatePledge = async (pledgeData: PledgeCreate) => {
    try {
      await pledgesApi.createPledge(pledgeData);
      toast.success('Pledge created successfully!');
      await loadPledges();
      await loadLedger();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create pledge');
      throw error;
    }
  };

  const handleUpdatePledge = async (pledgeId: string, updateData: PledgeUpdate) => {
    try {
      await pledgesApi.updatePledge(pledgeId, updateData);
      toast.success('Pledge updated successfully!');
      await loadPledges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update pledge');
      throw error;
    }
  };

  const handleDeletePledge = async (pledgeId: string) => {
    try {
      await pledgesApi.deletePledge(pledgeId);
      toast.success('Pledge deleted successfully!');
      await loadPledges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete pledge');
      throw error;
    }
  };

  const handlePledgeClick = (pledge: Pledge) => {
    setSelectedPledge(pledge);
    setIsPledgeDetailModalOpen(true);
  };

  const loadPayouts = async () => {
    if (!spaceId) return;

    setPayoutsLoading(true);
    try {
      const payoutData = await payoutsApi.getPayouts(spaceId);
      setPayouts(payoutData);
    } catch (err: any) {
      console.error('Failed to load payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const handleCreatePayout = async (payoutData: PayoutCreate) => {
    try {
      await payoutsApi.createPayout(payoutData);
      toast.success('Payout proposal created! Awaiting member consent.');
      await loadPayouts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payout');
      throw error;
    }
  };

  const handlePayoutClick = async (payout: Payout) => {
    setSelectedPayout(payout);

    // Load consent data for the payout
    try {
      const [summary, consentList] = await Promise.all([
        payoutsApi.getConsentSummary(payout.id),
        payoutsApi.getPayoutConsents(payout.id)
      ]);
      setConsentSummary(summary);
      setConsents(consentList);
    } catch (err) {
      console.error('Failed to load consent data:', err);
    }

    setIsPayoutDetailModalOpen(true);
  };

  const handleOpenConsent = () => {
    setIsPayoutDetailModalOpen(false);
    setIsConsentModalOpen(true);
  };

  const handleSubmitConsent = async (payoutId: string, consent: ConsentCreate) => {
    try {
      await payoutsApi.submitConsent(payoutId, consent);
      const isApproval = consent.decision === 'approve' || consent.decision === 'auto_approve';
      toast.success(`Your ${isApproval ? 'approval' : 'rejection'} has been recorded.`);
      // Reload consent data
      if (selectedPayout) {
        const [summary, consentList] = await Promise.all([
          payoutsApi.getConsentSummary(selectedPayout.id),
          payoutsApi.getPayoutConsents(selectedPayout.id)
        ]);
        setConsentSummary(summary);
        setConsents(consentList);
      }
      await loadPayouts(); // Refresh payout list
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit consent');
      throw error;
    }
  };

  const handleExecutePayout = async (payoutId: string) => {
    try {
      await payoutsApi.executePayout(payoutId);
      toast.success('Payout executed successfully! Processing payment...');
      await loadPayouts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute payout');
      throw error;
    }
  };

  // Check if current user is admin (check if they have admin role in the space)
  const isCurrentUserAdmin = state.user && space && space.members.some(
    member => member.user_id === state.user?.id && member.role === 'admin' && member.is_active
  );

  // Check if current user has already consented to selected payout
  const userConsent = selectedPayout && state.user
    ? consents.find(c => c.user_id === state.user?.id && c.payout_id === selectedPayout.id)
    : null;

  // Filter pledges based on search
  const filteredPledges = useMemo(() => {
    if (!pledgeSearch.trim()) return pledges;

    const query = pledgeSearch.toLowerCase();
    return pledges.filter(
      (pledge) =>
        pledge.description.toLowerCase().includes(query) ||
        pledge.amount.toString().includes(query)
    );
  }, [pledges, pledgeSearch]);

  // Filter payouts based on status
  const filteredPayouts = useMemo(() => {
    if (!payoutFilter) return payouts;

    return payouts.filter((payout) => payout.status === payoutFilter);
  }, [payouts, payoutFilter]);

  const loadPaymentMethodStatus = async () => {
    try {
      const response = await paymentsApi.getPaymentMethods();
      setHasPaymentMethod(response.payment_methods.length > 0);
    } catch (err) {
      console.error('Failed to load payment method status:', err);
      setHasPaymentMethod(false);
    }
  };

  // Refresh data function for polling
  const refreshData = useCallback(async () => {
    if (!spaceId || !space) return;

    try {
      // Silently refresh data in background without showing loading states
      const [spaceData, pledgeData, payoutData] = await Promise.all([
        spacesApi.getSpace(spaceId),
        pledgesApi.getPledges(spaceId),
        payoutsApi.getPayouts(spaceId)
      ]);

      setSpace(spaceData);
      setPledges(pledgeData);
      setPayouts(payoutData);
      setLastUpdated(new Date());
    } catch (err) {
      // Silently fail - don't show errors during background refresh
      console.error('Background refresh failed:', err);
    }
  }, [spaceId, space]);

  // Enable polling when space is loaded and user is on the page
  usePolling(refreshData, {
    interval: 30000, // 30 seconds
    enabled: !!space && !loading
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Space not found'}
          </h2>
          <Button onClick={() => navigate('/spaces')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Spaces
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/spaces')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{space.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <p className="text-sm sm:text-base text-gray-600">{space.description}</p>
              <span className="text-xs text-gray-400">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/spaces/${spaceId}/settings`)}
          className="self-start sm:self-auto"
        >
          <Settings className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setIsCreatePledgeModalOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pledge
          </Button>
          <Button
            onClick={() => setIsCreatePayoutModalOpen(true)}
            disabled={!isCurrentUserAdmin}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <Send className="h-4 w-4 mr-2" />
            Propose Payout
          </Button>
          <Button
            onClick={() => navigate(`/spaces/${spaceId}/settings`)}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Financial Overview
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pool */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Pool</p>
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                const total = pledges.reduce((sum, p) => sum + p.amount_minor, 0);
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: space.currency
                }).format(total / 100);
              })()}
            </p>
          </div>

          {/* Your Balance */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Your Balance</p>
            {(() => {
              // Calculate from ledger: pledges + credits - debits
              const userEntries = ledgerEntries.filter(e => e.user_id === state.user?.id);
              const credits = userEntries
                .filter(e => e.type === 'PLEDGE' || e.type === 'CREDIT')
                .reduce((sum, e) => sum + e.amount_minor, 0);
              const debits = userEntries
                .filter(e => e.type === 'DEBIT')
                .reduce((sum, e) => sum + e.amount_minor, 0);
              const balance = credits - debits;
              const isPositive = balance >= 0;
              const BalanceIcon = isPositive ? TrendingUp : TrendingDown;

              return (
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: space.currency
                      }).format(balance / 100)}
                    </p>
                    <BalanceIcon className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pledges + Transfers In - Transfers Out - Payouts
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Pending Payouts</p>
            <p className="text-2xl font-bold text-gray-900">
              {payouts.filter(p => p.status === 'CONSENT_PENDING' || p.status === 'READY').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                const pending = payouts.filter(p => p.status === 'CONSENT_PENDING' || p.status === 'READY');
                const total = pending.reduce((sum, p) => sum + p.amount_minor, 0);
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: space.currency
                }).format(total / 100);
              })()}
            </p>
          </div>

          {/* Members Active */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Active Members</p>
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {space.members.slice(0, 4).map((member, idx) => (
                  <Avatar
                    key={member.id}
                    name={member.user?.name || `User ${idx + 1}`}
                    size="sm"
                    className="border-2 border-white"
                  />
                ))}
              </div>
              {space.members.length > 4 && (
                <span className="text-sm font-medium text-gray-600">
                  +{space.members.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{space.members?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Your Contribution (Pledges)</p>
              <div className="flex items-baseline space-x-3">
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // Only count PLEDGE type entries for contribution
                    const userPledgeEntries = ledgerEntries.filter(e => e.user_id === state.user?.id && e.type === 'PLEDGE');
                    const userTotal = userPledgeEntries.reduce((sum, e) => sum + e.amount_minor, 0);
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: space.currency
                    }).format(userTotal / 100);
                  })()}
                </p>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const userPledgeEntries = ledgerEntries.filter(e => e.user_id === state.user?.id && e.type === 'PLEDGE');
                    const totalPledgeEntries = ledgerEntries.filter(e => e.type === 'PLEDGE');
                    const userTotal = userPledgeEntries.reduce((sum, e) => sum + e.amount_minor, 0);
                    const totalPledges = totalPledgeEntries.reduce((sum, e) => sum + e.amount_minor, 0);
                    const contributionPct = totalPledges > 0 ? (userTotal / totalPledges) * 100 : 0;
                    return `(${contributionPct.toFixed(1)}% of total)`;
                  })()}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Amount you pledged
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Currency</p>
              <p className="text-2xl font-bold text-gray-900">{space.currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            className={`border-b-2 py-2 px-1 text-xs sm:text-sm font-medium whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-xs sm:text-sm font-medium whitespace-nowrap ${
              activeTab === 'pledges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pledges')}
          >
            Pledges ({pledges.length})
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-xs sm:text-sm font-medium whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts ({payouts.length})
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-xs sm:text-sm font-medium whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('members')}
          >
            Members ({space.members?.length || 0})
          </button>
        </nav>
      </div>

      {/* Payment Method Warning */}
      {hasPaymentMethod === false && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Payment Method Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                Add a payment method to participate in group payouts and shared expenses.
              </p>
              <button
                onClick={() => navigate('/payments')}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Add Payment Method →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
              <Button size="sm" onClick={() => setIsCreatePledgeModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pledge
              </Button>
            </div>
            <div className="space-y-3">
              {ledgerLoading ? (
                <LoadingSpinner size="sm" />
              ) : ledgerEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                <>
                  {ledgerEntries.slice(0, 5).map((entry) => {
                    const isPositive = entry.type === 'PLEDGE' || entry.type === 'CREDIT';
                    const isTransfer = entry.ref_type === 'TRANSFER';
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {isTransfer ? (
                            <ArrowRightLeft className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-orange-600'}`} />
                          ) : (
                            <DollarSign className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.type} {isTransfer && `(${isPositive ? 'In' : 'Out'})`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.memo || entry.ref_type}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: entry.currency
                          }).format(entry.amount_minor / 100)}
                        </p>
                      </div>
                    );
                  })}
                  {ledgerEntries.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      View all {ledgerEntries.length} transactions
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Members</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/spaces/${spaceId}/settings`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
            <div className="space-y-3">
              {space.members.map((member) => {
                const memberName = member.user?.name || `User ${member.user_id.slice(0, 8)}...`;
                const userPledges = pledges.filter(p => p.user_id === member.user_id);
                const memberTotal = userPledges.reduce((sum, p) => sum + p.amount_minor, 0);
                const totalPledges = pledges.reduce((sum, p) => sum + p.amount_minor, 0);
                const allocatedAmount = totalPledges * parseFloat(member.allocation_pct.toString());
                const balance = memberTotal - allocatedAmount;
                const isBalanced = Math.abs(balance) < 100; // Within $1
                const isAhead = balance > 100;

                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={memberName} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{memberName}</p>
                        <p className="text-xs text-gray-500">
                          {member.role === 'admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              Admin
                            </span>
                          )}
                          {member.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <p className="font-medium text-gray-900">
                          {(parseFloat(member.allocation_pct.toString()) * 100).toFixed(1)}%
                        </p>
                        {isBalanced ? (
                          <Minus className="h-4 w-4 text-gray-400" />
                        ) : isAhead ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">allocated</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pledges' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">All Pledges</h3>
            <Button onClick={() => setIsCreatePledgeModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pledge
            </Button>
          </div>
          {pledges.length > 0 && (
            <div className="mb-4">
              <SearchInput
                value={pledgeSearch}
                onChange={setPledgeSearch}
                placeholder="Search pledges by description or amount..."
                className="max-w-md"
              />
            </div>
          )}
          <PledgeList
            pledges={filteredPledges}
            isLoading={pledgesLoading}
            onPledgeClick={handlePledgeClick}
          />
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">All Payouts</h3>
            <Button
              onClick={() => setIsCreatePayoutModalOpen(true)}
              disabled={!isCurrentUserAdmin}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Payout
            </Button>
          </div>
          {!isCurrentUserAdmin && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Only space administrators can create payouts.
              </p>
            </div>
          )}
          {payouts.length > 0 && (
            <div className="mb-4">
              <FilterSelect
                value={payoutFilter}
                onChange={setPayoutFilter}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'executed', label: 'Executed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                label="Status"
              />
            </div>
          )}
          <PayoutList
            payouts={filteredPayouts}
            isLoading={payoutsLoading}
            onPayoutClick={handlePayoutClick}
          />
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Space Members</h3>
            <Button
              variant="secondary"
              onClick={() => navigate(`/spaces/${spaceId}/settings`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <div className="space-y-4">
            {space.members.map((member) => {
              const memberName = member.user?.name || `User ${member.user_id.slice(0, 8)}...`;
              const userPledges = pledges.filter(p => p.user_id === member.user_id);
              const memberTotal = userPledges.reduce((sum, p) => sum + p.amount_minor, 0);
              const totalPledges = pledges.reduce((sum, p) => sum + p.amount_minor, 0);
              const allocatedAmount = totalPledges * parseFloat(member.allocation_pct.toString());
              const balance = memberTotal - allocatedAmount;
              const isBalanced = Math.abs(balance) < 100;
              const isAhead = balance > 100;

              return (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar name={memberName} size="lg" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{memberName}</p>
                        {member.role === 'admin' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {member.user?.email} • Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-600">
                          Pledged: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: space.currency
                          }).format(memberTotal / 100)}
                        </p>
                        {!isBalanced && (
                          <span className={`text-xs font-medium ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
                            ({isAhead ? '+' : ''}{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: space.currency
                            }).format(balance / 100)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <p className="text-xl font-bold text-gray-900">
                        {(parseFloat(member.allocation_pct.toString()) * 100).toFixed(1)}%
                      </p>
                      {isBalanced ? (
                        <Minus className="h-5 w-5 text-gray-400" />
                      ) : isAhead ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {member.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePledgeModal
        isOpen={isCreatePledgeModalOpen}
        onClose={() => setIsCreatePledgeModalOpen(false)}
        onSubmit={handleCreatePledge}
        spaceId={spaceId!}
        currency={space.currency}
      />

      <PledgeDetailModal
        isOpen={isPledgeDetailModalOpen}
        onClose={() => {
          setIsPledgeDetailModalOpen(false);
          setSelectedPledge(null);
        }}
        pledge={selectedPledge}
        onUpdate={handleUpdatePledge}
        onDelete={handleDeletePledge}
        currentUserId={state.user?.id}
      />

      <CreatePayoutModal
        isOpen={isCreatePayoutModalOpen}
        onClose={() => setIsCreatePayoutModalOpen(false)}
        onSubmit={handleCreatePayout}
        spaceId={spaceId!}
        currency={space.currency}
        isAdmin={isCurrentUserAdmin}
      />

      <PayoutDetailModal
        isOpen={isPayoutDetailModalOpen}
        onClose={() => {
          setIsPayoutDetailModalOpen(false);
          setSelectedPayout(null);
          setConsentSummary(null);
          setConsents([]);
        }}
        payout={selectedPayout}
        consentSummary={consentSummary}
        consents={consents}
        onOpenConsent={handleOpenConsent}
        onExecutePayout={handleExecutePayout}
        isAdmin={isCurrentUserAdmin}
      />

      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => {
          setIsConsentModalOpen(false);
          if (!isPayoutDetailModalOpen) {
            setSelectedPayout(null);
            setConsentSummary(null);
            setConsents([]);
          }
        }}
        payout={selectedPayout}
        consentSummary={consentSummary}
        onSubmitConsent={handleSubmitConsent}
        currentUserId={state.user?.id}
        userHasConsented={!!userConsent}
        userConsentDecision={userConsent?.decision}
      />
    </div>
  );
};

export default SpaceDetailPage;