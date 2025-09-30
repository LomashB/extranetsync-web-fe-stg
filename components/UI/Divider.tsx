import React from 'react';
interface DividerProps {
  text?: string;
}

const Divider: React.FC<DividerProps> = ({ text }) => {
  if (!text) {
    return (
      <div className={`h-px bg-gray-200 w-full my-4`} />
    );
  }

  return (
    <div className="flex items-center my-4">
      <div className={`h-px bg-gray-200 flex-grow`} />
      <span className={`px-4 text-sm text-gray-500`}>{text}</span>
      <div className={`h-px bg-gray-200 flex-grow`} />
    </div>
  );
};

export default Divider; 