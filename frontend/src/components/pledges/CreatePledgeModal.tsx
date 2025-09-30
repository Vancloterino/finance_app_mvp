import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PledgeCreate } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CreatePledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pledgeData: PledgeCreate) => Promise<void>;
  spaceId: string;
  currency: string;
}

const CreatePledgeModal: React.FC<CreatePledgeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  spaceId,
  currency
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFormData({
      amount: '',
      description: '',
      dueDate: ''
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
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
      const pledgeData: PledgeCreate = {
        space_id: spaceId,
        amount_minor: Math.round(parseFloat(formData.amount) * 100),
        currency,
        description: formData.description.trim(),
        due_date: formData.dueDate || undefined
      };

      await onSubmit(pledgeData);
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create pledge' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewAmount = formData.amount ?
    formatCurrency(Math.round(parseFloat(formData.amount || '0') * 100), currency) :
    formatCurrency(0, currency);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Pledge">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="What is this pledge for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date (Optional)
          </label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            error={errors.dueDate}
            disabled={isSubmitting}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

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
            Create Pledge
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePledgeModal;