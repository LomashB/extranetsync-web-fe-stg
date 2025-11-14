'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../lib/axios'; 
import toast from 'react-hot-toast';

import {
  Plus,
  Search,
  Building2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Edit,
  Trash2,
  RefreshCw,
  Globe,
  Percent,
  Settings,
  ArrowRight,
  Check,
  X,
  Clock,
  Shield,
  Calendar,
  Users,
  Bed,
  CreditCard,
  MapPin,
  Star,
  Info
} from 'lucide-react';
import Input from '../../../components/UI/Input';
import Button from '../../../components/UI/Button';
import Modal from '../../../components/UI/Modal';
import SearchInput from '../../../components/UI/SearchInput';
import Shimmer from '../../../components/UI/Shimmer';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';

// ──────────────────────────────────────────────────────────────
// • Interface Definitions
// ──────────────────────────────────────────────────────────────
interface Property {
  property_id: string;
  agoda_enabled: boolean;
  hyperguest_enabled: boolean;
  hyperguest_property_code?: string;
  updated_at: string;
  agoda_property_name: string;
}

interface PropertyFormData {
  agoda_property_id: string;
  hyperguest_property_id: string;
}

interface AgodaProperty {
  _id: string;
  agoda_property_id: string;
  name: string;
  currency: string;
  extra_guest_percentage: number;
  is_active: boolean;
  sync_status: string;
  last_synced_at: string;
  language?: string;
  live_status?: string;
  occupancy_model?: string;
}

interface HyperguestProperty {
  _id: string;
  hyperguest_property_code: string;
  name: string;
  currency: string;
  extra_guest_percentage: number;
  is_active: boolean;
  sync_status: string;
  last_synced_at: string;
  language?: string;
}

interface AgodaRoom {
  _id: string;
  agoda_room_id: string;
  room_name: string;
  num_persons: number;
  num_rooms: number;
  max_rate: number;
  min_rate: number;
  is_active: boolean;
}

interface HyperguestRoom {
  _id: string;
  room_type_code: string;
  room_name: string;
  description: string;
  occupancy_details: Array<{
    base_occupancy: number;
    max_occupancy: number;
    age_qualifying_code: string | null;
  }>;
  is_active: boolean;
}

interface PropertyDetails {
  property: AgodaProperty | HyperguestProperty;
  rooms: AgodaRoom[] | HyperguestRoom[];
  rateplans?: any[];
  ratePlans?: any[];
  summary?: any;
}

