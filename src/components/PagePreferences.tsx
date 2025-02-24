import React, { useState, useEffect } from 'react';
import { Users2, Save, Info } from 'lucide-react';
import { FacebookPage } from '../types';
import { Button } from './Button';
import { usePostStore } from '../store';

interface PagePreferencesProps {
  onClose?: () => void;
}

export function PagePreferences({ onClose }: PagePreferencesProps) {
  const { pages, savedPagePreferences, updatePagePreferences } = usePostStore();
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>(savedPagePreferences || []);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const togglePage = (page: FacebookPage) => {
    setSelectedPages(prev => {
      const isSelected = prev.some(p => p.id === page.id);
      if (isSelected) {
        return prev.filter(p => p.id !== page.id);
      }
      return [...prev, page];
    });
  };

  const handleSelectAll = () => {
    setSelectedPages([...pages]);
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  const handleSave = () => {
    updatePagePreferences(selectedPages);
    setShowSuccess(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Users2 className="h-5 w-5 mr-2 text-blue-600" />
            Page Preferences
          </h2>
          {showSuccess && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <span className="mr-2">✓</span>
              Preferences saved successfully
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Select the pages you want to manage and publish content to.
        </p>
      </div>

      <div className="p-6">
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            {selectedPages.length} of {pages.length} pages selected
          </div>
        </div>

        <div className="border rounded-lg divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
          {pages.map(page => (
            <div
              key={page.id}
              className="flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedPages.some(p => p.id === page.id)}
                  onChange={() => togglePage(page)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                {page.picture?.data?.url && (
                  <img
                    src={page.picture.data.url}
                    alt={page.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{page.name}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Info className="h-4 w-4 mr-1" />
                    Page ID: {page.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-8">
            <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No pages available</p>
            <p className="text-gray-400 text-sm mt-1">
              You don't have any Facebook pages to manage
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}