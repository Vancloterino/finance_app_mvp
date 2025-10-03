import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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
  Consent
} from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import PledgeList from '../components/pledges/PledgeList';
import CreatePledgeModal from '../components/pledges/CreatePledgeModal';
import PledgeDetailModal from '../components/pledges/PledgeDetailModal';
import PayoutList from '../components/payouts/PayoutList';
import CreatePayoutModal from '../components/payouts/CreatePayoutModal';
import PayoutDetailModal from '../components/payouts/PayoutDetailModal';
import ConsentModal from '../components/payouts/ConsentModal';
import PaymentHistory from '../components/payments/PaymentHistory';
import { ArrowLeft, Users, DollarSign, Settings, Plus, CreditCard, AlertTriangle } from 'lucide-react';

const SpaceDetailPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { state, setCurrentSpace } = useApp();
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

  const handleCreatePledge = async (pledgeData: PledgeCreate) => {
    await pledgesApi.createPledge(pledgeData);
    await loadPledges();
  };

  const handleUpdatePledge = async (pledgeId: string, updateData: PledgeUpdate) => {
    await pledgesApi.updatePledge(pledgeId, updateData);
    await loadPledges();
  };

  const handleDeletePledge = async (pledgeId: string) => {
    await pledgesApi.deletePledge(pledgeId);
    await loadPledges();
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
    await payoutsApi.createPayout(payoutData);
    await loadPayouts();
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
    await payoutsApi.submitConsent(payoutId, consent);
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
  };

  const handleExecutePayout = async (payoutId: string) => {
    await payoutsApi.executePayout(payoutId);
    await loadPayouts();
  };

  // Check if current user is admin (check if they have admin role in the space)
  const isCurrentUserAdmin = state.user && space && space.members.some(
    member => member.user_id === state.user?.id && member.role === 'admin' && member.is_active
  );

  // Check if current user has already consented to selected payout
  const userConsent = selectedPayout && state.user
    ? consents.find(c => c.user_id === state.user?.id && c.payout_id === selectedPayout.id)
    : null;

  const loadPaymentMethodStatus = async () => {
    try {
      const response = await paymentsApi.getPaymentMethods();
      setHasPaymentMethod(response.payment_methods.length > 0);
    } catch (err) {
      console.error('Failed to load payment method status:', err);
      setHasPaymentMethod(false);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/spaces')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
            <p className="text-gray-600">{space.description}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/spaces/${spaceId}/settings`)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{space.member_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Your Share</p>
              <p className="text-2xl font-bold text-gray-900">
                {space.user_allocation ? `${(space.user_allocation * 100).toFixed(1)}%` : 'N/A'}
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
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'pledges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pledges')}
          >
            Pledges ({pledges.length})
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'payouts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts ({payouts.length})
          </button>
          <button
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('members')}
          >
            Members ({space.member_count})
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
          {/* Recent Pledges */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Pledges</h3>
              <Button size="sm" onClick={() => setIsCreatePledgeModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pledge
              </Button>
            </div>
            <div className="space-y-4">
              <PledgeList
                pledges={pledges.slice(0, 3)}
                isLoading={pledgesLoading}
                onPledgeClick={handlePledgeClick}
              />
              {pledges.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('pledges')}
                  className="w-full"
                >
                  View all {pledges.length} pledges
                </Button>
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
              {space.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">User {member.user_id.slice(0, 8)}...</p>
                    <p className="text-sm text-gray-500">
                      {member.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {(member.allocation_pct * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pledges' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">All Pledges</h3>
            <Button onClick={() => setIsCreatePledgeModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pledge
            </Button>
          </div>
          <PledgeList
            pledges={pledges}
            isLoading={pledgesLoading}
            onPledgeClick={handlePledgeClick}
          />
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
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
          <PayoutList
            payouts={payouts}
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
            {space.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">User {member.user_id.slice(0, 8)}...</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {(member.allocation_pct * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {member.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            ))}
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