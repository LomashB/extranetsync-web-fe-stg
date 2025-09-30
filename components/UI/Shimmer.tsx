import React from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const Shimmer: React.FC<Props> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
      {...props}
    />
  );
};

export default Shimmer; 