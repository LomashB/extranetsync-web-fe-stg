"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import PageTransitionWrapper from "../components/PageTransitionWrapper";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, userType, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content with animation after component mounts
    setShowContent(true);
  }, []);

  useEffect(() => {
    if (isLoading) return; // wait for auth state

    // Fixed: 5-second delay before redirect
    const redirectTimer = setTimeout(() => {
      if (isAuthenticated && userType === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/auth/admin/login");
      }
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, userType, isLoading, router]);

  return (
    <PageTransitionWrapper>
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-6">
      {/* Soft background blobs - neutral tones */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-gradient-to-tr from-gray-500/15 to-black/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-gray-300/10 to-gray-700/15 blur-3xl" />

      <div className={`relative z-10 text-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Creative Loader */}
        <div className="relative mx-auto mb-8 h-28 w-28">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-700 via-gray-800 to-gray-900 opacity-20 blur-md animate-pulse" />
          
          {/* Core orb with hotel theme */}
          <div className="relative h-full w-full rounded-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.25)] animate-pulse" />
          
          {/* Inner highlight */}
          <div className="absolute top-6 left-6 h-4 w-4 rounded-full bg-gradient-to-br from-white/40 to-gray-300/30 blur-sm" />
          
          {/* Orbit paths - properly spaced */}
          <div className="absolute inset-[-8px] rounded-full border border-gray-400/20" />
          <div className="absolute inset-[-16px] rounded-full border border-gray-300/15" />
          
          {/* Inner orbit container - rotates as a whole */}
          <div className="inner-orbit-container">
            <div className="orbit-dot white-dot inner-dot-1"></div>
            <div className="orbit-dot white-dot inner-dot-2"></div>
            <div className="orbit-dot white-dot inner-dot-3"></div>
          </div>
          
          {/* Outer orbit container - rotates as a whole */}
          <div className="outer-orbit-container">
            <div className="orbit-dot black-dot outer-dot-1"></div>
            <div className="orbit-dot black-dot outer-dot-2"></div>
            <div className="orbit-dot black-dot outer-dot-3"></div>
          </div>
        </div>

        {/* Brand Logo */}
        <div className="flex justify-center mb-2">
          <Image
            src="/assets/extranetsync-full-logo.png"
            alt="Extranetsync"
            width={260}
            height={56}
            priority
            className="h-12 w-auto"
          />
        </div>

        {/* Subtitle */}
        <p className="text-gray-600 text-lg mb-4">Hotel Channel Management</p>

        {/* Loading Text */}
        <p className="inline-flex items-center gap-2 text-sm text-gray-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-600 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-800" />
          </span>
          Initializing your dashboard...
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-500" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-700" />
        </div>
      </div>

      {/* Custom styles with perfect 120-degree positioning */}
      <style jsx>{`
        @keyframes rotateInner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotateOuter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        .inner-orbit-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 124px; /* 62px radius * 2 */
          height: 124px;
          margin-top: -62px;
          margin-left: -62px;
          animation: rotateInner 4s linear infinite;
        }
        
        .outer-orbit-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 156px; /* 78px radius * 2 */
          height: 156px;
          margin-top: -78px;
          margin-left: -78px;
          animation: rotateOuter 6s linear infinite;
        }
        
        .orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: -4px;
          margin-left: -4px;
        }
        
        /* White dots for inner orbit */
        .white-dot {
          background: radial-gradient(circle, #ffffff 0%, #f8fafc 100%);
          box-shadow: 
            0 0 8px rgba(255, 255, 255, 0.8),
            0 2px 4px rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }
        
        /* Black dots for outer orbit */
        .black-dot {
          background: radial-gradient(circle, #000000 0%, #1a1a1a 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.8);
        }
        
        /* Inner orbit dots positioned at 120-degree intervals (0°, 120°, 240°) */
        .inner-dot-1 {
          /* 0 degrees - top */
          top: 0px;
          left: 50%;
          transform: translateX(-50%);
        }
        .inner-dot-2 {
          /* 120 degrees - bottom right */
          top: 75%;
          right: 12.5%;
          transform: translate(50%, -50%);
        }
        .inner-dot-3 {
          /* 240 degrees - bottom left */
          top: 75%;
          left: 12.5%;
          transform: translate(-50%, -50%);
        }
        
        /* Outer orbit dots positioned at 120-degree intervals (60°, 180°, 300°) - offset for visual variety */
        .outer-dot-1 {
          /* 60 degrees - top right */
          top: 25%;
          right: 12.5%;
          transform: translate(50%, -50%);
        }
        .outer-dot-2 {
          /* 180 degrees - bottom */
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
        }
        .outer-dot-3 {
          /* 300 degrees - top left */
          top: 25%;
          left: 12.5%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
    </PageTransitionWrapper>
  );
}
