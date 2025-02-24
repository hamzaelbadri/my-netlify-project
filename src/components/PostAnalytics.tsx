import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, MessageCircle, Share2, ThumbsUp, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Post } from '../types';
import { Button } from './Button';
import { createGraphApiUrl } from '../lib/facebook-config';

interface PostAnalyticsProps {
  post: Post;
}

interface PostInsights {
  impressions: number;
  reach: number;
  engagement: number;
  reactions: number;
  comments: number;
  shares: number;
  loading: boolean;
  error?: string;
}

export function PostAnalytics({ post }: PostAnalyticsProps) {
  const [insights, setInsights] = useState<PostInsights>({
    impressions: 0,
    reach: 0,
    engagement: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    loading: true
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      setInsights(prev => ({ ...prev, loading: true, error: undefined }));

      // Fetch insights for each page the post was published to
      const allInsights = await Promise.all(
        post.selectedPages.map(async (page) => {
          const url = createGraphApiUrl(
            `${page.id}_${post.id}/insights`,
            {
              metric: [
                'post_impressions',
                'post_engaged_users',
                'post_reactions_by_type_total',
                'post_comments',
                'post_shares'
              ].join(',')
            },
            page.accessToken
          );

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch post insights');
          }

          return response.json();
        })
      );

      // Aggregate insights from all pages
      const aggregated = allInsights.reduce((acc, pageInsights) => {
        const data = pageInsights.data || [];
        data.forEach((metric: any) => {
          switch (metric.name) {
            case 'post_impressions':
              acc.impressions += metric.values[0].value;
              break;
            case 'post_engaged_users':
              acc.engagement += metric.values[0].value;
              break;
            case 'post_reactions_by_type_total':
              acc.reactions += Object.values(metric.values[0].value).reduce((sum: number, val: number) => sum + val, 0);
              break;
            case 'post_comments':
              acc.comments += metric.values[0].value;
              break;
            case 'post_shares':
              acc.shares += metric.values[0].value;
              break;
          }
        });
        return acc;
      }, {
        impressions: 0,
        reach: 0,
        engagement: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        loading: false
      });

      setInsights(aggregated);
    } catch (error) {
      setInsights(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights'
      }));
    }
  };

  useEffect(() => {
    if (post.status === 'published') {
      fetchInsights();
    }
  }, [post.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  if (post.status !== 'published') {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Analytics will be available after the post is published</p>
      </div>
    );
  }

  if (insights.loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto" />
        <p className="text-gray-600 mt-4">Loading insights...</p>
      </div>
    );
  }

  if (insights.error) {
    return (
      <div className="bg-red-50 rounded-lg p-6">
        <div className="flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-red-800 text-center">{insights.error}</p>
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
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
            Post Performance
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <TrendingUp className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Impressions</span>
            </div>
            <div className="text-2xl font-bold">{insights.impressions.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="text-2xl font-bold">{insights.engagement.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <ThumbsUp className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Reactions</span>
            </div>
            <div className="text-2xl font-bold">{insights.reactions.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <MessageCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Comments</span>
            </div>
            <div className="text-2xl font-bold">{insights.comments.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <Share2 className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Shares</span>
            </div>
            <div className="text-2xl font-bold">{insights.shares.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500 flex items-center justify-end">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: {format(new Date(), 'PPp')}
        </div>
      </div>
    </div>
  );
}