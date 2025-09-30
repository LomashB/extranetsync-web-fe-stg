'use client'

import React, { ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'

interface PageTransitionWrapperProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'fadeUp';
  duration?: number;
}

// Animation variants styled after Shopify's smooth transitions
const variants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { x: -10, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 10, opacity: 0 }
  },
  scale: {
    initial: { scale: 0.98, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.98, opacity: 0 }
  },
  fadeUp: {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 }
  }
};

/**
 * Page Transition Wrapper
 * 
 * Wraps page content with smooth Shopify-like transition effects.
 * 
 * @param children - The page content
 * @param variant - Animation variant ('fade', 'slide', 'scale', 'fadeUp')
 * @param duration - Animation duration in seconds
 * 
 * Example usage:
 * ```tsx
 * import PageTransitionWrapper from '../PageTransitionWrapper'
 * 
 * export default function MyPage() {
 *   return (
 *     <PageTransitionWrapper variant="fadeUp" duration={0.5}>
 *       <h1>My Page Content</h1>
 *     </PageTransitionWrapper>
 *   )
 * }
 * ```
 */
const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ 
  children, 
  variant = 'fade',
  duration = 0.3
}) => {

  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        ease: [0.25, 0.1, 0.25, 1.0] // Smooth easing curve similar to Shopify
      }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransitionWrapper 