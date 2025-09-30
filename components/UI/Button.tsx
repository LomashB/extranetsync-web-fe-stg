import React, { ButtonHTMLAttributes, useState } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'plain' | 'primarypink';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  withArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disclosure?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  withArrow = false,
  disclosure = false,
  className = '',
  size = 'md',
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-[6px] text-sm',
    md: 'px-4 py-[9px] text-sm',
    lg: 'px-5 py-3 text-base',
  };
  
  // Base classes for all buttons
  const baseClasses = `relative rounded-md transition-all duration-200 flex items-center justify-center focus:outline-none overflow-hidden font-medium ${sizeClasses[size]}`;
  
  // Button styles for different variants - Shopify style
  const variantClasses = {
    primarypink: `bg-[#C55D5D] text-white hover:bg-[#C55D5D]/80 hover:text-white border-none`,

    primary: `bg-[#303030] text-white hover:bg-[#202020] border border-[#303030] focus:ring-2 focus:ring-offset-2 focus:ring-[#303030] active:bg-[#202020]`,

    secondary: `bg-white text-[#202223] border border-[#d2d5d8] hover:bg-[#f6f6f7] shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#d2d5d8] active:bg-[#f6f6f7]`,
    
    accent: `bg-[#5c6ac4] hover:bg-[#4959bd] text-white border border-[#5c6ac4] focus:ring-2 focus:ring-offset-2 focus:ring-[#5c6ac4] active:bg-[#4959bd]`,
    
    success: `bg-[#008060] hover:bg-[#006e52] text-white border border-[#008060] focus:ring-2 focus:ring-offset-2 focus:ring-[#008060] active:bg-[#006e52]`,

    danger: `bg-[#d82c0d] hover:bg-[#bc2200] text-white border border-[#d82c0d] focus:ring-2 focus:ring-offset-2 focus:ring-[#d82c0d] active:bg-[#bc2200]`,

    plain: `bg-transparent text-[#202223] hover:bg-[#f6f6f7] focus:ring-2 focus:ring-offset-2 focus:ring-[#d2d5d8] active:bg-[#f6f6f7]`,
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Disabled and loading state classes
  const disabledClasses = disabled || isLoading 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : '';
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${widthClasses} ${disabledClasses} ${className}`;
  
  return (
    <button 
      className={buttonClasses}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {!isLoading && leftIcon && <span className="flex items-center mr-2">{leftIcon}</span>}
      
      <span className={`flex items-center ${isLoading ? 'invisible' : 'visible'}`}>
        {children}
        {withArrow && (
          <span 
            className={`
              inline-flex ml-1 
              transition-all duration-300 ease-in-out
              ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
            `}
            aria-hidden={!isHovered}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3.5L10.5 8L6.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </span>
      
      {!isLoading && rightIcon && <span className="flex items-center ml-2">{rightIcon}</span>}

      {disclosure && (
        <span className="ml-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 14L16 6H4L10 14Z" fill="currentColor"/>
          </svg>
        </span>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className='sr-only'>Loading...</span>
          <div className='h-2 w-2 mr-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]'></div>
          <div className='h-2 w-2 mr-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]'></div>
          <div className='h-2 w-2 bg-current rounded-full animate-bounce'></div>
        </div>
      )}
    </button>
  );
};

export default Button; 