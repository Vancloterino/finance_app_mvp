import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { authApi } from '../api/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TimezoneSelector from '../components/ui/TimezoneSelector';
import { User, Mail, Lock, Save, Globe, HelpCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const { startTour } = useOnboarding();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    timezone: state.user?.timezone || null,
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
      const updatedUser = await authApi.updateCurrentUser({
        name: formData.name,
        timezone: formData.timezone
      });

      // Update user in global state
      dispatch({ type: 'SET_USER', payload: updatedUser });

      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });

      showToast('Password changed successfully!', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and account preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
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

            <TimezoneSelector
              label="Timezone"
              value={formData.timezone}
              onChange={(tz) => setFormData({ ...formData, timezone: tz })}
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
                    timezone: state.user?.timezone || null,
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
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Timezone
              </label>
              <p className="text-gray-900">{state.user?.timezone || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
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

      {/* Help & Onboarding */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="h-5 w-5 mr-2" />
          Help & Getting Started
        </h2>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            New to FinanceApp? Take a quick tour to learn how to manage shared finances.
          </p>
          <Button
            variant="secondary"
            onClick={startTour}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Start Onboarding Tour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
