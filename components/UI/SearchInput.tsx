import React from 'react';
import { Search, X } from 'lucide-react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear: () => void;
}

const SearchInput: React.FC<Props> = ({ value, onChange, onClear, className = '', ...props }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-black" />
      </div>
      <input
        type="text"
        className={`block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 ${className}`}
        value={value}
        onChange={onChange}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-3 flex items-center"
        >
          <X className="h-4 w-4 text-black hover:text-black" />
        </button>
      )}
    </div>
  );
};

export default SearchInput; 