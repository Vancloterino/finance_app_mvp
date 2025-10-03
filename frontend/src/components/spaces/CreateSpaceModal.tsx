import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { spacesApi } from '../../api/services';
import { SpaceCreate } from '../../types';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose }) => {
  const { addSpace } = useApp();
  const toast = useToast();
  const [formData, setFormData] = useState<SpaceCreate>({
    name: '',
    description: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState<Partial<SpaceCreate>>({});
  const [loading, setLoading] = useState(false);

  const currencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' },
    { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof SpaceCreate]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SpaceCreate> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Space name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Space name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const space = await spacesApi.createSpace({
        name: formData.name.trim(),
        description: formData.description.trim(),
        currency: formData.currency
      });

      // Add to app state (will need to refetch to get members info)
      addSpace({
        ...space,
        members: [],
        member_count: 1,
        user_allocation: 1.0
      });

      toast.success(`Space "${space.name}" created successfully!`);

      // Reset form and close modal
      setFormData({ name: '', description: '', currency: 'USD' });
      setErrors({});
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create space';
      setErrors({ name: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '', currency: 'USD' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Space"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Space Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Apartment 2B, Weekend Getaway"
          fullWidth
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.description
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Describe what this space is for..."
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.currency
                ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            required
          >
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What's a Space?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A shared expense group for roommates, friends, or family</li>
            <li>• Track who owes what with our virtual ledger system</li>
            <li>• Approve payouts democratically with group consent</li>
            <li>• No money held in escrow - payments only when approved</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.name || !formData.description || !formData.currency}
          >
            Create Space
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSpaceModal;