import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'אישור',
    cancelText: 'ביטול',
    onConfirm: () => {}
  });

  const confirm = useCallback(({
    title = 'אישור',
    message = 'האם אתה בטוח?',
    type = 'warning',
    confirmText = 'אישור',
    cancelText = 'ביטול'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => resolve(true)
      });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmState,
    confirm,
    closeConfirm
  };
};

export default useConfirm;
