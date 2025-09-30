import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning' | 'plain' | 'primary';
  children: React.ReactNode;
}

export const Alert = ({ type, children }: AlertProps) => {
  const styles = {
    success: 'bg-green-50 border-green-500 text-green-700',
    error: 'bg-red-50 border-red-500 text-red-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    plain: 'bg-transparent border-none text-gray-700',
    primary: 'bg-blue-50 border-blue-500 text-blue-700',
  };

  return (
    <div className={`p-4 mb-4 rounded-lg border ${styles[type]}`}>
      {children}
    </div>
  );
};