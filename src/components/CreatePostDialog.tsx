import React, { useState } from 'react';
import { 
  Facebook,
  Globe,
  Image as ImageIcon,
  Calendar,
  X,
  Send,
  Clock,
  Users,
  FileImage,
  Link,
  AlertCircle,
  Smile,
  MapPin,
  Tag,
  MessageCircle,
  CalendarCheck,
  Eye
} from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { PageSelector } from './PageSelector';
import { FacebookPreview } from './FacebookPreview';
import { usePostStore } from '../store';
import { Notification } from './Notification';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'post' | 'schedule';
}

export function CreatePostDialog({ isOpen, onClose, initialMode = 'post' }: CreatePostDialogProps) {
  const { pages, addPost } = usePostStore();
  const [content, setContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File>();
  const [scheduledFor, setScheduledFor] = useState(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [selectedPages, setSelectedPages] = useState(pages);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [mode, setMode] = useState<'post' | 'schedule'>(initialMode);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const activePage = selectedPages[0];

  const validatePost = () => {
    if (!content.trim()) {
      throw new Error('Post content is required');
    }
    if (selectedPages.length === 0) {
      throw new Error('Please select at least one page');
    }
    if (mode === 'schedule') {
      const scheduleDate = new Date(scheduledFor);
      if (scheduleDate <= new Date()) {
        throw new Error('Schedule time must be in the future');
      }
      if (scheduleDate > addDays(new Date(), 30)) {
        throw new Error('Cannot schedule posts more than 30 days in advance');
      }
    }
  };

  const createPost = (status: 'scheduled' | 'published') => {
    return {
      id: crypto.randomUUID(),
      content: content.trim(),
      firstComment: firstComment.trim(),
      imageUrl,
      imageFile,
      scheduledFor: status === 'published' ? new Date().toISOString() : new Date(scheduledFor).toISOString(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedPages
    };
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    try {
      validatePost();
      const newPost = createPost('scheduled');
      await addPost(newPost);
      showNotification('success', 'Post scheduled successfully!');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule post';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostNow = async () => {
    setIsPublishing(true);
    setError(undefined);

    try {
      validatePost();
      const newPost = createPost('published');
      await addPost(newPost);
      showNotification('success', 'Post published successfully!');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish post';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex">
        {/* Main Form */}
        <div className="flex-1 min-w-0">
          <div className="relative border-b border-gray-200">
            <div className="px-4 py-3 text-center">
              <h2 className="text-xl font-semibold">Create Post</h2>
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-3 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSchedule} className="divide-y divide-gray-200">
            {/* Page Selector */}
            <div className="p-4">
              <div className="flex items-center space-x-2">
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
                <div className="flex-1">
                  <PageSelector
                    pages={pages}
                    selectedPages={selectedPages}
                    onPagesChange={setSelectedPages}
                  />
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Globe className="h-3 w-3 mr-1" />
                    <span>Public</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border-0 focus:ring-0 resize-none text-lg placeholder-gray-500"
                placeholder={`What's on your mind, ${activePage?.name || 'Page'}?`}
              />

              {/* Image Preview */}
              {(imageUrl || imageFile) && (
                <div className="relative mt-2 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                    alt="Post preview"
                    className="w-full object-cover max-h-[300px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFile(undefined);
                    }}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Image Upload */}
              {showImageUpload && (
                <div className="mt-4">
                  <ImageUpload
                    imageUrl={imageUrl}
                    imageFile={imageFile}
                    onImageChange={setImageFile}
                    onImageUrlChange={setImageUrl}
                  />
                </div>
              )}
            </div>

            {/* Add to Post */}
            <div className="p-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                <span className="text-gray-600 font-medium">Add to your post</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(!showImageUpload)}
                    className="p-2 hover:bg-gray-100 rounded-full text-[#45BD62] transition-colors"
                    title="Photo/Video"
                  >
                    <ImageIcon className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full text-[#1877F2] transition-colors"
                    title="Tag People"
                  >
                    <Tag className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full text-[#F5B728] transition-colors"
                    title="Feeling/Activity"
                  >
                    <Smile className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full text-[#E94E77] transition-colors"
                    title="Check in"
                  >
                    <MapPin className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Schedule Post</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setMode('post')}
                    className={`px-3 py-1.5 rounded-md flex items-center text-sm ${
                      mode === 'post' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Post Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('schedule')}
                    className={`px-3 py-1.5 rounded-md flex items-center text-sm ${
                      mode === 'schedule' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <CalendarCheck className="h-4 w-4 mr-1.5" />
                    Schedule
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                max={format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm")}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={mode === 'post'}
              />
            </div>

            {/* First Comment */}
            <div className="p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Add First Comment</span>
              </div>
              <textarea
                rows={2}
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add a comment that will be posted right after publishing..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-50">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="facebook"
                  className="flex-1 text-base"
                  onClick={handlePostNow}
                  disabled={isSubmitting || isPublishing || mode === 'schedule'}
                >
                  {isPublishing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Post Now
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 text-base"
                  disabled={isSubmitting || isPublishing || mode === 'post'}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-5 w-5 mr-2" />
                      Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="hidden lg:block w-[400px] border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium flex items-center text-gray-900">
              <Eye className="h-5 w-5 mr-2 text-gray-500" />
              Post Preview
            </h3>
          </div>
          <div className="p-4 bg-gray-50 h-[calc(100%-65px)] overflow-y-auto">
            <FacebookPreview
              content={content}
              firstComment={firstComment}
              imageUrl={imageUrl}
              imageFile={imageFile}
              scheduledFor={scheduledFor}
              selectedPages={selectedPages}
            />
          </div>
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}