import { useState, useEffect } from 'react';
import axios from '../lib/axios';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  loading: boolean;
  error?: string;
  href: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OnboardingStatus {
  tasks: OnboardingTask[];
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
}

const ONBOARDING_TASKS: Omit<OnboardingTask, 'completed' | 'loading' | 'error'>[] = [
  {
    id: 'profile',
    title: 'Update Your Profile',
    description: 'Complete your truck information with name, address, phone, and logo',
    href: '/tenant/settings/profile',
    estimatedTime: '3 min',
    priority: 'high'
  },
  {
    id: 'business-hours',
    title: 'Set Business Hours',
    description: 'Define when your food truck is open for business',
    href: '/tenant/settings/business-hours',
    estimatedTime: '2 min',
    priority: 'high'
  },
  {
    id: 'cover-media',
    title: 'Add Banner Images',
    description: 'Upload eye-catching images or videos to showcase your truck',
    href: '/tenant/settings/cover-media',
    estimatedTime: '3 min',
    priority: 'medium'
  },
  {
    id: 'categories',
    title: 'Create Menu Categories',
    description: 'Organize your menu with categories like "Appetizers", "Main Course"',
    href: '/tenant/categories',
    estimatedTime: '5 min',
    priority: 'high'
  },
  {
    id: 'products',
    title: 'Add Your Products',
    description: 'Showcase your delicious food items with photos and descriptions',
    href: '/tenant/products',
    estimatedTime: '10 min',
    priority: 'high'
  },
  {
    id: 'offers',
    title: 'Create Special Offers',
    description: 'Attract customers with special deals and promotions',
    href: '/tenant/offers',
    estimatedTime: '5 min',
    priority: 'low'
  }
];

export const useOnboardingStatus = (): OnboardingStatus => {
  const [tasks, setTasks] = useState<OnboardingTask[]>(
    ONBOARDING_TASKS.map(task => ({
      ...task,
      completed: false,
      loading: false,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);

  const checkTaskCompletion = async (taskId: string): Promise<boolean> => {
    try {
      switch (taskId) {
        case 'profile': {
          const response = await axios.get('/api/tenant/my-truck');
          if (response.data.STATUS === 1 && response.data.RESULT?.truck) {
            const { truck } = response.data.RESULT;
            return !!(
              truck.truck_name?.trim() &&
              truck.address?.trim() &&
              truck.service_number?.trim() &&
              truck.truck_logo
            );
          }
          return false;
        }

        case 'business-hours': {
          const response = await axios.get('/api/tenant/business-hours');
          if (response.data.STATUS === 1) {
            const businessHours = response.data.RESULT?.business_hours || [];
            return businessHours.length > 0;
          }
          return false;
        }

        case 'cover-media': {
          const response = await axios.get('/api/tenant/cover');
          if (response.data.STATUS === 1 && response.data.RESULT) {
            const { cover_images, cover_video } = response.data.RESULT;
            return (cover_images && cover_images.length > 0) || !!cover_video;
          }
          return false;
        }

        case 'categories': {
          const response = await axios.get('/api/tenant/categories?limit=1');
          if (response.data.STATUS === 1) {
            const categories = response.data.RESULT?.categories || response.data.RESULT || [];
            return categories.some((cat: any) => cat.is_active);
          }
          return false;
        }

        case 'products': {
          const response = await axios.get('/api/tenant/products?limit=1');
          if (response.data.STATUS === 1) {
            const products = response.data.RESULT?.products || response.data.RESULT || [];
            return products.some((product: any) => product.is_active);
          }
          return false;
        }

        case 'offers': {
          const response = await axios.get('/api/tenant/offers?limit=1');
          if (response.data.STATUS === 1) {
            const offers = response.data.RESULT?.offers || response.data.RESULT || [];
            return offers.some((offer: any) => offer.is_active);
          }
          return false;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking completion for task ${taskId}:`, error);
      return false;
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    setTasks(prevTasks =>
      prevTasks.map(task => ({
        ...task,
        loading: true,
        error: undefined
      }))
    );

    // Check all tasks in parallel
    const taskPromises = tasks.map(async (task) => {
      try {
        const completed = await checkTaskCompletion(task.id);
        return {
          ...task,
          completed,
          loading: false,
          error: undefined
        };
      } catch (error) {
        return {
          ...task,
          completed: false,
          loading: false,
          error: 'Failed to check status'
        };
      }
    });

    try {
      const updatedTasks = await Promise.all(taskPromises);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error refreshing onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return {
    tasks,
    completedCount,
    totalCount,
    progressPercentage,
    isLoading,
    refreshStatus
  };
}; 