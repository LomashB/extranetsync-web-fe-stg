import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  value?: string;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<Props> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0 && !disabled) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="space-y-1">
      <div
        {...getRootProps()}
        className={`
          relative
          border-2
          border-dashed
          rounded-lg
          p-4
          transition-colors
          cursor-pointer
          min-h-[160px]
          flex
          items-center
          justify-center
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {value ? (
          <div className="relative w-full h-[140px]">
            <Image
              src={value}
              alt="Upload preview"
              fill
              className="object-contain rounded"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 flex text-sm leading-6 text-gray-600">
              <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8 14A6 6 0 108 2a6 6 0 000 12zm0 1A7 7 0 118 1a7 7 0 010 14z" fillRule="evenodd"/>
            <path d="M7.5 10.833c0-.46.373-.833.833-.833h.084c.46 0 .833.373.833.833v.084c0 .46-.373.833-.833.833h-.084c-.46 0-.833-.373-.833-.833v-.084zM7.425 5a.83.83 0 00-.823.941l.297 2.75a.83.83 0 001.645 0l.3-2.75A.83.83 0 008.022 5H7.425z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload; 