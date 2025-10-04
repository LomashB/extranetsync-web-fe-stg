'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Input from '../../../../components/UI/Input';
import Button from '../../../../components/UI/Button'; 
import Link from 'next/link';
import PageTransitionWrapper from '@components/PageTransitionWrapper';

export default function AdminLogin() {
  const router = useRouter();
  const { loginAdmin, isAuthenticated, userType } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [mobile_number, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('mobile'); // 'mobile' or 'password'
  const [mobileError, setMobileError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  // Redirect if already logged in as admin
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && userType === 'admin') {
        toast.success('Already logged in as admin! Redirecting to admin dashboard...');
        await new Promise(resolve => setTimeout(resolve, 1000));  
        router.push('/admin/calendar');
      }
    };
    checkAuth();
  }, [isAuthenticated, userType, router]);
  
  useEffect(() => {
    // Check if we have a saved mobile number
    const savedMobile = localStorage.getItem('lastAdminLoginMobile');
    if (savedMobile) {
      setMobileNumber(savedMobile);
    }
    
    // Focus mobile field when component mounts and we're on mobile step
    if (step === 'mobile') {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, []);
  
  // Focus mobile field when returning to mobile step
  useEffect(() => {
    if (step === 'mobile') {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, [step]);
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const validateMobileNumber = (mobile: string) => {
    // Basic mobile number validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
  };
  
  const handleMobileContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile_number.trim()) {
      setMobileError('Enter a valid mobile number');
      return;
    }
    
    // Mobile number validation
    if (!validateMobileNumber(mobile_number)) {
      setMobileError('Enter a valid 10-digit mobile number');
      return;
    }
    
    setMobileError('');
    setStep('password');
    
    // Focus password field after state update
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Call the loginAdmin function from AuthContext
      await loginAdmin(mobile_number, password);
      
      // Store mobile number for future login
      localStorage.setItem('lastAdminLoginMobile', mobile_number);
      
      // Show success message
      toast.success('Admin login successful!');
      
      // Add delay before navigation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to admin dashboard
      router.push('/admin/calendar');
      
    } catch (error) {
      console.error('Admin login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during admin login';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden bg-black/90"
        style={{
          backgroundImage: `url('/textures/bg-texture.png')`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
        }}
      >
        {/* Animated background blobs - changed to gray tones */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-gray-600 blur-[300px] opacity-30"
          style={{
            left: '-200px',
            bottom: '-200px',
            animation: 'purpleBlob 15s ease-in-out infinite',
            transformOrigin: 'center center',
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-gray-500 blur-[300px] opacity-25"
          style={{
            right: '-200px',
            bottom: '-300px',
            animation: 'tealBlob 18s ease-in-out infinite',
            animationDelay: '1s',
            transformOrigin: 'center center',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gray-700 blur-[300px] opacity-20"
          style={{
            left: '30%',
            top: '-200px',
            animation: 'indigo 20s ease-in-out infinite',
            animationDelay: '2s',
            transformOrigin: 'center center',
          }}
        />
        
        {/* Card for login form */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md z-10">
          <div className="text-start mb-2 sm:mb-4">
            <div
              className="w-32 sm:w-40 md:w-44 lg:w-48 h-8 sm:h-9 md:h-10 lg:h-11"
              style={{
                backgroundImage: 'url(/assets/extranetsync-full-logo.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }}
              role="img"
              aria-label="Extranetsync Logo"
            />
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Admin Login</h1>
          <p className="text-start text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">Access Extranetsync Admin Portal</p>
          
          {step === 'mobile' ? (
            <form onSubmit={handleMobileContinue} className="space-y-3 sm:space-y-4 md:space-y-4">
              <div className="space-y-1">
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Admin Mobile Number
                </label>
                <Input
                  ref={mobileInputRef}
                  id="mobile"
                  type="tel"
                  value={mobile_number}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (mobileError) setMobileError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base ${
                    mobileError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  required
                />
                {mobileError && (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {mobileError}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="primary"
                fullWidth
                withArrow
                className="text-sm sm:text-base"
              >
                Continue with mobile number
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-4">
              <div className="mb-2 sm:mb-4">
                <p className="text-xs sm:text-sm text-[#6b7280]">
                  <span className="font-medium">{mobile_number}</span>
                  <button 
                    type="button" 
                    className="ml-2 text-black hover:underline text-xs sm:text-sm" 
                    onClick={() => setStep('mobile')}
                  >
                    Change
                  </button>
                </p>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base"
                    placeholder="Enter your admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOffIcon size={16} className="sm:w-5 sm:h-5" /> : <EyeIcon size={16} className="sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <button 
                  type="button" 
                  className="text-xs sm:text-sm text-black hover:underline"
                  onClick={() => toast((t) => (
                    <span>Reset password feature coming soon</span>
                  ), { duration: 4000, style: { background: '#4a5568', color: '#fff' } })}
                >
                  Forgot password?
                </button>
              </div>
              
              <Button 
                type="submit" 
                variant="primary"
                fullWidth
                isLoading={isLoading}
                className="text-sm sm:text-base"
              >
                Log in to Admin Portal
              </Button>
            </form>
          )}
        </div>
        
        <style jsx>{`
          @keyframes purpleBlob {
            0% {
              transform: translate(0, 0) scale(1);
            }
            25% {
              transform: translate(100px, -300px) scale(1.1);
            }
            50% {
              transform: translate(200px, -100px) scale(0.9);
            }
            75% {
              transform: translate(0px, -400px) scale(1.2);
            }
            100% {
              transform: translate(0, 0) scale(1);
            }
          }
          
          @keyframes tealBlob {
            0% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(-200px, -300px) scale(1.2);
            }
            66% {
              transform: translate(-100px, -150px) scale(0.8);
            }
            100% {
              transform: translate(0, 0) scale(1);
            }
          }
          
          @keyframes indigo {
            0% {
              transform: translate(0, 0) scale(0.8);
            }
            33% {
              transform: translate(100px, 300px) scale(1.1);
            }
            66% {
              transform: translate(-150px, 200px) scale(0.9);
            }
            100% {
              transform: translate(0, 0) scale(0.8);
            }
          }
        `}</style>
      </div>
    </PageTransitionWrapper>
  );
}
