import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

const Drawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  position = 'right' 
}: DrawerProps) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle touch events for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const diff = position === 'right' ? startX - currentX : currentX - startX;
      
      if (diff > 50) {
        onClose();
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleTouchMove);
    }, { once: true });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 mt-0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div 
        className={`
          fixed top-0 ${position}-0 h-full 
          w-full sm:w-[85%] md:w-[75%] lg:w-[650px] 
          bg-white shadow-lg transform 
          transition-transform duration-300 ease-in-out z-40 
          ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}
        `}
        onTouchStart={handleTouchStart}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 pr-8">
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close drawer"
            >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
        </div>

        {/* Content */}
        <div 
          className="p-4 overflow-y-auto h-[calc(100%-5rem)] overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;