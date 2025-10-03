import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import CreateSpaceModal from '../components/spaces/CreateSpaceModal';
import { Plus, Users, DollarSign } from 'lucide-react';

const SpacesPage: React.FC = () => {
  const { state } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter spaces based on search query
  const filteredSpaces = useMemo(() => {
    if (!searchQuery.trim()) return state.spaces;

    const query = searchQuery.toLowerCase();
    return state.spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(query) ||
        space.description.toLowerCase().includes(query) ||
        space.currency.toLowerCase().includes(query)
    );
  }, [state.spaces, searchQuery]);

  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Spaces</h1>
          <p className="text-gray-600">Manage shared expenses across different groups</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Space
        </Button>
      </div>

      {state.spaces.length > 0 && (
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search spaces by name, description, or currency..."
            className="max-w-md"
          />
        </div>
      )}

      {state.spaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first space to start managing shared expenses
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Space
          </Button>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or create a new space
          </p>
          <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {space.member_count}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {space.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {space.currency}
                </div>

                {space.user_allocation && (
                  <div className="text-sm text-blue-600 font-medium">
                    {(space.user_allocation * 100).toFixed(1)}% share
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Space Modal */}
      <CreateSpaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default SpacesPage;