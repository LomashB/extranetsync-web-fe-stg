'use client'

import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children } : {children : React.ReactNode}) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 bg-blue-300/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-4 flex flex-col items-center">
            <img 
              src="/assets/loading-gif.gif" 
              alt="Loading..."
              className="w-12 h-12" 
            />
            <p className="mt-2 text-gray-700">Loading...</p>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}