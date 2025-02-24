import React, { useState } from 'react';
import { Facebook, Menu, Plus, Settings, LogOut } from 'lucide-react';
import { Button } from './Button';
import { usePostStore } from '../store';
import { AddPageDialog } from './AddPageDialog';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function Header({ isAuthenticated, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const { user } = usePostStore();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Facebook className="h-8 w-8 text-[#1877F2]" />
            <span className="ml-2 text-xl font-semibold">Post Manager</span>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setIsAddPageOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <div className="flex items-center space-x-3 ml-4">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
              <Button variant="secondary" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}

          <div className="md:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1 px-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setIsAddPageOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {user && (
                <div className="flex items-center space-x-3 px-3 py-2">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddPageDialog 
        isOpen={isAddPageOpen} 
        onClose={() => setIsAddPageOpen(false)} 
      />
    </header>
  );
}