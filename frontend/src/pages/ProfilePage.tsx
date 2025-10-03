import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Lock, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { state } = useApp();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement profile update API call
      // await usersApi.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement password change API call
      // await usersApi.changePassword(passwordData);
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </h2>
          {!isEditing && (
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: state.user?.name || '',
                    email: state.user?.email || '',
                  });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-gray-900">{state.user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <p className="text-gray-900">{state.user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
            placeholder="Enter current password"
            required
          />

          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            placeholder="Enter new password (min 6 characters)"
            required
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
            placeholder="Confirm new password"
            required
          />

          <Button type="submit" loading={loading}>
            <Lock className="h-4 w-4 mr-2" />
            Update Password
          </Button>
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Account Information
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <label className="font-medium text-gray-600">Account ID</label>
            <p className="text-gray-900 font-mono text-xs break-all">{state.user?.id}</p>
          </div>
          <div>
            <label className="font-medium text-gray-600">Member Since</label>
            <p className="text-gray-900">
              {state.user?.created_at
                ? new Date(state.user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
