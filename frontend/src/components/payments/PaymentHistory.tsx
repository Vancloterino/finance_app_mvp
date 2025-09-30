import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Download,
  Filter
} from 'lucide-react';
import Button from '../ui/Button';

interface PaymentTransaction {
  id: string;
  type: 'payment' | 'refund';
  amount: number;
  currency: string;
  description: string;
  payout_id?: string;
  space_name: string;
  status: 'succeeded' | 'pending' | 'failed';
  created_at: string;
  receipt_url?: string;
}

interface PaymentHistoryProps {
  spaceId?: string; // Optional filter by space
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ spaceId }) => {
  const [transactions] = useState<PaymentTransaction[]>([]); // Placeholder for now
  const [isLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'payments' | 'refunds'>('all');

  // Mock data for demonstration (would come from API)
  const mockTransactions: PaymentTransaction[] = [
    {
      id: 'txn_1',
      type: 'payment',
      amount: 2500, // $25.00
      currency: 'usd',
      description: 'Monthly rent payment',
      payout_id: 'po_123',
      space_name: 'Apartment 4B',
      status: 'succeeded',
      created_at: '2024-01-15T10:30:00Z',
      receipt_url: 'https://stripe.com/receipt/123'
    },
    {
      id: 'txn_2',
      type: 'payment',
      amount: 1250, // $12.50
      currency: 'usd',
      description: 'Utilities split',
      payout_id: 'po_124',
      space_name: 'Apartment 4B',
      status: 'succeeded',
      created_at: '2024-01-10T14:20:00Z',
      receipt_url: 'https://stripe.com/receipt/124'
    }
  ];

  const filteredTransactions = mockTransactions.filter(txn => {
    if (filter === 'all') return true;
    if (filter === 'payments') return txn.type === 'payment';
    if (filter === 'refunds') return txn.type === 'refund';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'payment' ? (
      <ArrowUpRight className="h-5 w-5 text-red-600" />
    ) : (
      <ArrowDownLeft className="h-5 w-5 text-green-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
          >
            <option value="all">All Transactions</option>
            <option value="payments">Payments Only</option>
            <option value="refunds">Refunds Only</option>
          </select>
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
          <p className="text-gray-600">
            {spaceId
              ? 'No payments have been processed for this space yet.'
              : 'You haven\'t made any payments yet. Join a space and participate in shared expenses to see transactions here.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {transaction.space_name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(transaction.created_at)}</span>
                      </div>
                      {transaction.payout_id && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Payout #{transaction.payout_id.slice(-6)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'payment' ? '-' : '+'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  {transaction.receipt_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-xs"
                      onClick={() => window.open(transaction.receipt_url, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;