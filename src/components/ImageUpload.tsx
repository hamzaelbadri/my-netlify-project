import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X } from 'lucide-react';

interface ImageUploadProps {
  imageUrl?: string;
  imageFile?: File;
  onImageChange: (file?: File) => void;
  onImageUrlChange: (url: string) => void;
}

export function ImageUpload({ imageUrl, imageFile, onImageChange, onImageUrlChange }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onImageChange(file);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUrlChange(e.target.value);
    onImageChange(undefined);
  };

  const clearImage = () => {
    onImageChange(undefined);
    onImageUrlChange('');
  };

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Image
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
            <Image className="h-4 w-4" />
          </span>
          <input
            type="url"
            value={imageUrl || ''}
            onChange={handleUrlChange}
            className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
            disabled={!!imageFile}
          />
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <div className="space-y-1 text-center">
          <input {...getInputProps()} />
          <div className="flex text-sm text-gray-600">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <div className="flex text-sm text-gray-600">
            <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <span>Upload a file</span>
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>

      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 rounded-md w-full h-40 object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}