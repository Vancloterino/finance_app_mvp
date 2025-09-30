import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Payout, ConsentCreate, ConsentSummary, ConsentDecision } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, Calendar } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: Payout | null;
  consentSummary: ConsentSummary | null;
  onSubmitConsent: (payoutId: string, consent: ConsentCreate) => Promise<void>;
  currentUserId?: string;
  userHasConsented?: boolean;
  userConsentDecision?: ConsentDecision;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  payout,
  consentSummary,
  onSubmitConsent,
  currentUserId,
  userHasConsented = false,
  userConsentDecision
}) => {
  const [selectedDecision, setSelectedDecision] = useState<ConsentDecision | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userHasConsented && userConsentDecision) {
      setSelectedDecision(userConsentDecision);
    } else if (isOpen) {
      setSelectedDecision(null);
      setReason('');
      setError(null);
    }
  }, [isOpen, userHasConsented, userConsentDecision]);

  const handleSubmit = async () => {
    if (!payout || !selectedDecision) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const consentData: ConsentCreate = {
        decision: selectedDecision,
        reason: reason.trim() || undefined
      };

      await onSubmitConsent(payout.id, consentData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeadlinePassed = payout && new Date(payout.consent_deadline) < new Date();
  const timeUntilDeadline = payout ? new Date(payout.consent_deadline).getTime() - new Date().getTime() : 0;
  const hoursUntilDeadline = Math.max(0, Math.floor(timeUntilDeadline / (1000 * 60 * 60)));

  if (!payout) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Consent Required">
      <div className="space-y-6">
        {/* Payout Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Payout Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{formatCurrency(payout.amount_minor, payout.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payee:</span>
              <span className="font-medium">{payout.payee_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{payout.description}</span>
            </div>
          </div>
        </div>

        {/* Deadline Warning */}
        {!isDeadlinePassed && hoursUntilDeadline <= 24 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Deadline Approaching</p>
                <p className="text-sm text-yellow-700">
                  You have {hoursUntilDeadline} hours left to submit your consent.
                  The deadline is {formatDateTime(payout.consent_deadline)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Passed */}
        {isDeadlinePassed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Consent Period Expired</p>
                <p className="text-sm text-red-700">
                  The consent deadline has passed. This payout may proceed to auto-approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Consent Summary */}
        {consentSummary && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">Current Approval Status</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">
                  <span className="font-medium">{consentSummary.consent_counts.approved}</span> Approved
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">{consentSummary.consent_counts.denied}</span> Denied
                </p>
              </div>
              <div>
                <p className="text-blue-700">
                  <span className="font-medium">{consentSummary.consent_counts.pending}</span> Pending
                </p>
                <p className="text-blue-700">
                  Progress: <span className="font-medium">
                    {((consentSummary.consent_allocations.approved / consentSummary.total_allocation) * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 bg-white rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (consentSummary.consent_allocations.approved / consentSummary.total_allocation) * 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Need {(consentSummary.quorum_needed * 100).toFixed(1)}% approval to proceed
            </p>
          </div>
        )}

        {/* Already Consented */}
        {userHasConsented && userConsentDecision && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Consent Submitted</p>
                <p className="text-sm text-green-700">
                  You have {userConsentDecision === 'APPROVE' ? 'approved' : 'denied'} this payout.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Consent Options */}
        {!userHasConsented && !isDeadlinePassed && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Your Decision</h4>
            <div className="space-y-3">
              <button
                type="button"
                className={`w-full flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  selectedDecision === 'APPROVE'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                }`}
                onClick={() => setSelectedDecision('APPROVE')}
              >
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Approve</p>
                  <p className="text-sm opacity-75">I agree this payout should proceed</p>
                </div>
              </button>

              <button
                type="button"
                className={`w-full flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  selectedDecision === 'DENY'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                }`}
                onClick={() => setSelectedDecision('DENY')}
              >
                <XCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Deny</p>
                  <p className="text-sm opacity-75">I disagree with this payout</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Reason Field */}
        {selectedDecision && !userHasConsented && (
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                selectedDecision === 'APPROVE'
                  ? 'Why do you approve this payout?'
                  : 'Why do you disagree with this payout?'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {userHasConsented ? 'Close' : 'Cancel'}
          </Button>
          {!userHasConsented && !isDeadlinePassed && selectedDecision && (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              variant={selectedDecision === 'APPROVE' ? 'default' : 'secondary'}
            >
              Submit {selectedDecision === 'APPROVE' ? 'Approval' : 'Denial'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConsentModal;