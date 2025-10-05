import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApp } from '../../context/AppContext';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { SpaceWithMembers, BalanceSummary } from '../../types';
import { usersApi, pledgesApi } from '../../api/services';

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: SpaceWithMembers[];
}

const TransferDialog: React.FC<TransferDialogProps> = ({ isOpen, onClose, spaces }) => {
  const { state } = useApp();
  const [fromSpaceId, setFromSpaceId] = useState('');
  const [toSpaceId, setToSpaceId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balances, setBalances] = useState<{ [key: string]: BalanceSummary }>({});

  // Load balances for all spaces when dialog opens
  useEffect(() => {
    if (isOpen && state.user) {
      const loadBalances = async () => {
        const balancePromises = spaces.map(async (space) => {
          try {
            const balance = await usersApi.getUserBalance(state.user!.id, space.id);
            return { spaceId: space.id, balance };
          } catch (err) {
            return { spaceId: space.id, balance: null };
          }
        });

        const results = await Promise.all(balancePromises);
        const balanceMap: { [key: string]: BalanceSummary } = {};
        results.forEach(({ spaceId, balance }) => {
          if (balance) balanceMap[spaceId] = balance;
        });
        setBalances(balanceMap);
      };

      loadBalances();
    }
  }, [isOpen, spaces, state.user]);

  const fromSpace = spaces.find((s) => s.id === fromSpaceId);
  const toSpace = spaces.find((s) => s.id === toSpaceId);
  const fromBalance = fromSpaceId ? balances[fromSpaceId] : null;
  const toBalance = toSpaceId ? balances[toSpaceId] : null;

  const handleTransfer = async () => {
    if (!fromSpace || !toSpace || !amount || !state.user) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if user has sufficient balance in from space
    if (fromBalance && fromBalance.net_balance < amountNum) {
      setError(`Insufficient balance in ${fromSpace.name}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a pledge in the destination space (credit)
      await pledgesApi.createPledge({
        space_id: toSpaceId,
        amount_minor: Math.round(amountNum * 100),
        currency: toSpace.currency,
        description: description || `Transfer from ${fromSpace.name}`,
      });

      // Create a negative pledge in the source space (debit)
      await pledgesApi.createPledge({
        space_id: fromSpaceId,
        amount_minor: Math.round(amountNum * -100),
        currency: fromSpace.currency,
        description: description || `Transfer to ${toSpace.name}`,
      });

      // Reset form
      setFromSpaceId('');
      setToSpaceId('');
      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer funds');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (amount === undefined) return '...';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const canTransfer = fromSpaceId && toSpaceId && amount && fromSpaceId !== toSpaceId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Transfer Between Spaces">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Space
          </label>
          <select
            value={fromSpaceId}
            onChange={(e) => setFromSpaceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0070BA]"
          >
            <option value="">Select source space</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} ({space.currency})
              </option>
            ))}
          </select>
          {fromBalance && (
            <p className="mt-1 text-sm text-gray-500">
              Available: {formatCurrency(fromBalance.net_balance, fromSpace?.currency || 'USD')}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-full p-3">
            <ArrowRightLeft className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Space
          </label>
          <select
            value={toSpaceId}
            onChange={(e) => setToSpaceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0070BA]"
          >
            <option value="">Select destination space</option>
            {spaces
              .filter((s) => s.id !== fromSpaceId)
              .map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name} ({space.currency})
                </option>
              ))}
          </select>
          {toBalance && (
            <p className="mt-1 text-sm text-gray-500">
              Current balance: {formatCurrency(toBalance.net_balance, toSpace?.currency || 'USD')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this transfer for?"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            fullWidth
            loading={loading}
            disabled={!canTransfer || loading}
          >
            Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransferDialog;
