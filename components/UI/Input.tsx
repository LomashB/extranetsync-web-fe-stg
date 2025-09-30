import React, { InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  id,
  label,
  error,
  helpText,
  fullWidth = true,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className = '',
  ...props
}, ref) => {
  // Generate a consistent ID using useId hook
  const generatedId = useId();
  const inputId = id || generatedId;
  
  const baseInputClasses = `px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors ${
    error 
      ? `border-[#d82c0d] focus:ring-[#d82c0d] focus:border-[#d82c0d] bg-[#fff4f4]` 
      : `border-[#8c9196] focus:ring-[#8c9196] focus:border-[#8c9196]`
  }`;
  
  const widthClasses = fullWidth ? 'w-full' : '';
  const iconClasses = leftIcon || rightIcon ? (leftIcon ? 'pl-8' : '') + (rightIcon ? ' pr-10' : '') : '';
  
  const inputClasses = `${baseInputClasses} ${widthClasses} ${iconClasses} ${className}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium ${error ? 'text-[#d82c0d]' : 'text-[#202223]'}`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input ref={ref} id={inputId} className={inputClasses} {...props} />
        
        {rightIcon && (
          <div 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 ${onRightIconClick ? 'cursor-pointer' : ''}`}
            onClick={onRightIconClick}
          >
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-[#d82c0d] flex items-center gap-1 mt-1">
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8 14A6 6 0 108 2a6 6 0 000 12zm0 1A7 7 0 118 1a7 7 0 010 14z" fillRule="evenodd"/>
            <path d="M7.5 10.833c0-.46.373-.833.833-.833h.084c.46 0 .833.373.833.833v.084c0 .46-.373.833-.833.833h-.084c-.46 0-.833-.373-.833-.833v-.084zM7.425 5a.83.83 0 00-.823.941l.297 2.75a.83.83 0 001.645 0l.3-2.75A.83.83 0 008.022 5H7.425z"/>
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-[#6d7175] mt-1">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 