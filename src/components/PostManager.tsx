import React, { useState } from 'react';
import { usePostStore } from '../store';
import { Dashboard } from './Dashboard';
import { CreatePostDialog } from './CreatePostDialog';
import { PageInsights } from './PageInsights';
import { Button } from './Button';
import { PlusCircle, LayoutDashboard, BarChart2 } from 'lucide-react';

export function PostManager() {
  const { posts, pages } = usePostStore();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights'>('dashboard');
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'insights'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Insights
          </button>
        </div>

        <Button onClick={() => setIsCreatePostOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {activeTab === 'dashboard' ? (
        <Dashboard posts={posts} pages={pages} />
      ) : (
        <div className="space-y-6">
          {/* Page Selector */}
          <div className="bg-white rounded-lg shadow p-4">
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {pages.map(page => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          {/* Page Insights */}
          {selectedPage && (
            <PageInsights
              page={pages.find(p => p.id === selectedPage)!}
            />
          )}
        </div>
      )}

      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </main>
  );
}