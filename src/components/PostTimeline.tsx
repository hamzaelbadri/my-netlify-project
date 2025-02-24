import React, { useState, useMemo } from 'react';
import { Calendar, BarChart2, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Post, FacebookPage } from '../types';
import { Button } from './Button';

interface PostTimelineProps {
  posts: Post[];
  pages: FacebookPage[];
}

export function PostTimeline({ posts, pages }: PostTimelineProps) {
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), "yyyy-MM-dd"),
    end: format(endOfDay(new Date()), "yyyy-MM-dd"),
  });

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      const isInDateRange = isWithinInterval(postDate, {
        start: startOfDay(new Date(dateRange.start)),
        end: endOfDay(new Date(dateRange.end))
      });

      const isForSelectedPage = selectedPage === 'all' || 
        post.selectedPages.some(page => page.id === selectedPage);

      return isInDateRange && isForSelectedPage;
    });
  }, [posts, selectedPage, dateRange]);

  const postsByDate = useMemo(() => {
    const grouped = filteredPosts.reduce((acc, post) => {
      const date = format(new Date(post.scheduledFor), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(post);
      return acc;
    }, {} as Record<string, Post[]>);

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, posts]) => ({
        date,
        count: posts.length,
        posts
      }));
  }, [filteredPosts]);

  const maxPostCount = Math.max(...postsByDate.map(day => day.count), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          Post Timeline
        </h2>
        <div className="flex space-x-4">
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

      <div className="space-y-4">
        {postsByDate.length > 0 ? (
          postsByDate.map(({ date, count, posts }) => (
            <div key={date} className="relative">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-gray-600 w-24">
                  {format(new Date(date), 'MMM dd, yyyy')}
                </span>
                <div className="flex-1 ml-4">
                  <div className="h-8 flex items-center">
                    <div
                      className="bg-blue-100 rounded-r-lg h-6"
                      style={{ width: `${(count / maxPostCount) * 100}%` }}
                    >
                      <div className="h-full bg-blue-500 bg-opacity-20 rounded-r-lg" />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {count} {count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-28 space-y-1">
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="text-sm text-gray-600 flex items-center"
                  >
                    <span className="text-gray-400">
                      {format(new Date(post.scheduledFor), 'HH:mm')}
                    </span>
                    <span className="mx-2">·</span>
                    <span className="truncate flex-1">{post.content}</span>
                    <div className="flex space-x-1">
                      {post.selectedPages.map(page => (
                        <span
                          key={page.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {page.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No posts found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters to see more posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}