import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiInfo, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'אישור',
  message = 'האם אתה בטוח?',
  confirmText = 'אישור',
  cancelText = 'ביטול',
  type = 'warning' // 'warning', 'danger', 'info', 'success'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: FiAlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
    },
    danger: {
      icon: FiTrash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
    info: {
      icon: FiInfo,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
    },
    success: {
      icon: FiCheckCircle,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden">
        {/* Header with Icon */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <IconComponent className={`text-3xl ${config.iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 ${config.buttonBg} text-white rounded-xl font-medium transition-all active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
