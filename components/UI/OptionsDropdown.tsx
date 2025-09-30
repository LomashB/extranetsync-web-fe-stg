import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

interface DropdownOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  hidden?: boolean;
}

interface OptionsDropdownProps {
  options: DropdownOption[];
  triggerClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

const OptionsDropdown: React.FC<OptionsDropdownProps> = ({
  options,
  triggerClassName = "text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100",
  dropdownClassName = "fixed w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (disabled) return;
    
    if (isOpen) {
      setIsOpen(false);
      setPosition(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate height of dropdown
      
      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const shouldShowAbove = spaceBelow < dropdownHeight;
      
      const newPosition = {
        right: window.innerWidth - rect.right,
        ...(shouldShowAbove 
          ? { bottom: viewportHeight - rect.top + 5 }
          : { top: rect.bottom + 5 }
        )
      };
      
      setPosition(newPosition);
      setIsOpen(true);
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    option.onClick();
    setIsOpen(false);
    setPosition(null);
  };

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setPosition(null);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
      setPosition(null);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  // Filter out hidden options
  const visibleOptions = options.filter(option => !option.hidden);

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={triggerClassName}
        disabled={disabled}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && position && (
        <div
          ref={dropdownRef}
          className={dropdownClassName}
          style={{
            right: `${position.right}px`,
            ...(position.top !== undefined 
              ? { top: `${position.top}px` }
              : { bottom: `${position.bottom}px` }
            )
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {visibleOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className={option.className || "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsDropdown; 