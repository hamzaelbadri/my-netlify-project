import React, { useState, useEffect, useRef } from 'react';
import { Users2, Search, Check, AlertCircle } from 'lucide-react';
import { FacebookPage } from '../types';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface PageSelectorProps {
  pages: FacebookPage[];
  selectedPages: FacebookPage[];
  onPagesChange: (pages: FacebookPage[]) => void;
  isLoading?: boolean;
  error?: string;
}

export function PageSelector({
  pages,
  selectedPages,
  onPagesChange,
  isLoading = false,
  error = ''
}: PageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const togglePage = (page: FacebookPage) => {
    const isSelected = selectedPages.some(p => p.id === page.id);
    if (isSelected) {
      onPagesChange(selectedPages.filter(p => p.id !== page.id));
    } else {
      onPagesChange([...selectedPages, page]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, page: FacebookPage) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePage(page);
    }
  };

  const selectAll = () => {
    onPagesChange([...pages]);
  };

  const deselectAll = () => {
    onPagesChange([]);
  };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getButtonText = () => {
    if (selectedPages.length === 0) return 'Select Pages';
    if (selectedPages.length === pages.length) return 'All Pages';
    return `${selectedPages.length} ${selectedPages.length === 1 ? 'Page' : 'Pages'}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="page-selector-dropdown"
      >
        <div className="flex items-center">
          <Users2 className="h-4 w-4 mr-2" />
          <span className="truncate">{getButtonText()}</span>
        </div>
        <div className="flex -space-x-1">
          {selectedPages.slice(0, 3).map(page => (
            <img
              key={page.id}
              src={page.picture?.data?.url}
              alt=""
              className="w-6 h-6 rounded-full border-2 border-white"
            />
          ))}
          {selectedPages.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{selectedPages.length - 3}
            </div>
          )}
        </div>
      </Button>

      {isOpen && (
        <div
          id="page-selector-dropdown"
          className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          role="listbox"
          tabIndex={-1}
        >
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                aria-label="Search pages"
              />
            </div>
          </div>

          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={deselectAll}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                <span className="ml-2">Loading pages...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-4 text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-gray-500">
                <Users2 className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">No pages found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              filteredPages.map((page) => {
                const isSelected = selectedPages.some(p => p.id === page.id);
                return (
                  <div
                    key={page.id}
                    onClick={() => togglePage(page)}
                    onKeyDown={(e) => handleKeyDown(e, page)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={cn(
                      "flex items-center space-x-3 p-2 cursor-pointer transition-colors",
                      "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                      isSelected && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <div className="flex-shrink-0 w-4">
                      {isSelected ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <div className="h-4 w-4 rounded border border-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 min-w-0">
                      {page.picture?.data?.url && (
                        <img
                          src={page.picture.data.url}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {page.name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}