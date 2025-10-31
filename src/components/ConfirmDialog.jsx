import React, { Fragment } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * Confirmation Dialog Component
 * Tailwind UI modal pattern for confirmations
 */
function ConfirmDialog({ 
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) {
  if (!isOpen) return null;
  
  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };
  
  const iconColors = {
    danger: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20',
    info: 'bg-blue-100 dark:bg-blue-900/20'
  };
  
  const iconTextColors = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  };
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  
  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-calm-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-white dark:bg-calm-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={cn(
                  "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
                  iconColors[type]
                )}>
                  <AlertTriangle className={cn("h-6 w-6", iconTextColors[type])} />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-calm-750 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto focus:outline-none focus:ring-2 focus:ring-offset-2",
                  buttonColors[type]
                )}
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-calm-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-calm-600 sm:mt-0 sm:w-auto"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
