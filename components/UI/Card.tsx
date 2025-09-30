import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-md ${className}`}
    >
      {children}
    </div>
  );
};

export default Card; 