// ──────────────────────────────────────────────────────────────
// • Step Enum
// ──────────────────────────────────────────────────────────────
enum SetupStep {
  PROPERTY_IDS = 'property_ids',
  AGODA_FETCH = 'agoda_fetch',
  AGODA_DETAILS = 'agoda_details',
  AGODA_PERCENTAGE = 'agoda_percentage',
  HYPERGUEST_FETCH = 'hyperguest_fetch',
  HYPERGUEST_CURRENCY = 'hyperguest_currency',
  HYPERGUEST_DETAILS = 'hyperguest_details',
  HYPERGUEST_PERCENTAGE = 'hyperguest_percentage',
  OTA_CONFIG = 'ota_config',
  COMPLETE = 'complete'
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-24" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-24" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-20" /></td>
    <td className="px-6 py-4"><Shimmer className="h-4 w-24" /></td>
    <td className="px-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-8 w-24" />
        </div>
        <div className="flex items-center space-x-2">
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-8 w-20" />
        </div>
      </div>
    </td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(3)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

export default function PropertyManagement() {
  const { user } = useAuth();
  
  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [properties, setProperties] = useState<Property[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAgodaDetailsModalOpen, setIsAgodaDetailsModalOpen] = useState(false);
  const [isHyperguestDetailsModalOpen, setIsHyperguestDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.PROPERTY_IDS);
  const [propertyForm, setPropertyForm] = useState<PropertyFormData>({
    agoda_property_id: '',
    hyperguest_property_id: ''
  });
  
  // Property data states
  const [agodaProperty, setAgodaProperty] = useState<AgodaProperty | null>(null);
  const [hyperguestProperty, setHyperguestProperty] = useState<HyperguestProperty | null>(null);
  const [agodaDetails, setAgodaDetails] = useState<PropertyDetails | null>(null);
  const [hyperguestDetails, setHyperguestDetails] = useState<PropertyDetails | null>(null);
  const [agodaPercentage, setAgodaPercentage] = useState<number>(0);
  const [hyperguestPercentage, setHyperguestPercentage] = useState<number>(0);
  const [hyperguestCurrency, setHyperguestCurrency] = useState<string>('');
  const [hyperguestCurrencyExists, setHyperguestCurrencyExists] = useState<boolean>(false);
  
  // View details states
  const [viewAgodaProperty, setViewAgodaProperty] = useState<AgodaProperty | null>(null);
  const [viewAgodaDetails, setViewAgodaDetails] = useState<PropertyDetails | null>(null);
  const [viewHyperguestProperty, setViewHyperguestProperty] = useState<HyperguestProperty | null>(null);
  const [viewHyperguestDetails, setViewHyperguestDetails] = useState<PropertyDetails | null>(null);
  
  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProperties();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchProperties = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get('admin/ota-status');
      const configs = response.data?.data?.configurations ?? response.data?.configurations ?? [];
      setProperties(configs);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to fetch properties');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAgodaProducts = async (propertyId: string) => {
    setIsProcessing(true);
    setProcessingMessage('Connecting to Agoda and fetching property data...');
    
    try {
      const response = await axios.post('admin/agoda/fetch-products', {
        property_ids: [propertyId]
      });
      
      if (response.data.STATUS === 1) {
        const results = response.data.RESULT?.results ?? [];
        const firstResult = results[0];
        const isSuccess = Array.isArray(results)
          ? results.some((r: any) => r?.status === 'success' || r?.status === 1 || r?.success === true)
          : false;

        if (isSuccess) {
          toast.success('Agoda property data fetched successfully');
          return true;
        }

        const errorMessage = firstResult?.message || firstResult?.error || 'Failed to fetch Agoda property data';
        toast.error(errorMessage);
        return false;
      }

      toast.error(response.data.MESSAGE || 'Failed to fetch Agoda products');
      return false;
    } catch (error: any) {
      console.error('Error fetching Agoda products:', error);
      toast.error(error.response?.data?.MESSAGE || 'Error while connecting with Agoda');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAgodaDetails = async (propertyId: string) => {
    setIsProcessing(true);
    setProcessingMessage('Retrieving Agoda property details...');
    
    try {
      const response = await axios.get(`admin/agoda/properties/${propertyId}`);
      
      if (response.data.STATUS === 1) {
        const details = response.data.RESULT;
        setAgodaProperty(details.property);
        setAgodaDetails(details);
        setAgodaPercentage(details.property.extra_guest_percentage || 0);
        return details;
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to get Agoda property details');
      }
    } catch (error: any) {
      console.error('Error fetching Agoda details:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to get Agoda property details');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateAgodaPercentage = async (propertyId: string, percentage: number) => {
    setIsProcessing(true);
    setProcessingMessage('Updating Agoda extra guest percentage...');
    
    try {
      const response = await axios.put(`admin/properties/${propertyId}/config/extra-guest-percentage`, {
        extra_guest_percentage: percentage
      });
      
      if (response.data.STATUS === 1) {
        toast.success('Agoda extra guest percentage updated successfully');
        // Update local state
        if (agodaProperty) {
          setAgodaProperty({ ...agodaProperty, extra_guest_percentage: percentage });
        }
        return true;
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update percentage');
      }
    } catch (error: any) {
      console.error('Error updating Agoda percentage:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update Agoda percentage');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const syncHyperguestProperty = async (propertyCode: string) => {
    setIsProcessing(true);
    setProcessingMessage('Connecting to HyperGuest and syncing property data...');
    
    try {
      const response = await axios.post(`admin/hyperguest/sync/${propertyCode}`);
      
      if (response.data.statusCode === 200) {
        const data = response.data.data;
        if (data.sync_status === 'completed') {
          toast.success('HyperGuest property data synced successfully');
          return true;
        } else {
          throw new Error('Sync status not completed');
        }
      } else {
        throw new Error(response.data.message || 'Failed to sync HyperGuest property');
      }
    } catch (error: any) {
      console.error('Error syncing HyperGuest property:', error);
      toast.error(error.response?.data?.message || 'Error while connecting with HyperGuest');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchHyperguestDetails = async (propertyCode: string) => {
    setIsProcessing(true);
    setProcessingMessage('Retrieving HyperGuest property details...');
    
    try {
      const response = await axios.get(`admin/hyperguest/properties/${propertyCode}`);
      
      if (response.data.STATUS === 1) {
        const details = response.data.RESULT;
        setHyperguestProperty(details.property);
        setHyperguestDetails(details);
        setHyperguestPercentage(details.property.extra_guest_percentage || 0);
        
        return details;
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to get HyperGuest property details');
      }
    } catch (error: any) {
      console.error('Error fetching HyperGuest details:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to get HyperGuest property details');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkHyperguestCurrency = async (propertyCode: string) => {
    try {
      const response = await axios.get(`admin/hyperguest/properties/${propertyCode}/currency`);
      
      if (response.data.statusCode === 200 && response.data.data?.currency) {
        setHyperguestCurrency(response.data.data.currency);
        setHyperguestCurrencyExists(true);
      } else {
        setHyperguestCurrency('');
        setHyperguestCurrencyExists(false);
      }
    } catch (error: any) {
      console.error('Error checking HyperGuest currency:', error);
      setHyperguestCurrency('');
      setHyperguestCurrencyExists(false);
    }
  };

  const updateHyperguestCurrency = async (propertyCode: string, currency: string) => {
    setIsProcessing(true);
    setProcessingMessage('Updating HyperGuest property currency...');
    
    try {
      const response = await axios.put(`admin/hyperguest/properties/${propertyCode}/currency`, {
        currency: currency.toUpperCase()
      });
      
      if (response.data.statusCode === 200) {
        toast.success('HyperGuest currency updated successfully');
        setHyperguestCurrency(currency.toUpperCase());
        setHyperguestCurrencyExists(true);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update currency');
      }
    } catch (error: any) {
      console.error('Error updating HyperGuest currency:', error);
      toast.error(error.response?.data?.message || 'Failed to update HyperGuest currency');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateHyperguestPercentage = async (propertyCode: string, percentage: number) => {
    setIsProcessing(true);
    setProcessingMessage('Updating HyperGuest extra guest percentage...');
    
    try {
      const response = await axios.put(`admin/hyperguest/properties/${propertyCode}/extra-guest-percentage`, {
        extra_guest_percentage: percentage
      });
      
      if (response.data.statusCode === 200) {
        toast.success('HyperGuest extra guest percentage updated successfully');
        // Update local state
        if (hyperguestProperty) {
          setHyperguestProperty({ ...hyperguestProperty, extra_guest_percentage: percentage });
        }
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update percentage');
      }
    } catch (error: any) {
      console.error('Error updating HyperGuest percentage:', error);
      toast.error(error.response?.data?.message || 'Failed to update HyperGuest percentage');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const configureOTA = async () => {
    setIsProcessing(true);
    setProcessingMessage('Configuring OTA settings...');
    
    try {
      const config = {
        agoda_enabled: !!propertyForm.agoda_property_id,
        hyperguest_enabled: !!propertyForm.hyperguest_property_id,
        agoda_property_id: propertyForm.agoda_property_id,
        hyperguest_property_code: propertyForm.hyperguest_property_id
      };

      const response = await axios.put(`admin/properties/${propertyForm.agoda_property_id}/ota-config`, config);
      
      if (response.data.statusCode === 200) {
        toast.success('OTA configuration completed successfully');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to configure OTA');
      }
    } catch (error: any) {
      console.error('Error configuring OTA:', error);
      toast.error(error.response?.data?.message || 'Failed to configure OTA');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Step Handlers
  // ──────────────────────────────────────────────────────────────
  const handleNextStep = async () => {
    switch (currentStep) {
      case SetupStep.PROPERTY_IDS:
        if (!propertyForm.agoda_property_id) {
          toast.error('Agoda Property ID is required');
          return;
        }
        setCurrentStep(SetupStep.AGODA_FETCH);
        break;
        
      case SetupStep.AGODA_FETCH:
        const agodaSuccess = await fetchAgodaProducts(propertyForm.agoda_property_id);
        if (agodaSuccess) {
          // Move to details step and immediately load details so UI shows data without extra click
          setCurrentStep(SetupStep.AGODA_DETAILS);
          // Fire and forget; global loader will indicate progress
          fetchAgodaDetails(propertyForm.agoda_property_id);
        }
        break;
        
      case SetupStep.AGODA_DETAILS:
        const agodaDetails = await fetchAgodaDetails(propertyForm.agoda_property_id);
        if (agodaDetails) {
          setCurrentStep(SetupStep.AGODA_PERCENTAGE);
        }
        break;
        
      case SetupStep.AGODA_PERCENTAGE:
        const percentageUpdated = await updateAgodaPercentage(propertyForm.agoda_property_id, agodaPercentage);
        if (percentageUpdated) {
          // Skip HyperGuest steps if property ID not provided
          if (propertyForm.hyperguest_property_id.trim()) {
            setCurrentStep(SetupStep.HYPERGUEST_FETCH);
          } else {
            setCurrentStep(SetupStep.OTA_CONFIG);
          }
        }
        break;
        
      case SetupStep.HYPERGUEST_FETCH:
        const hyperguestSuccess = await syncHyperguestProperty(propertyForm.hyperguest_property_id);
        if (hyperguestSuccess) {
          // Check currency after sync
          await checkHyperguestCurrency(propertyForm.hyperguest_property_id);
          setCurrentStep(SetupStep.HYPERGUEST_CURRENCY);
        }
        break;
        
      case SetupStep.HYPERGUEST_CURRENCY:
        if (!hyperguestCurrencyExists || !hyperguestCurrency) {
          if (!hyperguestCurrency || hyperguestCurrency.trim().length !== 3) {
            toast.error('Please enter a valid 3-letter currency code (e.g., USD, EUR, INR)');
            return;
          }
          const currencyUpdated = await updateHyperguestCurrency(propertyForm.hyperguest_property_id, hyperguestCurrency);
          if (!currencyUpdated) {
            return;
          }
        }
        setCurrentStep(SetupStep.HYPERGUEST_DETAILS);
        fetchHyperguestDetails(propertyForm.hyperguest_property_id);
        break;
        
      case SetupStep.HYPERGUEST_DETAILS:
        const hyperguestDetails = await fetchHyperguestDetails(propertyForm.hyperguest_property_id);
        if (hyperguestDetails) {
          setCurrentStep(SetupStep.HYPERGUEST_PERCENTAGE);
        }
        break;
        
      case SetupStep.HYPERGUEST_PERCENTAGE:
        const hyperguestUpdated = await updateHyperguestPercentage(propertyForm.hyperguest_property_id, hyperguestPercentage);
        if (hyperguestUpdated) {
          setCurrentStep(SetupStep.OTA_CONFIG);
        }
        break;
        
      case SetupStep.OTA_CONFIG:
        const otaConfigured = await configureOTA();
        if (otaConfigured) {
          setCurrentStep(SetupStep.COMPLETE);
        }
        break;
        
      case SetupStep.COMPLETE:
        resetModal();
        await fetchProperties();
        break;
    }
  };

  const resetModal = () => {
    setIsSetupModalOpen(false);
    setIsEditMode(false);
    setCurrentStep(SetupStep.PROPERTY_IDS);
    setPropertyForm({
      agoda_property_id: '',
      hyperguest_property_id: ''
    });
    setAgodaProperty(null);
    setHyperguestProperty(null);
    setAgodaDetails(null);
    setHyperguestDetails(null);
    setAgodaPercentage(0);
    setHyperguestPercentage(0);
    setHyperguestCurrency('');
    setHyperguestCurrencyExists(false);
    setIsProcessing(false);
    setProcessingMessage('');
  };

  const resetViewModals = () => {
    setIsAgodaDetailsModalOpen(false);
    setIsHyperguestDetailsModalOpen(false);
    setViewAgodaProperty(null);
    setViewAgodaDetails(null);
    setViewHyperguestProperty(null);
    setViewHyperguestDetails(null);
  };

  // ──────────────────────────────────────────────────────────────
  // • Helper Functions
  // ──────────────────────────────────────────────────────────────
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredProperties = properties.filter(property =>
    property.property_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (property.hyperguest_property_code && property.hyperguest_property_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Edit property function
  const handleEditProperty = (property: Property) => {
    setIsEditMode(true);
    setPropertyForm({
      agoda_property_id: property.property_id,
      hyperguest_property_id: property.hyperguest_property_code || ''
    });
    setCurrentStep(SetupStep.PROPERTY_IDS);
    setIsSetupModalOpen(true);
  };

  // Delete property function
  const handleDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteConfirmationText('');
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    
    // Check if confirmation text matches property name
    if (deleteConfirmationText.trim().toLowerCase() !== propertyToDelete.agoda_property_name.trim().toLowerCase()) {
      toast.error('Property name does not match. Please type the exact property name to confirm deletion.');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Deleting property configuration...');
    
    try {
      const response = await axios.delete(`admin/properties/${propertyToDelete.property_id}/ota-config?cascade=true&include_history=true`);
      
      if (response.data.statusCode === 200) {
        toast.success('Property deleted successfully');
        setIsDeleteModalOpen(false);
        setPropertyToDelete(null);
        setDeleteConfirmationText('');
        await fetchProperties();
      } else {
        throw new Error(response.data.message || 'Failed to delete property');
      }
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(error.response?.data?.message || 'Failed to delete property');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPropertyToDelete(null);
    setDeleteConfirmationText('');
  };

  // View details functions
  const handleViewAgodaDetails = async (propertyId: string) => {
    setIsProcessing(true);
    setProcessingMessage('Loading Agoda property details...');
    try {
      const response = await axios.get(`admin/agoda/properties/${propertyId}`);
      if (response.data.STATUS === 1) {
        const details = response.data.RESULT;
        setViewAgodaProperty(details.property);
        setViewAgodaDetails(details);
        setIsAgodaDetailsModalOpen(true);
      } else {
        toast.error('Failed to load Agoda property details');
      }
    } catch (error: any) {
      console.error('Error fetching Agoda details:', error);
      toast.error('Failed to load Agoda property details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewHyperguestDetails = async (propertyCode: string) => {
    setIsProcessing(true);
    setProcessingMessage('Loading HyperGuest property details...');
    try {
      const response = await axios.get(`admin/hyperguest/properties/${propertyCode}`);
      if (response.data.STATUS === 1) {
        const details = response.data.RESULT;
        setViewHyperguestProperty(details.property);
        setViewHyperguestDetails(details);
        setIsHyperguestDetailsModalOpen(true);
      } else {
        toast.error('Failed to load HyperGuest property details');
      }
    } catch (error: any) {
      console.error('Error fetching HyperGuest details:', error);
      toast.error('Failed to load HyperGuest property details');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepTitle = (step: SetupStep) => {
    switch (step) {
      case SetupStep.PROPERTY_IDS: return 'Property IDs';
      case SetupStep.AGODA_FETCH: return 'Connect Agoda';
      case SetupStep.AGODA_DETAILS: return 'Agoda Details';
      case SetupStep.AGODA_PERCENTAGE: return 'Agoda Settings';
      case SetupStep.HYPERGUEST_FETCH: return 'Connect HyperGuest';
      case SetupStep.HYPERGUEST_DETAILS: return 'HyperGuest Details';
      case SetupStep.HYPERGUEST_CURRENCY: return 'HyperGuest Currency';
      case SetupStep.HYPERGUEST_PERCENTAGE: return 'HyperGuest Settings';
      case SetupStep.OTA_CONFIG: return 'OTA Configuration';
      case SetupStep.COMPLETE: return 'Setup Complete';
      default: return 'Setup';
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case SetupStep.PROPERTY_IDS: return 'Start Setup';
      case SetupStep.AGODA_FETCH: return 'Connect to Agoda';
      case SetupStep.AGODA_DETAILS: return 'Continue';
      case SetupStep.AGODA_PERCENTAGE: return 'Save & Continue';
      case SetupStep.HYPERGUEST_FETCH: return 'Connect to HyperGuest';
      case SetupStep.HYPERGUEST_DETAILS: return 'Continue';
      case SetupStep.HYPERGUEST_CURRENCY: return hyperguestCurrencyExists ? 'Continue' : 'Save Currency & Continue';
      case SetupStep.HYPERGUEST_PERCENTAGE: return 'Save & Continue';
      case SetupStep.OTA_CONFIG: return 'Complete Setup';
      case SetupStep.COMPLETE: return 'Finish';
      default: return 'Continue';
    }
  };

  // Show full page shimmer only on initial load
  if (initialLoading) {
    return (
      <div className="mx-auto space-y-6 p-2 md:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Shimmer className="h-8 w-48 mb-2" />
            <Shimmer className="h-4 w-64" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Shimmer className="h-10 w-full sm:w-[300px]" />
            <Shimmer className="h-10 w-32" />
          </div>
        </div>
        
        {/* Table shimmer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agoda ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HyperGuest ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OTA Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <ShimmerTableRows />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransitionWrapper>
    <div className="mx-auto space-y-6 p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Property Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage OTA property configurations and sync settings
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-0 flex-1 sm:min-w-[300px]">
            <SearchInput
              placeholder="Search properties by ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onClear={handleClearSearch}
            />
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsSetupModalOpen(true)}
            className="flex-shrink-0"
          >
            Add Property
          </Button>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agoda ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HyperGuest ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OTA Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.property_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium bg-gray-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 max-w-[250px] whitespace-pre-line overflow-hidden text-ellipsis line-clamp-2 break-words">
                        {property.agoda_property_name}
                      </div>
                        <div className="text-sm text-gray-500">
                          Multi-OTA Configuration
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {property.agoda_enabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {property.property_id}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not configured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {property.hyperguest_enabled && property.hyperguest_property_code ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {property.hyperguest_property_code}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not configured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start flex-col gap-2">
                      {property.agoda_enabled && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Agoda
                        </span>
                      )}
                      {property.hyperguest_enabled && property.hyperguest_property_code && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          HyperGuest
                        </span>
                      )}
                      {!property.agoda_enabled && !property.hyperguest_enabled && (
                        <span className="text-sm text-gray-400">No platforms</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(property.updated_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-2">
                      {/* OTA Buttons Row */}
                      <div className="flex items-center space-x-2">
                        {property.agoda_enabled && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Globe size={14} />}
                            onClick={() => handleViewAgodaDetails(property.property_id)}
                            disabled={isProcessing}
                          >
                            Agoda
                          </Button>
                        )}
                        {property.hyperguest_enabled && property.hyperguest_property_code && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Globe size={14} />}
                            onClick={() => handleViewHyperguestDetails(property.hyperguest_property_code!)}
                            disabled={isProcessing}
                          >
                            HyperGuest
                          </Button>
                        )}
                        {!property.agoda_enabled && !property.hyperguest_enabled && (
                          <span className="text-xs text-gray-400">No OTA configured</span>
                        )}
                      </div>
                      
                      {/* Edit/Delete Buttons Row */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Edit size={14} />}
                          onClick={() => handleEditProperty(property)}
                          disabled={isProcessing}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => handleDeleteProperty(property)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'No properties match your search criteria.' : 'Get started by adding your first property.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Setup Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={resetModal}
        title={`${isEditMode ? 'Edit' : 'Add'} Property - ${getStepTitle(currentStep)}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress Bar - Desktop */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
            {[
              SetupStep.PROPERTY_IDS,
              SetupStep.AGODA_FETCH,
              SetupStep.AGODA_DETAILS,
              SetupStep.AGODA_PERCENTAGE,
              SetupStep.HYPERGUEST_FETCH,
              SetupStep.HYPERGUEST_CURRENCY,
              SetupStep.HYPERGUEST_DETAILS,
              SetupStep.HYPERGUEST_PERCENTAGE,
              SetupStep.OTA_CONFIG,
              SetupStep.COMPLETE
            ].map((step, index, steps) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  steps.indexOf(currentStep) > index
                    ? 'bg-gray-700 border-gray-700 text-white'
                    : steps.indexOf(currentStep) === index
                    ? 'border-gray-700 text-gray-700'
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {steps.indexOf(currentStep) > index ? <Check size={16} /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    steps.indexOf(currentStep) > index ? 'bg-gray-700' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress Bar - Mobile */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Step {[
                  SetupStep.PROPERTY_IDS,
                  SetupStep.AGODA_FETCH,
                  SetupStep.AGODA_DETAILS,
                  SetupStep.AGODA_PERCENTAGE,
                  SetupStep.HYPERGUEST_FETCH,
                  SetupStep.HYPERGUEST_CURRENCY,
                  SetupStep.HYPERGUEST_DETAILS,
                  SetupStep.HYPERGUEST_PERCENTAGE,
                  SetupStep.OTA_CONFIG,
                  SetupStep.COMPLETE
                ].indexOf(currentStep) + 1} of 10
              </span>
              <span className="text-xs text-gray-500">{getStepTitle(currentStep)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${([
                    SetupStep.PROPERTY_IDS,
                    SetupStep.AGODA_FETCH,
                    SetupStep.AGODA_DETAILS,
                    SetupStep.AGODA_PERCENTAGE,
                    SetupStep.HYPERGUEST_FETCH,
                    SetupStep.HYPERGUEST_CURRENCY,
                    SetupStep.HYPERGUEST_DETAILS,
                    SetupStep.HYPERGUEST_PERCENTAGE,
                    SetupStep.OTA_CONFIG,
                    SetupStep.COMPLETE
                  ].indexOf(currentStep) + 1) * 10}%` 
                }}
              />
            </div>
          </div>

          {/* Step Content */}
          {currentStep === SetupStep.PROPERTY_IDS && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isEditMode ? 'Update Property IDs' : 'Enter Property IDs'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isEditMode 
                    ? 'Update the property IDs for Agoda and HyperGuest. You can add HyperGuest configuration if not previously set.'
                    : 'Provide the property ID for Agoda (required). HyperGuest property ID is optional.'
                  }
                </p>
              </div>
              
              {isEditMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    You are editing an existing property. Changes will update the configuration.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Agoda Property ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={propertyForm.agoda_property_id}
                  onChange={(e) => setPropertyForm({ ...propertyForm, agoda_property_id: e.target.value })}
                  placeholder="Enter Agoda property ID"
                  required
                  disabled={isEditMode}
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Agoda Property ID cannot be changed for existing properties
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 inline mr-1" />
                  HyperGuest Property ID <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <Input
                  type="text"
                  value={propertyForm.hyperguest_property_id}
                  onChange={(e) => setPropertyForm({ ...propertyForm, hyperguest_property_id: e.target.value })}
                  placeholder="Enter HyperGuest property ID (optional)"
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    {propertyForm.hyperguest_property_id 
                      ? 'Update or remove HyperGuest integration'
                      : 'Add HyperGuest integration to this property'
                    }
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === SetupStep.AGODA_FETCH && (
            <div className="space-y-4">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">Connect to Agoda</h3>
                <p className="text-sm text-gray-600">
                  We'll fetch all property data from Agoda including rooms, rate plans, and pricing information.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Agoda Property ID</p>
                    <p className="text-sm text-gray-500">{propertyForm.agoda_property_id}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {currentStep === SetupStep.AGODA_DETAILS && agodaProperty && agodaDetails && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Agoda Property Details</h3>
                <p className="text-sm text-gray-600">
                  Property data has been successfully retrieved from Agoda. Please review the details below.
                </p>
              </div>
              
              {/* Property Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">{agodaProperty.name}</h4>
                      <p className="text-sm text-gray-500">Agoda Property #{agodaProperty.agoda_property_id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    agodaProperty.is_active ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {agodaProperty.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{agodaProperty.currency}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Globe className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Language</p>
                    <p className="text-sm font-medium text-gray-900">{agodaProperty.language || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Percent className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Extra Guest %</p>
                    <p className="text-sm font-medium text-gray-900">{agodaProperty.extra_guest_percentage}%</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(agodaProperty.last_synced_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Bed className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{agodaDetails.summary?.total_rooms || agodaDetails.rooms?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Rooms</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{agodaDetails.summary?.total_rateplans || agodaDetails.rateplans?.length || 0}</p>
                  <p className="text-xs text-gray-500">Rate Plans</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Settings className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{agodaDetails.summary?.total_products || 0}</p>
                  <p className="text-xs text-gray-500">Products</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Globe className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{agodaDetails.summary?.total_channels || 0}</p>
                  <p className="text-xs text-gray-500">Channels</p>
                </div>
              </div>

              {/* Room Types Preview */}
              {agodaDetails.rooms && agodaDetails.rooms.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Bed className="h-4 w-4 mr-2" />
                    Room Types ({agodaDetails.rooms.length})
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {agodaDetails.rooms.map((room: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{room.room_name}</span>
                        <span className="text-gray-500">
                          {room.num_persons} pax • {room.num_rooms} rooms
                        </span>
                      </div>
                    ))}
                    
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === SetupStep.AGODA_PERCENTAGE && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Agoda Extra Guest Percentage</h3>
                <p className="text-sm text-gray-600">
                  Set the extra guest percentage for this Agoda property.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Percent className="h-4 w-4 inline mr-1" />
                  Extra Guest Percentage
                </label>
                <Input
                  type="number"
                  value={agodaPercentage}
                  onChange={(e) => setAgodaPercentage(Number(e.target.value))}
                  placeholder="Enter percentage (e.g., 15)"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current value: {agodaProperty?.extra_guest_percentage || 0}%
                </p>
              </div>
            </div>
          )}

          {/* HyperGuest Steps */}
          {currentStep === SetupStep.HYPERGUEST_FETCH && (
            <div className="space-y-4">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">Connect to HyperGuest</h3>
                <p className="text-sm text-gray-600">
                  We'll sync all property data from HyperGuest including room types and rate plans.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">HyperGuest Property Code</p>
                    <p className="text-sm text-gray-500">{propertyForm.hyperguest_property_id}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {currentStep === SetupStep.HYPERGUEST_DETAILS && hyperguestProperty && hyperguestDetails && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">HyperGuest Property Details</h3>
                <p className="text-sm text-gray-600">
                  Property data has been successfully synced from HyperGuest. Please review the details below.
                </p>
              </div>
              
              {/* Property Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">{hyperguestProperty.name}</h4>
                      <p className="text-sm text-gray-500">HyperGuest Property #{hyperguestProperty.hyperguest_property_code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    hyperguestProperty.is_active ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {hyperguestProperty.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{hyperguestProperty.currency}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Globe className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Language</p>
                    <p className="text-sm font-medium text-gray-900">{hyperguestProperty.language || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Percent className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Extra Guest %</p>
                    <p className="text-sm font-medium text-gray-900">{hyperguestProperty.extra_guest_percentage}%</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(hyperguestProperty.last_synced_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Bed className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{hyperguestDetails.summary?.totalRooms || hyperguestDetails.rooms?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Rooms</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{hyperguestDetails.summary?.totalRatePlans || hyperguestDetails.ratePlans?.length || 0}</p>
                  <p className="text-xs text-gray-500">Rate Plans</p>
                </div>
              </div>

              {/* Room Types Preview */}
              {hyperguestDetails.rooms && hyperguestDetails.rooms.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Bed className="h-4 w-4 mr-2" />
                    Room Types ({hyperguestDetails.rooms.length})
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {hyperguestDetails.rooms.map((room: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{room.room_name}</span>
                        <span className="text-gray-500">
                          Code: {room.room_type_code}
                        </span>
                      </div>
                    ))}
                  
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === SetupStep.HYPERGUEST_CURRENCY && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">HyperGuest Property Currency</h3>
                <p className="text-sm text-gray-600">
                  {hyperguestCurrencyExists 
                    ? 'Currency is already configured for this property.'
                    : 'Please set the currency code for this HyperGuest property.'
                  }
                </p>
              </div>
              
              {hyperguestCurrencyExists ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-700 mr-2" />
                      <span className="font-medium">Current Currency</span>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-white">
                      {hyperguestCurrency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The currency is already set. You can proceed to the next step.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">
                          Currency Not Configured
                        </h4>
                        <p className="text-sm text-yellow-700">
                          This HyperGuest property does not have a currency set. Please add a valid 3-letter currency code to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Currency Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={hyperguestCurrency}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        if (value.length <= 3) {
                          setHyperguestCurrency(value);
                        }
                      }}
                      placeholder="e.g., USD, EUR, INR"
                      maxLength={3}
                      className="uppercase"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a valid 3-letter ISO currency code (e.g., USD for US Dollar, EUR for Euro, INR for Indian Rupee)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === SetupStep.HYPERGUEST_PERCENTAGE && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">HyperGuest Extra Guest Percentage</h3>
                <p className="text-sm text-gray-600">
                  Set the extra guest percentage for this HyperGuest property.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Percent className="h-4 w-4 inline mr-1" />
                  Extra Guest Percentage
                </label>
                <Input
                  type="number"
                  value={hyperguestPercentage}
                  onChange={(e) => setHyperguestPercentage(Number(e.target.value))}
                  placeholder="Enter percentage (e.g., 15)"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current value: {hyperguestProperty?.extra_guest_percentage || 0}%
                </p>
              </div>
            </div>
          )}

          {currentStep === SetupStep.OTA_CONFIG && (
            <div className="space-y-4">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">Final Configuration</h3>
                <p className="text-sm text-gray-600">
                  We'll now configure the OTA settings to complete the property setup.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-700 mr-2" />
                    <span className="font-medium">Agoda Integration</span>
                  </div>
                  <span className="text-sm text-gray-500">{propertyForm.agoda_property_id}</span>
                </div>
                
                {propertyForm.hyperguest_property_id && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-700 mr-2" />
                      <span className="font-medium">HyperGuest Integration</span>
                    </div>
                    <span className="text-sm text-gray-500">{propertyForm.hyperguest_property_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === SetupStep.COMPLETE && (
            <div className="space-y-4 text-center">
              <div>
                <CheckCircle className="mx-auto h-16 w-16 text-gray-700" />
                <h3 className="text-xl font-medium text-gray-900 mt-4">Setup Complete!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your property has been successfully configured with the selected OTA platforms.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Agoda Property:</span>
                    <span className="text-sm text-gray-900">{propertyForm.agoda_property_id}</span>
                  </div>
                  {propertyForm.hyperguest_property_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">HyperGuest Property:</span>
                      <span className="text-sm text-gray-900">{propertyForm.hyperguest_property_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Configuration Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-6">
              <Loader className="mx-auto h-8 w-8 text-gray-600 animate-spin" />
              <p className="text-sm text-gray-600 mt-2">{processingMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={resetModal}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleNextStep}
              isLoading={isProcessing}
              disabled={isProcessing}
              leftIcon={currentStep === SetupStep.COMPLETE ? <Check size={16} /> : <ArrowRight size={16} />}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Agoda Details Modal */}
      <Modal
        isOpen={isAgodaDetailsModalOpen}
        onClose={resetViewModals}
        title="Agoda Property Details"
        size="lg"
      >
        <div className="space-y-6">
          {isProcessing && (
            <div className="text-center py-6">
              <Loader className="mx-auto h-8 w-8 text-gray-600 animate-spin" />
              <p className="text-sm text-gray-600 mt-2">{processingMessage}</p>
            </div>
          )}
          
          {!isProcessing && viewAgodaProperty && viewAgodaDetails && (
            <>
              {/* Property Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">{viewAgodaProperty.name}</h4>
                      <p className="text-sm text-gray-500">Agoda Property #{viewAgodaProperty.agoda_property_id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    viewAgodaProperty.is_active ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {viewAgodaProperty.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{viewAgodaProperty.currency}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Globe className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Language</p>
                    <p className="text-sm font-medium text-gray-900">{viewAgodaProperty.language || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Percent className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Extra Guest %</p>
                    <p className="text-sm font-medium text-gray-900">{viewAgodaProperty.extra_guest_percentage}%</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(viewAgodaProperty.last_synced_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Bed className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewAgodaDetails.summary?.total_rooms || viewAgodaDetails.rooms?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Rooms</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewAgodaDetails.summary?.total_rateplans || viewAgodaDetails.rateplans?.length || 0}</p>
                  <p className="text-xs text-gray-500">Rate Plans</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Settings className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewAgodaDetails.summary?.total_products || 0}</p>
                  <p className="text-xs text-gray-500">Products</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Globe className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewAgodaDetails.summary?.total_channels || 0}</p>
                  <p className="text-xs text-gray-500">Channels</p>
                </div>
              </div>

              {/* Room Types Preview */}
              {viewAgodaDetails.rooms && viewAgodaDetails.rooms.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Bed className="h-4 w-4 mr-2" />
                    Room Types ({viewAgodaDetails.rooms.length})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewAgodaDetails.rooms.map((room: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{room.room_name}</span>
                        <span className="text-gray-500">
                          {room.num_persons} pax • {room.num_rooms} rooms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Delete Property Configuration"
        size="md"
      >
        <div className="space-y-6">
          {propertyToDelete && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Warning: This action cannot be undone
                    </h3>
                    <p className="text-sm text-red-700">
                      This will permanently delete the OTA configuration for this property. All associated mappings and settings will be removed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Property Details:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Property Name:</span>
                      <span className="text-sm font-medium text-gray-900">{propertyToDelete.agoda_property_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Agoda ID:</span>
                      <span className="text-sm font-medium text-gray-900">{propertyToDelete.property_id}</span>
                    </div>
                    {propertyToDelete.hyperguest_property_code && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">HyperGuest ID:</span>
                        <span className="text-sm font-medium text-gray-900">{propertyToDelete.hyperguest_property_code}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To confirm deletion, type the property name exactly as shown above:
                  </label>
                  <Input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder={propertyToDelete.agoda_property_name}
                    className="w-full"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Property name: <span className="font-medium">{propertyToDelete.agoda_property_name}</span>
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="text-center py-4">
                  <Loader className="mx-auto h-8 w-8 text-red-600 animate-spin" />
                  <p className="text-sm text-gray-600 mt-2">{processingMessage}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelDelete}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={confirmDeleteProperty}
                  isLoading={isProcessing}
                  disabled={isProcessing || deleteConfirmationText.trim().toLowerCase() !== propertyToDelete.agoda_property_name.trim().toLowerCase()}
                  leftIcon={<Trash2 size={16} />}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  Delete Property
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* HyperGuest Details Modal */}
      <Modal
        isOpen={isHyperguestDetailsModalOpen}
        onClose={resetViewModals}
        title="HyperGuest Property Details"
        size="lg"
      >
        <div className="space-y-6">
          {isProcessing && (
            <div className="text-center py-6">
              <Loader className="mx-auto h-8 w-8 text-gray-600 animate-spin" />
              <p className="text-sm text-gray-600 mt-2">{processingMessage}</p>
            </div>
          )}
          
          {!isProcessing && viewHyperguestProperty && viewHyperguestDetails && (
            <>
              {/* Property Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">{viewHyperguestProperty.name}</h4>
                      <p className="text-sm text-gray-500">HyperGuest Property #{viewHyperguestProperty.hyperguest_property_code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    viewHyperguestProperty.is_active ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {viewHyperguestProperty.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{viewHyperguestProperty.currency}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Globe className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Language</p>
                    <p className="text-sm font-medium text-gray-900">{viewHyperguestProperty.language || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Percent className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Extra Guest %</p>
                    <p className="text-sm font-medium text-gray-900">{viewHyperguestProperty.extra_guest_percentage}%</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(viewHyperguestProperty.last_synced_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Bed className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewHyperguestDetails.summary?.totalRooms || viewHyperguestDetails.rooms?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Rooms</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{viewHyperguestDetails.summary?.totalRatePlans || viewHyperguestDetails.ratePlans?.length || 0}</p>
                  <p className="text-xs text-gray-500">Rate Plans</p>
                </div>
              </div>

              {/* Room Types Preview */}
              {viewHyperguestDetails.rooms && viewHyperguestDetails.rooms.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Bed className="h-4 w-4 mr-2" />
                    Room Types ({viewHyperguestDetails.rooms.length})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewHyperguestDetails.rooms.map((room: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{room.room_name}</span>
                        <span className="text-gray-500">
                          Code: {room.room_type_code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
    </PageTransitionWrapper>
  );
}
