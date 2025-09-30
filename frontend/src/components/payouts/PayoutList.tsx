import React from 'react';
import { Payout, PayoutStatus } from '../../types';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import {
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
  Zap,
  Calendar
} from 'lucide-react';

interface PayoutListProps {
  payouts: Payout[];
  isLoading?: boolean;
  onPayoutClick?: (payout: Payout) => void;
}

const getStatusInfo = (status: PayoutStatus) => {
  switch (status) {
    case 'PROPOSED':
      return {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-100',
        label: 'Proposed',
        description: 'Waiting for consent period to begin'
      };
    case 'CONSENT_PENDING':
      return {
        icon: AlertCircle,
        color: 'text-blue-600 bg-blue-100',
        label: 'Pending Approval',
        description: 'Collecting member consent'
      };
    case 'READY':
      return {
        icon: PlayCircle,
        color: 'text-green-600 bg-green-100',
        label: 'Ready',
        description: 'Approved and ready for execution'
      };
    case 'EXECUTING':
      return {
        icon: Zap,
        color: 'text-purple-600 bg-purple-100',
        label: 'Executing',
        description: 'Processing payment'
      };
    case 'SETTLED':
      return {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100',
        label: 'Completed',
        description: 'Payment successfully processed'
      };
    case 'FAILED':
      return {
        icon: XCircle,
        color: 'text-red-600 bg-red-100',
        label: 'Failed',
        description: 'Payment processing failed'
      };
    default:
      return {
        icon: Clock,
        color: 'text-gray-600 bg-gray-100',
        label: status,
        description: 'Unknown status'
      };
  }
};

const PayoutList: React.FC<PayoutListProps> = ({
  payouts,
  isLoading = false,
  onPayoutClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No payouts yet</p>
        <p className="text-xs text-gray-400 mt-1">Create your first payout to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payouts.map((payout) => {
        const statusInfo = getStatusInfo(payout.status);
        const StatusIcon = statusInfo.icon;
        const isDeadlineApproaching = payout.status === 'CONSENT_PENDING' &&
          new Date(payout.consent_deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

        return (
          <div
            key={payout.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPayoutClick?.(payout)}
          >
            {/* Header with amount and status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-semibold text-gray-900 text-lg">
                    {formatCurrency(payout.amount_minor, payout.currency)}
                  </span>
                  <p className="text-sm text-gray-600">to {payout.payee_name}</p>
                </div>
              </div>

              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {payout.description}
            </p>

            {/* Timeline info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Created {formatRelativeTime(payout.created_at)}</span>
                </div>

                {payout.status === 'CONSENT_PENDING' && (
                  <div className={`flex items-center space-x-1 ${isDeadlineApproaching ? 'text-red-600' : ''}`}>
                    <Calendar className="h-3 w-3" />
                    <span>
                      Deadline {formatDateTime(payout.consent_deadline)}
                    </span>
                  </div>
                )}

                {payout.executed_at && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Executed {formatRelativeTime(payout.executed_at)}</span>
                  </div>
                )}
              </div>

              {isDeadlineApproaching && (
                <div className="flex items-center space-x-1 text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Urgent</span>
                </div>
              )}
            </div>

            {/* Progress bar for consent pending */}
            {payout.status === 'CONSENT_PENDING' && (
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: '0%' }} // Will be updated with actual consent data
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PayoutList;