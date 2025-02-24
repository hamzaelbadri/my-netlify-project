import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Eye, Share2, ThumbsUp, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { FacebookPage } from '../types';
import { Button } from './Button';
import { tokenManager } from '../lib/token-manager';
import { createGraphApiUrl } from '../lib/facebook-config';

interface PageInsightsProps {
  page: FacebookPage;
}

interface InsightMetrics {
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
  loading: boolean;
  error?: string;
  lastUpdated?: string;
}

export function PageInsights({ page }: PageInsightsProps) {
  const [metrics, setMetrics] = useState<InsightMetrics>({
    followers: 0,
    reach: 0,
    engagement: 0,
    posts: 0,
    loading: true
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      const token = await tokenManager.getValidToken(page.id);
      const url = createGraphApiUrl(`${page.id}/insights`, {
        metric: [
          'page_fans',
          'page_impressions',
          'page_engaged_users',
          'page_posts_impressions'
        ].join(','),
        period: 'day'
      }, token);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch page insights');
      }

      const data = await response.json();
      const insights = data.data || [];

      setMetrics({
        followers: insights.find((i: any) => i.name === 'page_fans')?.values[0]?.value || 0,
        reach: insights.find((i: any) => i.name === 'page_impressions')?.values[0]?.value || 0,
        engagement: insights.find((i: any) => i.name === 'page_engaged_users')?.values[0]?.value || 0,
        posts: insights.find((i: any) => i.name === 'page_posts_impressions')?.values[0]?.value || 0,
        loading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights'
      }));
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [page.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInsights();
    setIsRefreshing(false);
  };

  if (metrics.loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto" />
        <p className="text-gray-600 mt-4">Loading page insights...</p>
      </div>
    );
  }

  if (metrics.error) {
    return (
      <div className="bg-red-50 rounded-lg p-6">
        <div className="flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-red-800 text-center">{metrics.error}</p>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          className="mt-4 mx-auto"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {page.picture?.data?.url ? (
              <img
                src={page.picture.data.url}
                alt={page.name}
                className="w-10 h-10 rounded-lg mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 mr-3" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{page.name}</h3>
              <p className="text-sm text-gray-500">Last 24 hours</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center text-blue-600 mb-2">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Followers</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {metrics.followers.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center text-green-600 mb-2">
              <Eye className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Reach</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {metrics.reach.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center text-purple-600 mb-2">
              <ThumbsUp className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {metrics.engagement.toLocaleString()}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center text-orange-600 mb-2">
              <Share2 className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Post Reach</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {metrics.posts.toLocaleString()}
            </div>
          </div>
        </div>

        {metrics.lastUpdated && (
          <div className="mt-6 text-sm text-gray-500 flex items-center justify-end">
            <RefreshCw className="h-4 w-4 mr-1" />
            Last updated: {format(new Date(metrics.lastUpdated), 'PPp')}
          </div>
        )}
      </div>
    </div>
  );
}