import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Payout, ConsentSummary, Consent } from '../../types';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import {
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Activity,
  Users,
  PlayCircle,
  Zap
} from 'lucide-react';

interface PayoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: Payout | null;
  consentSummary: ConsentSummary | null;
  consents: Consent[];
  onOpenConsent: () => void;
  onExecutePayout?: (payoutId: string) => Promise<void>;
  isAdmin?: boolean;
}

const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({
  isOpen,
  onClose,
  payout,
  consentSummary,
  consents,
  onOpenConsent,
  onExecutePayout,
  isAdmin = false
}) => {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!payout) {
    return null;
  }

  const handleExecute = async () => {
    if (!onExecutePayout || !payout) return;

    setIsExecuting(true);
    try {
      await onExecutePayout(payout.id);
      onClose();
    } catch (error) {
      console.error('Failed to execute payout:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROPOSED': return 'text-yellow-600 bg-yellow-100';
      case 'CONSENT_PENDING': return 'text-blue-600 bg-blue-100';
      case 'READY': return 'text-green-600 bg-green-100';
      case 'EXECUTING': return 'text-purple-600 bg-purple-100';
      case 'SETTLED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const timelineEvents = [
    {
      type: 'created',
      timestamp: payout.created_at,
      title: 'Payout Proposed',
      description: 'Payout was created and proposed to the group',
      icon: Clock,
      color: 'text-blue-600'
    },
    ...(payout.status !== 'PROPOSED' ? [{
      type: 'consent_started',
      timestamp: payout.created_at, // This would ideally be consent start time
      title: 'Consent Period Started',
      description: 'Members can now vote on this payout',
      icon: Users,
      color: 'text-blue-600'
    }] : []),
    ...(payout.status === 'READY' || payout.status === 'EXECUTING' || payout.status === 'SETTLED' ? [{
      type: 'approved',
      timestamp: payout.consent_deadline,
      title: 'Payout Approved',
      description: 'Required consent threshold reached',
      icon: CheckCircle,
      color: 'text-green-600'
    }] : []),
    ...(payout.status === 'EXECUTING' || payout.status === 'SETTLED' ? [{
      type: 'executing',
      timestamp: payout.executed_at || payout.updated_at,
      title: 'Payment Processing',
      description: 'Payout is being processed',
      icon: Zap,
      color: 'text-purple-600'
    }] : []),
    ...(payout.status === 'SETTLED' && payout.executed_at ? [{
      type: 'completed',
      timestamp: payout.executed_at,
      title: 'Payment Completed',
      description: 'Payout has been successfully processed',
      icon: CheckCircle,
      color: 'text-green-600'
    }] : []),
    ...(payout.status === 'FAILED' ? [{
      type: 'failed',
      timestamp: payout.updated_at,
      title: 'Payment Failed',
      description: 'Payout processing failed',
      icon: XCircle,
      color: 'text-red-600'
    }] : [])
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const isDeadlinePassed = new Date(payout.consent_deadline) < new Date();
  const canExecute = isAdmin && payout.status === 'READY' && consentSummary?.ready_for_execution;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payout Details" size="lg">
      <div className="space-y-6">
        {/* Header with amount and status */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatCurrency(payout.amount_minor, payout.currency)}
              </h2>
              <p className="text-gray-600">to {payout.payee_name}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payout.status)}`}>
            {payout.status.replace('_', ' ')}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
          <p className="text-gray-900">{payout.description}</p>
        </div>

        {/* Consent Summary */}
        {consentSummary && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Approval Progress</h3>
              <span className="text-sm text-gray-600">
                {((consentSummary.approved_allocation / consentSummary.total_allocation) * 100).toFixed(1)}% approved
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (consentSummary.approved_allocation / consentSummary.total_allocation) * 100)}%`
                }}
              />
            </div>

            {/* Consent Breakdown */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">
                    {consentSummary.consents?.filter((c: any) => c.decision === 'APPROVE').length || 0} members
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Denied:</span>
                  <span className="font-medium text-red-600">
                    {consentSummary.consents?.filter((c: any) => c.decision === 'DENY').length || 0} members
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">
                    {consentSummary.consents?.filter((c: any) => c.decision === 'PENDING').length || 0} members
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Required:</span>
                  <span className="font-medium text-gray-900">
                    {(consentSummary.quorum_needed * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {consentSummary.ready_for_execution && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✓ This payout has reached the required approval threshold and is ready for execution.
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-3">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              const isLast = index === timelineEvents.length - 1;

              return (
                <div key={event.type} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 ${
                    event.color.replace('text-', 'border-')
                  }`}>
                    <Icon className={`h-4 w-4 ${event.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                  {!isLast && (
                    <div className="absolute left-4 mt-8 w-0.5 h-6 bg-gray-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Consents */}
        {consents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Member Decisions</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {consents.map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      User {consent.user_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {consent.decision === 'APPROVE' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : consent.decision === 'DENY' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm capitalize text-gray-700">
                      {consent.decision.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deadline Info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Calendar className="h-4 w-4" />
            <span>
              Consent deadline: {formatDateTime(payout.consent_deadline)}
              {isDeadlinePassed && ' (Expired)'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div>
            {payout.status === 'CONSENT_PENDING' && (
              <Button variant="secondary" onClick={onOpenConsent}>
                Submit Consent
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {canExecute && (
              <Button
                onClick={handleExecute}
                loading={isExecuting}
                disabled={isExecuting}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Execute Payout
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PayoutDetailModal;