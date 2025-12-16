'use client'

import React, { ReactNode } from 'react'

interface PageTransitionWrapperProps {
  children: ReactNode;
  // Keep props for compatibility, even if we don’t animate for now
  variant?: 'fade' | 'slide' | 'scale' | 'fadeUp';
  duration?: number;
}

/**
 * Page Transition Wrapper
 *
 * Temporarily simplified to a plain wrapper (no framer-motion) to avoid
 * runtime animation-library issues that can blank the page.
 */
const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  children,
}) => {
  return <div>{children}</div>;
};

export default PageTransitionWrapper;