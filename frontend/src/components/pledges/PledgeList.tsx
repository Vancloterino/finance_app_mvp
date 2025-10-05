import React from 'react';
import { Pledge } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Calendar, DollarSign, User } from 'lucide-react';

interface PledgeListProps {
  pledges: Pledge[];
  isLoading?: boolean;
  onPledgeClick?: (pledge: Pledge) => void;
}

const PledgeList: React.FC<PledgeListProps> = ({
  pledges,
  isLoading = false,
  onPledgeClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20" />
        ))}
      </div>
    );
  }

  if (pledges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No pledges yet</p>
        <p className="text-xs text-gray-400 mt-1">Create your first pledge to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pledges.map((pledge) => (
        <div
          key={pledge.id}
          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onPledgeClick?.(pledge)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-gray-900">
                {formatCurrency(pledge.amount_minor, pledge.currency)}
              </span>
            </div>
            {pledge.due_date && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Due {formatDate(pledge.due_date)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
            {pledge.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{pledge.user?.name || `User ${pledge.user_id.slice(0, 8)}...`}</span>
            </div>
            <span>Created {formatDate(pledge.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PledgeList;