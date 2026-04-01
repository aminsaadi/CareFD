"use client";

import { useState, useCallback, useRef } from 'react';

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
  const rejectRef = useRef(null);

  const confirm = useCallback(({
    title = 'אישור',
    message = 'האם אתה בטוח?',
    type = 'warning',
    confirmText = 'אישור',
    cancelText = 'ביטול'
  }) => {
    return new Promise((resolve, reject) => {
      rejectRef.current = reject;
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
    if (rejectRef.current) {
      rejectRef.current(new Error('cancelled'));
      rejectRef.current = null;
    }
  }, []);

  return {
    confirmState,
    confirm,
    closeConfirm
  };
};

export default useConfirm;
