import React, { useState, useEffect } from 'react';
import { Facebook, X, Plus, AlertCircle, Search, Check, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { usePostStore } from '../store';
import { FacebookPage } from '../types';
import { facebookAuth } from '../lib/facebook';

interface AddPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPageDialog({ isOpen, onClose }: AddPageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const { pages, addPages, removePages } = usePostStore();

  // Load available pages when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailablePages();
    }
  }, [isOpen]);

  const loadAvailablePages = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const fetchedPages = await facebookAuth.getPages();
      setAvailablePages(fetchedPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPage = async (page: FacebookPage) => {
    try {
      await addPages([page]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add page');
    }
  };

  const handleRemovePage = async (page: FacebookPage) => {
    try {
      await removePages([page.id]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove page');
    }
  };

  const filteredPages = availablePages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Facebook className="h-5 w-5 mr-2 text-[#1877F2]" />
            Manage Facebook Pages
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Pages List */}
          <div className="border rounded-lg divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto" />
                <p className="mt-2 text-gray-600">Loading pages...</p>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="p-8 text-center">
                <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pages found</p>
              </div>
            ) : (
              filteredPages.map(page => {
                const isConnected = pages.some(p => p.id === page.id);
                return (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {page.picture?.data?.url ? (
                        <img
                          src={page.picture.data.url}
                          alt={page.name}
                          className="w-12 h-12 rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Facebook className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{page.name}</h3>
                        <p className="text-sm text-gray-500">ID: {page.id}</p>
                      </div>
                    </div>
                    <Button
                      variant={isConnected ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => isConnected ? handleRemovePage(page) : handleAddPage(page)}
                      className="flex items-center"
                    >
                      {isConnected ? (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Page
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Add or remove Facebook pages that you want to manage. You must have admin access to the pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}