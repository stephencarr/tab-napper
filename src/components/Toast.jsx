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
    success: <CheckCircle className="h-5 w-5 text-calm-600 dark:text-calm-400" />,
    error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  };
  
  const colors = {
    success: 'bg-white dark:bg-calm-800 border-calm-200 dark:border-calm-700',
    error: 'bg-white dark:bg-calm-800 border-calm-200 dark:border-calm-700',
    warning: 'bg-white dark:bg-calm-800 border-calm-200 dark:border-calm-700',
    info: 'bg-white dark:bg-calm-800 border-calm-200 dark:border-calm-700'
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
            <p className="text-sm font-medium text-calm-900 dark:text-calm-100">
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm text-calm-600 dark:text-calm-400">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={() => onClose?.(id)}
              className="inline-flex rounded-md text-calm-400 dark:text-calm-500 hover:text-calm-500 dark:hover:text-calm-400 focus:outline-none focus:ring-2 focus:ring-calm-500 focus:ring-offset-2 dark:ring-offset-calm-800"
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
