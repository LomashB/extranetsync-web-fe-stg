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
      
      const response = await axios.get(`/api/tenant/my-subscription?tenant_id=${tenantId}`);
      
      if (response.data.STATUS === 1) {
        const data = response.data.RESULT;
        setSubscriptionData(data);
        setAvailablePlans(data.available_plans || []);
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to fetch subscription status');
      }
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      setError(error.response?.data?.MESSAGE || 'Failed to load subscription information');
      
      // Fallback: try to fetch available plans separately
      try {
        const plansResponse = await axios.get('/api/tenant/subscription-plans');
        if (plansResponse.data.STATUS === 1) {
          setAvailablePlans(plansResponse.data.RESULT || []);
        }
      } catch (plansError) {
        console.error('Error fetching subscription plans:', plansError);
      }
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