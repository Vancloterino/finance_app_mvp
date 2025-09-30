import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Pledge, PledgeUpdate } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Calendar, DollarSign, User, Edit2, Trash2 } from 'lucide-react';

interface PledgeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pledge: Pledge | null;
  onUpdate: (pledgeId: string, updateData: PledgeUpdate) => Promise<void>;
  onDelete: (pledgeId: string) => Promise<void>;
  currentUserId?: string;
}

const PledgeDetailModal: React.FC<PledgeDetailModalProps> = ({
  isOpen,
  onClose,
  pledge,
  onUpdate,
  onDelete,
  currentUserId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (pledge && isEditing) {
      setFormData({
        amount: (pledge.amount_minor / 100).toString(),
        description: pledge.description,
        dueDate: pledge.due_date ? pledge.due_date.split('T')[0] : ''
      });
    }
  }, [pledge, isEditing]);

  const handleClose = () => {
    setIsEditing(false);
    setIsDeleting(false);
    setIsSaving(false);
    setErrors({});
    onClose();
  };

  const canEdit = pledge && currentUserId && pledge.user_id === currentUserId;

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

  const handleSave = async () => {
    if (!pledge || !validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const updateData: PledgeUpdate = {
        amount_minor: Math.round(parseFloat(formData.amount) * 100),
        description: formData.description.trim(),
        due_date: formData.dueDate || undefined
      };

      await onUpdate(pledge.id, updateData);
      setIsEditing(false);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update pledge' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pledge) return;

    setIsDeleting(true);

    try {
      await onDelete(pledge.id);
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to delete pledge' });
      setIsDeleting(false);
    }
  };

  if (!pledge) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Pledge' : 'Pledge Details'}
    >
      <div className="space-y-6">
        {/* Amount */}
        <div className="flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({pledge.currency.toUpperCase()})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  error={errors.amount}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(pledge.amount_minor, pledge.currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          {isEditing ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSaving}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-900">{pledge.description}</p>
            </div>
          )}
        </div>

        {/* Due Date */}
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  error={errors.dueDate}
                  disabled={isSaving}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="text-gray-900">
                  {pledge.due_date ? formatDateTime(pledge.due_date) : 'No due date'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Created By */}
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-500">Created by</p>
            <p className="text-gray-900">User {pledge.user_id.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="text-gray-900">{formatDateTime(pledge.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(pledge.updated_at)}</p>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            {canEdit && !isEditing && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  loading={isDeleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PledgeDetailModal;