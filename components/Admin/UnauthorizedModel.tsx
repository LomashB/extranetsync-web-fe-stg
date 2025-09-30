import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

interface UnauthorizedEvent extends CustomEvent {
  detail: { message: string; path: string };
}

interface UnauthorizedModalProps {
  useNewDesign?: boolean;
}

const UnauthorizedModal: React.FC<UnauthorizedModalProps> = ({ useNewDesign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState({ message: '', path: '' });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as UnauthorizedEvent;
      setErrorDetails(customEvent.detail);
      setIsOpen(true);
    };

    window.addEventListener('unauthorizedAccess', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorizedAccess', handleUnauthorized);
    };
  }, []);

  const handleLockClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      {isOpen && (
        useNewDesign ? (
          <div className=" fixed inset-0 backdrop-blur-md bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 min-h-screen w-full h-full  ">
            {/* <div className="fixed inset-0 overflow-hidden">
              <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl"></div>
              <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-pink-600/30 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-800/30 blur-3xl"></div>
            </div> */}

            <div className="relative backdrop-blur-xl  bg-white/10 p-12 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center max-w-md w-full mx-4">
              <button 
                onClick={handleLockClick}
                className="group transition-all duration-300 hover:scale-110"
              >
                <div className="h-32 w-32 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm border border-white/30 mb-8 group-hover:bg-white/30">
                  <Lock className="h-16 w-16 text-white group-hover:text-pink-100" />
                </div>
              </button>
              
              <h2 className="text-white text-3xl font-light tracking-widest mb-4">RESTRICTED</h2>
              <p className="text-white/70 text-center text-sm">
                This area requires special permissions to access
              </p>

               {/* Close Button with Glassmorphic Design */}
               <button 
                onClick={() => setIsOpen(false)} 
                className="mt-6 bg-white/20 backdrop-blur-md border border-white/30 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:bg-white/30"
              >
                Close
              </button>
            </div>

            <div className={`fixed bottom-4 right-4 transition-all duration-300 ${
              showToast 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-24 opacity-0'
            }`}>
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg shadow-2xl p-4 text-white">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Access Denied</p>
                    <p className="text-sm text-white/70">Please contact the admin for access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* ... existing original modal code ... */}
          </div>
        )
      )}
    </>
  );
};

export default UnauthorizedModal;