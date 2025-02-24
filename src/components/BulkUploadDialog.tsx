import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from './Button';
import { Post, FacebookPage } from '../types';
import { usePostStore } from '../store';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVPost {
  content: string;
  scheduledFor: string;
  firstComment?: string;
  imageUrl?: string;
}

export function BulkUploadDialog({ isOpen, onClose }: BulkUploadDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<CSVPost[]>([]);
  const { addPost } = usePostStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0].map(header => header.trim());

      const posts = rows.slice(1).map(row => {
        const post: Partial<CSVPost> = {};
        headers.forEach((header, index) => {
          const value = row[index]?.trim();
          if (value) {
            switch (header.toLowerCase()) {
              case 'content':
                post.content = value;
                break;
              case 'scheduled_for':
              case 'scheduledfor':
              case 'date':
                post.scheduledFor = new Date(value).toISOString();
                break;
              case 'first_comment':
              case 'firstcomment':
                post.firstComment = value;
                break;
              case 'image_url':
              case 'imageurl':
                post.imageUrl = value;
                break;
            }
          }
        });
        return post as CSVPost;
      }).filter(post => post.content && post.scheduledFor);

      setPreview(posts);
      setError(undefined);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
      preview.forEach(post => {
        addPost({
          id: crypto.randomUUID(),
          content: post.content,
          firstComment: post.firstComment,
          imageUrl: post.imageUrl,
          scheduledFor: post.scheduledFor,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          selectedPages: []
        });
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process posts');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Bulk Upload Posts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Drag and drop your CSV file here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              File should contain: content, scheduledFor, firstComment (optional), imageUrl (optional)
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview ({preview.length} posts)</h3>
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {preview.map((post, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <p className="font-medium">{post.content}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
                    </div>
                    {post.firstComment && (
                      <div className="mt-1 text-sm text-gray-500">
                        First comment: {post.firstComment}
                      </div>
                    )}
                    {post.imageUrl && (
                      <div className="mt-1 text-sm text-gray-500">
                        Image URL: {post.imageUrl}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isProcessing || preview.length === 0}
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Upload {preview.length} Posts
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}