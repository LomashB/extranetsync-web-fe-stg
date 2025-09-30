import { useState, useEffect } from 'react';
import axios from '../lib/axios';

export interface IntroOffer {
  type: string;
  intro_price: number;
  intro_duration_interval: string;
  intro_duration_count: number;
  stripe_intro_price_id: string;
  trial_period_days: number;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  stripe_product_id: string;
  price: number;
  currency: string;
  plan_type: string;
  billing_interval: string;
  billing_interval_count: number;
  has_intro_offer: boolean;
  intro_offer?: IntroOffer;
  max_trucks: number;
  features: string[];
  is_active: boolean;
  is_free: boolean;
  is_popular: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  _id: string;
  tenant_id: string;
  subscription_plan_id: SubscriptionPlan;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  status: string;
  subscription_type: string;
  current_period_start: string;
  current_period_end: string;
  auto_renewal: boolean;
  started_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface SubscriptionData {
  subscription: TenantSubscription | null;
  can_resubscribe: boolean;
  has_active_subscription: boolean | null;
  subscription_status: string;
  available_plans: SubscriptionPlan[];
  can_schedule_from_period_end?: boolean; // Added to match backend response
}

export interface UseSubscriptionStatusReturn {
  subscriptionData: SubscriptionData | null;
  availablePlans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: (reason: string, immediate?: boolean) => Promise<boolean>;
}

export const useSubscriptionStatus = (tenantId?: string): UseSubscriptionStatusReturn => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch subscription status and available plans in parallel
      const [subscriptionResponse, plansResponse] = await Promise.all([
        axios.get(`/api/tenant/my-subscription?tenant_id=${tenantId}`).catch(() => ({ data: { STATUS: 0, RESULT: null } })),
        axios.get('/api/tenant/subscription-plans')
      ]);
      
      // Handle subscription data
      let subscriptionData: SubscriptionData | null = null;
      if (subscriptionResponse.data.STATUS === 1) {
        subscriptionData = subscriptionResponse.data.RESULT;
      } else {
        // If no subscription data, create default structure
        subscriptionData = {
          subscription: null,
          can_resubscribe: false,
          has_active_subscription: false,
          subscription_status: 'inactive',
          available_plans: []
        };
      }
      
      // Handle available plans from admin API
      let plans: SubscriptionPlan[] = [];
      if (plansResponse.data.STATUS === 1) {
        // Filter only active plans and sort by sort_order
        plans = (plansResponse.data.RESULT || [])
          .filter((plan: SubscriptionPlan) => plan.is_active)
          .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order);
      }
      
      setSubscriptionData(subscriptionData);
      setAvailablePlans(plans);
      
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      setError(error.response?.data?.MESSAGE || 'Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscriptionStatus();
  };

  const cancelSubscription = async (reason: string, immediate: boolean = false): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await axios.put('/api/tenant/subscription/cancel', {
        cancellation_reason: reason,
        immediate: immediate
      });
      
      if (response.data.STATUS === 1) {
        // Refresh subscription data after cancellation
        await fetchSubscriptionStatus();
        return true;
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      setError(error.response?.data?.MESSAGE || 'Failed to cancel subscription');
      return false;
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchSubscriptionStatus();
    }
  }, [tenantId]);

  return {
    subscriptionData,
    availablePlans,
    isLoading,
    error,
    refreshSubscription,
    cancelSubscription
  };
}; 