import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function Notification({ type, message, onClose }: NotificationProps) {
  return (
    <div className={cn(
      "fixed top-4 right-4 w-96 p-4 rounded-lg shadow-lg border transition-all transform",
      type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={cn(
            "text-sm font-medium",
            type === 'success' ? 'text-green-800' : 'text-red-800'
          )}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}