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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Spaces</h1>
            <p className="text-gray-600">Manage shared expenses across different groups</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Space
          </Button>
        </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
          <div className="mx-auto w-24 h-24 bg-[#E8F4FD] rounded-full flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-[#0070BA]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No spaces yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first space to start managing shared expenses with transparency and ease
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Space
          </Button>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No spaces found</h3>
          <p className="text-gray-600 mb-8">
            Try adjusting your search or create a new space
          </p>
          <Button onClick={() => setSearchQuery('')} variant="secondary">Clear Search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 hover:border-[#0070BA] group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0070BA] transition-colors">{space.name}</h3>
                <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <Users className="h-4 w-4 mr-1" />
                  {space.member_count}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {space.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="font-medium">{space.currency}</span>
                </div>

                {space.user_allocation && (
                  <div className="text-sm text-[#0070BA] font-semibold bg-[#E8F4FD] px-3 py-1 rounded-full">
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