import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hideDefaultButtons?: boolean;
  danger?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  isLoading = false,
  size = 'md',
  hideDefaultButtons = false,
  danger = false,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`relative w-full ${sizeClasses[size]} transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-2">
            {children}
          </div>

          {/* Footer */}
          {!hideDefaultButtons && (primaryActionLabel || onPrimaryAction) && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant={danger ? 'danger' : 'primary'}
                onClick={onPrimaryAction}
                isLoading={isLoading}
              >
                {primaryActionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal; 