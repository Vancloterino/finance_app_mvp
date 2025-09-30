import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PayoutCreate } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { AlertTriangle, Info } from 'lucide-react';

interface CreatePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payoutData: PayoutCreate) => Promise<void>;
  spaceId: string;
  currency: string;
  isAdmin?: boolean;
}

const CreatePayoutModal: React.FC<CreatePayoutModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  spaceId,
  currency,
  isAdmin = false
}) => {
  const [formData, setFormData] = useState({
    payeeName: '',
    amount: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFormData({
      payeeName: '',
      amount: '',
      description: ''
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.payeeName.trim()) {
      newErrors.payeeName = 'Payee name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Check for reasonable amount limits
    const amount = parseFloat(formData.amount || '0');
    if (amount > 100000) {
      newErrors.amount = 'Amount seems unusually large. Please verify.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payoutData: PayoutCreate = {
        space_id: spaceId,
        payee_name: formData.payeeName.trim(),
        amount_minor: Math.round(parseFloat(formData.amount) * 100),
        currency,
        description: formData.description.trim()
      };

      await onSubmit(payoutData);
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create payout' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewAmount = formData.amount ?
    formatCurrency(Math.round(parseFloat(formData.amount || '0') * 100), currency) :
    formatCurrency(0, currency);

  if (!isAdmin) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create Payout">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
          <p className="text-gray-600 mb-4">
            Only space administrators can create payouts. This ensures proper oversight of group funds.
          </p>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Payout">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Democratic Approval Process</p>
              <p>
                This payout will require approval from at least 75% of space members by allocation percentage.
                Members will have 48 hours to submit their consent.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="payeeName" className="block text-sm font-medium text-gray-700 mb-1">
            Payee Name
          </label>
          <Input
            id="payeeName"
            type="text"
            placeholder="Who should receive this payment?"
            value={formData.payeeName}
            onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
            error={errors.payeeName}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ({currency.toUpperCase()})
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            disabled={isSubmitting}
          />
          {formData.amount && (
            <p className="mt-1 text-sm text-gray-600">
              Preview: {previewAmount}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="What is this payout for? (e.g., Rent payment, Utility bill, Shared groceries)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Preview summary */}
        {formData.payeeName && formData.amount && formData.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Payout Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">To:</span> {formData.payeeName}</p>
              <p><span className="font-medium">Amount:</span> {previewAmount}</p>
              <p><span className="font-medium">For:</span> {formData.description}</p>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Create Payout
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePayoutModal;