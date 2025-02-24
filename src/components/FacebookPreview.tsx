import React from 'react';
import { Facebook, Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { FacebookPage } from '../types';

interface FacebookPreviewProps {
  content: string;
  firstComment?: string;
  imageUrl?: string;
  imageFile?: File;
  scheduledFor: string;
  selectedPages: FacebookPage[];
}

export function FacebookPreview({
  content,
  firstComment,
  imageUrl,
  imageFile,
  scheduledFor,
  selectedPages
}: FacebookPreviewProps) {
  const previewImageUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;
  const activePage = selectedPages[0];

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Facebook className="h-4 w-4 text-[#1877F2] mr-2" />
          Facebook Post Preview
        </h3>
      </div>

      <div className="p-4">
        <div className="max-w-[500px] mx-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          {/* Post Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {activePage?.picture?.data?.url ? (
                  <img
                    src={activePage.picture.data.url}
                    alt={activePage.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Facebook className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-[15px] text-gray-900">
                    {activePage?.name || 'Facebook Page'}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <span>{format(new Date(scheduledFor), 'MMM d')}</span>
                    <span className="mx-1">·</span>
                    <Globe className="h-3 w-3" />
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3">
            <p className="text-[15px] text-gray-900 whitespace-pre-wrap">{content}</p>
          </div>

          {/* Post Image */}
          {previewImageUrl && (
            <div className="relative border-y border-gray-100">
              <img
                src={previewImageUrl}
                alt="Post preview"
                className="w-full object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Post Stats */}
          <div className="px-4 py-2 flex items-center justify-between text-gray-500 text-sm border-b border-gray-100">
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <ThumbsUp className="h-3 w-3 text-white" />
              </div>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>0 comments</span>
              <span>0 shares</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-1">
            <div className="flex items-center justify-between border-b border-gray-100 py-1">
              <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 text-gray-600 flex-1">
                <ThumbsUp className="h-5 w-5" />
                <span className="text-sm font-medium">Like</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 text-gray-600 flex-1">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Comment</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 text-gray-600 flex-1">
                <Share className="h-5 w-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>

          {/* First Comment */}
          {firstComment && (
            <div className="px-4 py-3">
              <div className="flex items-start space-x-2">
                {activePage?.picture?.data?.url ? (
                  <img
                    src={activePage.picture.data.url}
                    alt={activePage.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Facebook className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2">
                    <p className="font-semibold text-[13px] text-gray-900">
                      {activePage?.name || 'Facebook Page'}
                    </p>
                    <p className="text-[13px] text-gray-700">{firstComment}</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                    <button className="font-semibold hover:underline">Like</button>
                    <button className="font-semibold hover:underline">Reply</button>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Info */}
          <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 flex items-center justify-center border-t">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled for {format(new Date(scheduledFor), 'PPp')}
          </div>
        </div>

        {/* Multiple Pages Indicator */}
        {selectedPages.length > 1 && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex -space-x-2 mr-2">
              {selectedPages.slice(1, 4).map(page => (
                <img
                  key={page.id}
                  src={page.picture?.data?.url}
                  alt={page.name}
                  className="w-6 h-6 rounded-full border-2 border-white"
                  title={page.name}
                />
              ))}
              {selectedPages.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{selectedPages.length - 4}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              This post will also be published to {selectedPages.length - 1} other page{selectedPages.length > 2 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}