import { useState, useCallback } from 'react';

/**
 * Hook for managing confirmation dialogs
 * Returns: { confirm, ConfirmDialog props }
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  const confirm = useCallback(({
    title,
    message,
    onConfirm,
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm?.();
          resolve(true);
        },
        type,
        confirmText,
        cancelText
      });
    });
  }, []);
  
  const handleClose = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  return {
    confirm,
    confirmProps: {
      ...confirmState,
      onClose: handleClose
    }
  };
}
