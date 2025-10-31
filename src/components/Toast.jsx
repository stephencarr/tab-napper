import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * Toast Notification Component
 * Tailwind UI pattern for non-blocking notifications
 */
function Toast({ 
  id,
  type = 'info', // 'success', 'error', 'warning', 'info'
  title,
  message,
  duration = 5000,
  onClose
}) {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);
  
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />
  };
  
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };
  
  return (
    <div className={cn(
      "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
      "animate-in slide-in-from-top-5 fade-in duration-300",
      colors[type]
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={() => onClose?.(id)}
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Toast;
