import React from 'react';

interface LoaderProps {
  loading: boolean;
}

const Loader: React.FC<LoaderProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center z-50 bg-purple-300/60 backdrop-blur-sm">
      <img src="/loading.gif" alt="Loading..." className="w-16 h-16 mb-4" />
      <div className="w-8 h-8 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );
};

export default Loader;
