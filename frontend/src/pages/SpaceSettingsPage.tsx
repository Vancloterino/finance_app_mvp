import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { spacesApi } from '../api/services';
import { SpaceWithMembers } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { ArrowLeft, Settings, Users, Mail, AlertTriangle } from 'lucide-react';

const SpaceSettingsPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [space, setSpace] = useState<SpaceWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite functionality
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    const fetchSpace = async () => {
      try {
        setLoading(true);
        const spaceData = await spacesApi.getSpace(spaceId);
        setSpace(spaceData);
      } catch (err: any) {
        setError(err.message || 'Failed to load space');
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !spaceId) return;

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(null);

      const result = await spacesApi.inviteMember(spaceId, inviteEmail.trim());
      setInviteSuccess(result.message);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error || 'Space not found'}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/spaces')} variant="secondary" size="sm">
              Back to Spaces
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spaces/${spaceId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              {space.name} Settings
            </h1>
            <p className="text-gray-600">Manage space settings and members</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Space Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Space Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{space.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{space.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <p className="mt-1 text-sm text-gray-900">{space.currency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(space.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Invite Members */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Invite Members
          </h2>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteLoading}
              />
            </div>

            {inviteSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">{inviteSuccess}</p>
              </div>
            )}

            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{inviteError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              loading={inviteLoading}
              fullWidth
            >
              Send Invitation
            </Button>
          </form>
        </div>

        {/* Current Members */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Current Members ({space.members.length})
          </h2>
          <div className="space-y-3">
            {space.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">Member #{member.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">
                    Allocation: {(parseFloat(member.allocation_pct) * 100).toFixed(1)}% •
                    Role: {member.role} •
                    Joined: {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {member.role === 'admin' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceSettingsPage;