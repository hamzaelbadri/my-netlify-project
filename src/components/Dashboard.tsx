import React, { useState } from 'react';
import { BarChart2, Calendar, Clock, Upload, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Post, FacebookPage } from '../types';
import { Button } from './Button';
import { BulkUploadDialog } from './BulkUploadDialog';
import { CreatePostDialog } from './CreatePostDialog';

interface DashboardProps {
  posts: Post[];
  pages: FacebookPage[];
}

type SortField = 'date' | 'status' | 'pages';
type SortOrder = 'asc' | 'desc';

export function Dashboard({ posts, pages }: DashboardProps) {
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), "yyyy-MM-dd"),
    end: format(endOfDay(new Date()), "yyyy-MM-dd")
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isScheduleMode, setIsScheduleMode] = useState(false);

  const filteredPosts = posts.filter(post => {
    const postDate = new Date(post.scheduledFor);
    const isInDateRange = isAfter(postDate, new Date(dateRange.start)) &&
      isBefore(postDate, new Date(dateRange.end));
    const isForSelectedPage = selectedPage === 'all' ||
      post.selectedPages.some(page => page.id === selectedPage);
    return isInDateRange && isForSelectedPage;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'pages':
        comparison = a.selectedPages.length - b.selectedPages.length;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleScheduledClick = () => {
    setIsScheduleMode(true);
    setIsCreatePostOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
            Dashboard Overview
          </h2>
          <Button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">Total Posts</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Published</div>
            <div className="text-2xl font-bold mt-1">{stats.published}</div>
          </div>
          <div 
            className="bg-yellow-50 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={handleScheduledClick}
          >
            <div className="text-yellow-600 text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Scheduled
            </div>
            <div className="text-2xl font-bold mt-1">{stats.scheduled}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">Drafts</div>
            <div className="text-2xl font-bold mt-1">{stats.draft}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Pages</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th
                  className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    <span>Schedule Date</span>
                    {sortField === 'date' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th
                  className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('pages')}
                >
                  <div className="flex items-center">
                    <span>Pages</span>
                    {sortField === 'pages' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(post.scheduledFor), 'PPp')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{post.content}</div>
                    {post.firstComment && (
                      <div className="text-sm text-gray-500 mt-1">
                        First comment: {post.firstComment}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2">
                      {post.selectedPages.slice(0, 3).map(page => (
                        <img
                          key={page.id}
                          src={page.picture?.data?.url}
                          alt={page.name}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          title={page.name}
                        />
                      ))}
                      {post.selectedPages.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                          +{post.selectedPages.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedPosts.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No posts found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters or create new posts
              </p>
            </div>
          )}
        </div>
      </div>

      <BulkUploadDialog
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
      />

      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => {
          setIsCreatePostOpen(false);
          setIsScheduleMode(false);
        }}
        initialMode={isScheduleMode ? 'schedule' : 'post'}
      />
    </div>
  );
}