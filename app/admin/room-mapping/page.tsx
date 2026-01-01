'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../lib/axios';
import toast from 'react-hot-toast';

import {
  Building2,
  Search,
  Save,
  RefreshCw,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader,
  ArrowLeftRight,
  Settings,
  Bed,
  Star,
  Globe,
  Plus,
  Trash2,
  Edit2,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

import Input from '../../../components/UI/Input';
import Button from '../../../components/UI/Button';
import SearchInput from '../../../components/UI/SearchInput';
import Shimmer from '../../../components/UI/Shimmer';
import Modal from '../../../components/UI/Modal';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';
import Select from 'react-select';

// ──────────────────────────────────────────────────────────────
// • Interfaces
// ──────────────────────────────────────────────────────────────
interface RoomMapping {
  agoda_room_id: string;
  agoda_room_name: string;
  mapping_id: string;
  num_rooms?: number;
  is_mapped?: boolean;
  hyperguest_mappings: HyperGuestMapping[];
}

interface HyperGuestMapping {
  _id?: string;
  room_type_code: string;
  rate_plan_code: string;
  room_name: string;
  rate_plan_name: string;
  agoda_room_id: string;
  has_valid_agoda_mapping?: boolean;
  agoda_room_details?: {
    agoda_room_id: string;
    agoda_room_name: string;
    agoda_property_id?: string;
  };
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerCard = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <Shimmer className="h-6 w-48 mb-4" />
    <Shimmer className="h-4 w-full mb-2" />
    <Shimmer className="h-4 w-3/4 mb-4" />
    <Shimmer className="h-10 w-32" />
  </div>
);

export default function RoomMapping() {
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [agodaPropertyId, setAgodaPropertyId] = useState('');
  const [propertyOptions, setPropertyOptions] = useState<Array<{value: string, label: string}>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Room mappings
  const [roomMappings, setRoomMappings] = useState<RoomMapping[]>([]);
  
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'agoda' | 'hyperguest'>('agoda');
  const [editingMapping, setEditingMapping] = useState<RoomMapping | null>(null);
  const [editingHyperguestMappingId, setEditingHyperguestMappingId] = useState<string | undefined>(undefined);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMapping, setDeleteMapping] = useState<RoomMapping | null>(null);
  const [showDeleteHyperguestModal, setShowDeleteHyperguestModal] = useState(false);
  const [deleteHyperguestData, setDeleteHyperguestData] = useState<{
    mapping: RoomMapping;
    hgMapping: HyperGuestMapping;
  } | null>(null);
  
  // Form data
  const [agodaRoomId, setAgodaRoomId] = useState('');
  const [hyperguestData, setHyperguestData] = useState({
    room_type_code: '',
    rate_plan_code: '',
    room_name: '',
    rate_plan_name: ''
  });

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPropertyOptions();
  }, []);

  useEffect(() => {
    if (agodaPropertyId.trim()) {
      fetchMappings();
    } else {
      setRoomMappings([]);
    }
  }, [agodaPropertyId]);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchPropertyOptions = async () => {
    setLoadingProperties(true);
    try {
      const response = await axios.get('admin/ota-status');
      if (response.data.success && response.data.data.configurations) {
        const options = response.data.data.configurations.map((config: any) => ({
          value: config.property_id,
          label: `${config.agoda_property_name} (ID: ${config.property_id})`
        }));
        setPropertyOptions(options);
      }
    } catch (error: any) {
      console.error("Error fetching property options:", error);
      toast.error("Failed to load property options");
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchMappings = async () => {
    if (!agodaPropertyId.trim()) return;

    setLoading(true);
    try {
      // Fetch Agoda mappings
      const agodaResponse = await axios.get(`admin/properties/${agodaPropertyId}/room-mappings`);
      
      let agodaData: any[] = [];
      if (agodaResponse.data.STATUS === 1 && agodaResponse.data.RESULT) {
        agodaData = agodaResponse.data.RESULT.rooms || [];
      }

      // Fetch HyperGuest mappings
      let hyperGuestData: any[] = [];
      try {
        const hyperGuestResponse = await axios.get(`admin/properties/${agodaPropertyId}/hyperguest-mappings`);
        if (hyperGuestResponse.data.statusCode === 200 && hyperGuestResponse.data.data) {
          hyperGuestData = hyperGuestResponse.data.data.mappings || [];
        }
      } catch (hyperGuestError: any) {
        console.log('HyperGuest not configured or no mappings found');
      }

      // Combine mappings - map Agoda rooms to their HyperGuest mappings
      const combined = agodaData.map(agoda => {
        // Find all HyperGuest mappings for this Agoda room
        const hgMappings = hyperGuestData
          .filter(hg => hg.agoda_room_id === agoda.agoda_room_id)
          .map(hg => ({
            _id: hg._id,
            room_type_code: hg.room_type_code,
            rate_plan_code: hg.rate_plan_code,
            room_name: hg.room_name,
            rate_plan_name: hg.rate_plan_name,
            agoda_room_id: hg.agoda_room_id,
            has_valid_agoda_mapping: hg.has_valid_agoda_mapping,
            agoda_room_details: hg.agoda_room_details
          }));

        return {
          agoda_room_id: agoda.agoda_room_id,
          agoda_room_name: agoda.room_name || 'Unknown Room',
          mapping_id: agoda.mapping_id,
          num_rooms: agoda.num_rooms,
          is_mapped: agoda.is_mapped,
          hyperguest_mappings: hgMappings
        };
      });

      setRoomMappings(combined);
      toast.success('Mappings loaded successfully');
    } catch (error: any) {
      console.error('Error fetching mappings:', error);
      toast.error('Failed to load mappings');
      setRoomMappings([]);
    } finally {
      setLoading(false);
    }
  };

  const createAgodaMapping = async (roomId: string) => {
    try {
      const response = await axios.post(
        `admin/properties/${agodaPropertyId}/room-mappings/bulk`,
        {
          mappings: [{ agoda_room_id: roomId }]
        }
      );
      
      if (response.data.STATUS === 1 && response.data.RESULT.success.length > 0) {
        return response.data.RESULT.success[0];
      }
      throw new Error('Failed to create Agoda mapping');
    } catch (error: any) {
      console.error('Error creating Agoda mapping:', error);
      const msg = error.response?.data?.MESSAGE || 'Failed to create Agoda mapping';
      toast.error(msg);
      throw error;
    }
  };

  const createHyperguestMapping = async (data: any) => {
    try {
      const response = await axios.post(
        `admin/properties/${agodaPropertyId}/hyperguest-mappings/bulk`,
        {
          mappings: [{
            room_type_code: data.room_type_code,
            rate_plan_code: data.rate_plan_code,
            room_name: data.room_name,
            rate_plan_name: data.rate_plan_name,
            agoda_room_id: data.agoda_room_id
          }]
        }
      );
      
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        return response.data.data.success[0];
      }
      throw new Error('Failed to create HyperGuest mapping');
    } catch (error: any) {
      console.error('Error creating HyperGuest mapping:', error);
      const msg = error.response?.data?.message || 'Failed to create HyperGuest mapping';
      toast.error(msg);
      throw error;
    }
  };

  const deleteAgodaMapping = async (mappingId: string) => {
    try {
      await axios.delete(`admin/properties/${agodaPropertyId}/room-mappings/${mappingId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting Agoda mapping:', error);
      toast.error('Failed to delete Agoda mapping');
      return false;
    }
  };

  const deleteHyperguestMapping = async (mappingId: string) => {
    try {
      await axios.delete(`admin/properties/${agodaPropertyId}/hyperguest-mappings/${mappingId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting HyperGuest mapping:', error);
      toast.error('Failed to delete HyperGuest mapping');
      return false;
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Event Handlers
  // ──────────────────────────────────────────────────────────────
  const handleAddMapping = () => {
    setEditingMapping(null);
    setEditingHyperguestMappingId(undefined);
    setModalStep('agoda');
    setAgodaRoomId('');
    setHyperguestData({
      room_type_code: '',
      rate_plan_code: '',
      room_name: '',
      rate_plan_name: ''
    });
    setShowModal(true);
  };

  const handleEditMapping = (mapping: RoomMapping, hyperguestMapping: HyperGuestMapping) => {
    setEditingMapping(mapping);
    setEditingHyperguestMappingId(hyperguestMapping._id);
    setModalStep('hyperguest');
    setAgodaRoomId(mapping.agoda_room_id);
    setHyperguestData({
      room_type_code: hyperguestMapping.room_type_code,
      rate_plan_code: hyperguestMapping.rate_plan_code,
      room_name: hyperguestMapping.room_name,
      rate_plan_name: hyperguestMapping.rate_plan_name
    });
    setShowModal(true);
  };

  const handleNextStep = () => {
    if (!agodaRoomId.trim()) {
      toast.error('Please enter Agoda Room ID');
      return;
    }
    setModalStep('hyperguest');
  };

  const handleBackStep = () => {
    setModalStep('agoda');
  };

  const handleSaveMapping = async () => {
    if (!agodaPropertyId.trim()) {
      toast.error('Please select a property');
      return;
    }

    if (!agodaRoomId.trim()) {
      toast.error('Agoda Room ID is required');
      return;
    }

    if (!hyperguestData.room_type_code.trim() || !hyperguestData.rate_plan_code.trim()) {
      toast.error('Room Type Code and Rate Plan Code are required');
      return;
    }

    setSaving(true);
    try {
      if (editingMapping && editingHyperguestMappingId) {
        // Update: Create new mapping first, then delete old one if successful
        // Create new mapping first
        await createHyperguestMapping({
          ...hyperguestData,
          agoda_room_id: agodaRoomId
        });
        
        // Only delete old mapping if creation was successful
        await deleteHyperguestMapping(editingHyperguestMappingId);
        
        toast.success('Mapping updated successfully');
      } else {
        // Create: First create Agoda mapping, then HyperGuest
        await createAgodaMapping(agodaRoomId);
        await createHyperguestMapping({
          ...hyperguestData,
          agoda_room_id: agodaRoomId
        });
        
        toast.success('Mapping created successfully');
      }

      setShowModal(false);
      setEditingHyperguestMappingId(undefined);
      await fetchMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      // If creation failed and we have an old mapping, it remains intact
      // No need to do anything - the old mapping is still there
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = (mapping: RoomMapping) => {
    setDeleteMapping(mapping);
    setShowDeleteModal(true);
  };

  const confirmDeleteMapping = async () => {
    if (!deleteMapping) return;

    setSaving(true);
    try {
      // Delete all HyperGuest mappings first
      for (const hg of deleteMapping.hyperguest_mappings) {
        if (hg._id) {
          await deleteHyperguestMapping(hg._id);
        }
      }

      // Delete Agoda mapping
      await deleteAgodaMapping(deleteMapping.mapping_id);

      toast.success('Mapping deleted successfully');
      await fetchMappings();
      setShowDeleteModal(false);
      setDeleteMapping(null);
    } catch (error) {
      console.error('Error deleting mapping:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHyperguestMapping = (mapping: RoomMapping, hgMapping: HyperGuestMapping) => {
    if (!hgMapping._id) return;
    setDeleteHyperguestData({ mapping, hgMapping });
    setShowDeleteHyperguestModal(true);
  };

  const confirmDeleteHyperguestMapping = async () => {
    if (!deleteHyperguestData || !deleteHyperguestData.hgMapping._id) return;

    setSaving(true);
    try {
      await deleteHyperguestMapping(deleteHyperguestData.hgMapping._id);
      toast.success('HyperGuest mapping deleted');
      await fetchMappings();
      setShowDeleteHyperguestModal(false);
      setDeleteHyperguestData(null);
    } catch (error) {
      console.error('Error deleting HyperGuest mapping:', error);
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Helper Functions
  // ──────────────────────────────────────────────────────────────
  const filteredMappings = roomMappings.filter(mapping =>
    mapping.agoda_room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.agoda_room_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '42px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827',
      fontSize: '14px'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#f3f4f6' 
        : state.isFocused 
          ? '#f9fafb' 
          : 'white',
      color: state.isSelected ? '#111827' : '#111827',
      fontSize: '14px',
      padding: '8px 12px'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999
    })
  };

  // ──────────────────────────────────────────────────────────────
  // • Render
  // ──────────────────────────────────────────────────────────────
  if (loading && roomMappings.length === 0) {
    return (
      <div className="mx-auto space-y-6 p-2 md:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Shimmer className="h-8 w-48 mb-2" />
            <Shimmer className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <ShimmerCard key={i} />)}
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
            <h1 className="text-2xl font-semibold text-gray-900">Room Mapping</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure room mappings between Agoda and HyperGuest platforms
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="min-w-0 flex-1 sm:min-w-[300px]">
              <SearchInput
                placeholder="Search room mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
          </div>
        </div>

        {/* Property Selection */}
        <div className="">
          <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-end gap-4">
            <div className="flex-1 max-w-md">
              <Select
                instanceId="property-select"
                value={propertyOptions.find(option => option.value === agodaPropertyId) || null}
                onChange={(selectedOption) => setAgodaPropertyId(selectedOption?.value || "")}
                options={propertyOptions}
                placeholder="Select Property..."
                isSearchable
                isLoading={loadingProperties}
                styles={customSelectStyles}
                className="w-full"
                classNamePrefix="react-select"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={fetchMappings}
                disabled={!agodaPropertyId.trim() || loading}
                leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                onClick={handleAddMapping}
                disabled={!agodaPropertyId.trim()}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Room Mapping
              </Button>
            </div>
          </div>
        </div>

        {/* Mappings Grid */}
        {filteredMappings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMappings.map((mapping, index) => (
              <div
                key={mapping.mapping_id || `mapping-${mapping.agoda_room_id}-${index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {mapping.agoda_room_name}
                      </h3>
                      {mapping.is_mapped && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      ID: {mapping.agoda_room_id}
                    </p>
                    {mapping.num_rooms !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">
                        {mapping.num_rooms} room{mapping.num_rooms !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeleteMapping(mapping)}
                    leftIcon={<Trash2 className="h-3 w-3" />}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      HyperGuest Mappings
                    </span>
                    <span className="text-xs text-gray-500">
                      {mapping.hyperguest_mappings.length} mapping(s)
                    </span>
                  </div>

                  {mapping.hyperguest_mappings.length > 0 ? (
                    <div className="space-y-2">
                      {mapping.hyperguest_mappings.map((hg, idx) => (
                        <div
                          key={hg._id || `hg-${mapping.agoda_room_id}-${hg.room_type_code}-${hg.rate_plan_code}-${idx}`}
                          className="bg-gray-50 rounded p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {hg.room_type_code} - {hg.rate_plan_code}
                                </p>
                                {hg.has_valid_agoda_mapping && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <CheckCircle className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {hg.room_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {hg.rate_plan_name}
                              </p>
                              {hg.agoda_room_details && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Agoda: {hg.agoda_room_details.agoda_room_name || hg.agoda_room_details.agoda_room_id}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditMapping(mapping, hg)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                disabled={saving}
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteHyperguestMapping(mapping, hg)}
                                className="text-red-600 hover:text-red-800 p-1"
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500">No HyperGuest mappings</p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setEditingMapping(mapping);
                          setEditingHyperguestMappingId(undefined);
                          setModalStep('hyperguest');
                          setAgodaRoomId(mapping.agoda_room_id);
                          setHyperguestData({
                            room_type_code: '',
                            rate_plan_code: '',
                            room_name: '',
                            rate_plan_name: ''
                          });
                          setShowModal(true);
                        }}
                        leftIcon={<Plus className="h-3 w-3" />}
                        className="mt-2 align-middle"
                      >
                        Add Mapping
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : agodaPropertyId ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Mappings Found</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get started by adding your first room mapping.
            </p>
            <Button
              variant="primary"
              onClick={handleAddMapping}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Room Mapping
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
            <p className="text-sm text-gray-600">
              Choose an Agoda property to view and manage room mappings.
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingHyperguestMappingId(undefined);
          }}
          title={editingMapping ? 'Edit Room Mapping' : 'Add Room Mapping'}
          size="lg"
          hideDefaultButtons={true}
        >
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className={`flex items-center ${modalStep === 'agoda' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  modalStep === 'agoda' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {modalStep === 'agoda' ? '1' : <CheckCircle className="h-5 w-5" />}
                </div>
                <span className="ml-2 text-sm font-medium">Agoda Room</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className={`flex items-center ${modalStep === 'hyperguest' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  modalStep === 'hyperguest' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">HyperGuest Details</span>
              </div>
            </div>

            {/* Agoda Step */}
            {modalStep === 'agoda' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agoda Room ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={agodaRoomId}
                    onChange={(e) => setAgodaRoomId(e.target.value)}
                    placeholder="Enter Agoda Room ID (e.g., 847126877)"
                    disabled={!!editingMapping}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The unique room identifier from Agoda
                  </p>
                </div>
              </div>
            )}

            {/* HyperGuest Step */}
            {modalStep === 'hyperguest' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Agoda Room ID:</strong> {agodaRoomId}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={hyperguestData.room_type_code}
                      onChange={(e) => setHyperguestData({...hyperguestData, room_type_code: e.target.value})}
                      placeholder="e.g., Room-01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Plan Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={hyperguestData.rate_plan_code}
                      onChange={(e) => setHyperguestData({...hyperguestData, rate_plan_code: e.target.value})}
                      placeholder="e.g., EP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <Input
                    type="text"
                    value={hyperguestData.room_name}
                    onChange={(e) => setHyperguestData({...hyperguestData, room_name: e.target.value})}
                    placeholder="e.g., Standard Room"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Plan Name
                  </label>
                  <Input
                    type="text"
                    value={hyperguestData.rate_plan_name}
                    onChange={(e) => setHyperguestData({...hyperguestData, rate_plan_name: e.target.value})}
                    placeholder="e.g., Room only"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between">
              <div>
                {modalStep === 'hyperguest' && !editingMapping && (
                  <Button
                    variant="secondary"
                    onClick={handleBackStep}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingHyperguestMappingId(undefined);
                  }}
                >
                  Cancel
                </Button>
                {modalStep === 'agoda' ? (
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSaveMapping}
                    disabled={saving}
                    isLoading={saving}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    {editingMapping ? 'Update Mapping' : 'Create Mapping'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Room Mapping Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteMapping(null);
          }}
          title="Delete Room Mapping"
          size="md"
          primaryActionLabel="Delete"
          onPrimaryAction={confirmDeleteMapping}
          isLoading={saving}
          danger={true}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete the mapping for{' '}
                  <span className="font-semibold">{deleteMapping?.agoda_room_name}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This will also delete all associated HyperGuest mappings. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete HyperGuest Mapping Modal */}
        <Modal
          isOpen={showDeleteHyperguestModal}
          onClose={() => {
            setShowDeleteHyperguestModal(false);
            setDeleteHyperguestData(null);
          }}
          title="Delete HyperGuest Mapping"
          size="md"
          primaryActionLabel="Delete"
          onPrimaryAction={confirmDeleteHyperguestMapping}
          isLoading={saving}
          danger={true}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete this HyperGuest mapping?
                </p>
                {deleteHyperguestData && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Room Type:</span> {deleteHyperguestData.hgMapping.room_type_code}
                    </p>
                    <p>
                      <span className="font-medium">Rate Plan:</span> {deleteHyperguestData.hgMapping.rate_plan_code}
                    </p>
                    <p>
                      <span className="font-medium">Room Name:</span> {deleteHyperguestData.hgMapping.room_name}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransitionWrapper>
  );
}
