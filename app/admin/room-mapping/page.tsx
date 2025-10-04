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
  Calendar,
  CreditCard,
  Percent,
  Clock,
  X
} from 'lucide-react';

import Input from '../../../components/UI/Input';
import Button from '../../../components/UI/Button';
import SearchInput from '../../../components/UI/SearchInput';
import Shimmer from '../../../components/UI/Shimmer';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';
import Select from 'react-select';

// ──────────────────────────────────────────────────────────────
// • Constants & Interfaces
// ──────────────────────────────────────────────────────────────
const predefinedRoomClasses = [
  // Standard Rooms
  {
    class_code: "STD-1",
    class_name: "Standard Room Level 1",
    category: "STD",
    level: 1,
    has_breakfast: false,
    price_formula: "X",
    description: "Base standard room"
  },
  {
    class_code: "STD-2", 
    class_name: "Standard Room Level 2",
    category: "STD",
    level: 2,
    has_breakfast: false,
    price_formula: "X+100",
    description: "Enhanced standard room"
  },
  {
    class_code: "STD-3",
    class_name: "Standard Room Level 3",
    category: "STD", 
    level: 3,
    has_breakfast: false,
    price_formula: "X+150",
    description: "Premium standard room"
  },
  // Standard Rooms with Breakfast
  {
    class_code: "STD-1-BF",
    class_name: "Standard Room Level 1 with Breakfast",
    category: "STD",
    level: 1,
    has_breakfast: true,
    price_formula: "X+200",
    description: "Base standard room with breakfast"
  },
  {
    class_code: "STD-2-BF",
    class_name: "Standard Room Level 2 with Breakfast", 
    category: "STD",
    level: 2,
    has_breakfast: true,
    price_formula: "X+250",
    description: "Enhanced standard room with breakfast"
  },
  {
    class_code: "STD-3-BF",
    class_name: "Standard Room Level 3 with Breakfast",
    category: "STD",
    level: 3,
    has_breakfast: true,
    price_formula: "X+300",
    description: "Premium standard room with breakfast"
  },
  // Deluxe Rooms
  {
    class_code: "DLX-1",
    class_name: "Deluxe Room Level 1",
    category: "DLX",
    level: 1,
    has_breakfast: false,
    price_formula: "Y=(X+200)",
    description: "Base deluxe room"
  },
  {
    class_code: "DLX-2",
    class_name: "Deluxe Room Level 2",
    category: "DLX",
    level: 2,
    has_breakfast: false,
    price_formula: "Y+100",
    description: "Enhanced deluxe room"
  },
  {
    class_code: "DLX-3",
    class_name: "Deluxe Room Level 3",
    category: "DLX",
    level: 3,
    has_breakfast: false,
    price_formula: "Y+150",
    description: "Premium deluxe room"
  },
  // Deluxe Rooms with Breakfast
  {
    class_code: "DLX-1-BF",
    class_name: "Deluxe Room Level 1 with Breakfast",
    category: "DLX",
    level: 1,
    has_breakfast: true,
    price_formula: "Y+200",
    description: "Base deluxe room with breakfast"
  },
  {
    class_code: "DLX-2-BF",
    class_name: "Deluxe Room Level 2 with Breakfast",
    category: "DLX",
    level: 2,
    has_breakfast: true,
    price_formula: "Y+250",
    description: "Enhanced deluxe room with breakfast"
  },
  {
    class_code: "DLX-3-BF",
    class_name: "Deluxe Room Level 3 with Breakfast",
    category: "DLX",
    level: 3,
    has_breakfast: true,
    price_formula: "Y+300",
    description: "Premium deluxe room with breakfast"
  }
];

interface AgodaMapping {
  agoda_room_id: string;
  mapped_class_code: string;
  room_name?: string;
  mapping_id?: string;
}

interface HyperGuestMapping {
  room_type_code: string;
  rate_plan_code: string;
  mapped_class_code: string;
  room_name: string;
  rate_plan_name: string;
  agoda_room_id: string;
  _id?: string;
}

interface MappingRow {
  class_code: string;
  class_name: string;
  category: string;
  level: number;
  has_breakfast: boolean;
  price_formula: string;
  description: string;
  agoda_room_id: string;
  agoda_mapping_id?: string;
  hyperguest_mappings: HyperGuestMapping[];
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4"><Shimmer className="h-16 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-16 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-16 w-full" /></td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

export default function RoomMapping() {
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [agodaPropertyId, setAgodaPropertyId] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Draft state for empty HyperGuest mapping per room class to avoid focus loss
  const [hyperguestDraftByClass, setHyperguestDraftByClass] = useState<Record<string, {
    room_type_code: string;
    rate_plan_code: string;
    room_name: string;
    rate_plan_name: string;
  }>>({});
  
  // Property options state
  const [propertyOptions, setPropertyOptions] = useState<Array<{value: string, label: string}>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Mapping data
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);
  const [agodaMappings, setAgodaMappings] = useState<AgodaMapping[]>([]);
  const [hyperGuestMappings, setHyperGuestMappings] = useState<HyperGuestMapping[]>([]);

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeMappingRows();
    fetchPropertyOptions();
  }, []);

  // Auto-search when property ID changes
  useEffect(() => {
    if (agodaPropertyId.trim()) {
      fetchExistingMappings();
    } else {
      initializeMappingRows();
    }
  }, [agodaPropertyId]);

  // Fetch property options from OTA status API
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

  // No auto-search side effects; search is manual-only

  // Remove automatic search on property ID change
  // useEffect(() => {
  //   if (agodaPropertyId) {
  //     fetchExistingMappings();
  //   } else {
  //     initializeMappingRows();
  //   }
  // }, [agodaPropertyId]);

  // ──────────────────────────────────────────────────────────────
  // • Initialize & Data Fetching
  // ──────────────────────────────────────────────────────────────
  const initializeMappingRows = () => {
    const initialRows: MappingRow[] = predefinedRoomClasses.map(roomClass => ({
      ...roomClass,
      agoda_room_id: '',
      hyperguest_mappings: []
    }));
    setMappingRows(initialRows);
  };

  const fetchExistingMappings = async () => {
    if (!agodaPropertyId.trim()) return;

    setInitialLoading(true);
    setLoadingMessage('Loading existing mappings...');

    try {
      // Fetch both Agoda and HyperGuest mappings
      const [agodaResponse, hyperGuestResponse] = await Promise.all([
        axios.get(`admin/properties/${agodaPropertyId}/room-mappings`),
        axios.get(`admin/properties/${agodaPropertyId}/hyperguest-mappings`)
      ]);

      // Process Agoda mappings
      if (agodaResponse.data.STATUS === 1) {
        const agodaData = agodaResponse.data.RESULT.rooms || [];
        setAgodaMappings(agodaData);
      }

      // Process HyperGuest mappings
      if (hyperGuestResponse.data.statusCode === 200) {
        const hyperGuestData = hyperGuestResponse.data.data.mappings || [];
        setHyperGuestMappings(hyperGuestData);
      }

      // Combine data into mapping rows
      combineMappingData(agodaResponse.data.RESULT?.rooms || [], hyperGuestResponse.data.data?.mappings || []);

      toast.success('Existing mappings loaded successfully');
    } catch (error: any) {
      console.error('Error fetching mappings:', error);
      toast.error('Failed to load existing mappings');
      initializeMappingRows();
    } finally {
      setInitialLoading(false);
    }
  };

  const combineMappingData = (agodaData: any[], hyperGuestData: any[]) => {
    const updatedRows: MappingRow[] = predefinedRoomClasses.map(roomClass => {
      // Find Agoda mapping for this class
      const agodaMapping = agodaData.find(item => item.mapped_class === roomClass.class_code);
      
      // Find HyperGuest mappings for this class
      const hyperGuestMappings = hyperGuestData.filter(item => item.mapped_class_code === roomClass.class_code);

      return {
        ...roomClass,
        agoda_room_id: agodaMapping?.agoda_room_id || '',
        agoda_mapping_id: agodaMapping?.mapping_id,
        hyperguest_mappings: hyperGuestMappings.map((mapping: any) => ({
          room_type_code: mapping.room_type_code || '',
          rate_plan_code: mapping.rate_plan_code || '',
          mapped_class_code: mapping.mapped_class_code || roomClass.class_code,
          room_name: mapping.room_name || '',
          rate_plan_name: mapping.rate_plan_name || '',
          agoda_room_id: mapping.agoda_room_id || '',
          _id: mapping._id
        }))
      };
    });

    setMappingRows(updatedRows);
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

  const getHyperguestDraft = (classCode: string) => {
    return hyperguestDraftByClass[classCode] || {
      room_type_code: '',
      rate_plan_code: '',
      room_name: '',
      rate_plan_name: ''
    };
  };

  const updateHyperguestDraft = (classCode: string, field: keyof ReturnType<typeof getHyperguestDraft>, value: string) => {
    setHyperguestDraftByClass(prev => ({
      ...prev,
      [classCode]: { ...getHyperguestDraft(classCode), [field]: value }
    }));
  };

  const handleManualSearch = () => {
    if (agodaPropertyId.trim()) {
      fetchExistingMappings();
    } else {
      initializeMappingRows();
    }
  };

  const filteredMappingRows = mappingRows.filter(row =>
    row.class_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Custom styles for react-select
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
  // • Event Handlers
  // ──────────────────────────────────────────────────────────────
  const updateAgodaRoomId = (classCode: string, roomId: string) => {
    setMappingRows(prev => prev.map(row => 
      row.class_code === classCode 
        ? { ...row, agoda_room_id: roomId }
        : row
    ));
  };

  // ──────────────────────────────────────────────────────────────
  // • API helpers (Delete + Create via Bulk)
  // ──────────────────────────────────────────────────────────────
  const deleteAgodaMapping = async (mappingId: string) => {
    try {
      await axios.delete(`admin/properties/${agodaPropertyId}/room-mappings/${mappingId}`);
      return true;
    } catch (e) {
      console.error('Failed to delete Agoda mapping', e);
      toast.error('Failed to delete Agoda mapping');
      return false;
    }
  };

  const deleteHyperguestMapping = async (mappingId: string) => {
    try {
      await axios.delete(`admin/properties/${agodaPropertyId}/hyperguest-mappings/${mappingId}`);
      return true;
    } catch (e) {
      console.error('Failed to delete HyperGuest mapping', e);
      toast.error('Failed to delete HyperGuest mapping');
      return false;
    }
  };

  const createAgodaMappingsBulk = async (mappings: Array<{ agoda_room_id: string; mapped_class_code: string }>) => {
    if (mappings.length === 0) return true;
    try {
      const res = await axios.post(`admin/properties/${agodaPropertyId}/room-mappings/bulk`, { mappings });
      if (res.data.STATUS === 1) {
        return true;
      }
      const msg = res.data.MESSAGE || 'Failed to create Agoda mappings';
      toast.error(msg);
      return false;
    } catch (e: any) {
      console.error('Failed to create Agoda mappings', e);
      const msg = e.response?.data?.MESSAGE || e.response?.data?.message || 'Failed to create Agoda mappings';
      toast.error(msg);
      return false;
    }
  };

  const createHyperguestMappingsBulk = async (mappings: Array<{ room_type_code: string; rate_plan_code: string; mapped_class_code: string; room_name: string; rate_plan_name: string; agoda_room_id: string }>) => {
    if (mappings.length === 0) return true;
    try {
      const res = await axios.post(`admin/properties/${agodaPropertyId}/hyperguest-mappings/bulk`, { mappings });
      // HyperGuest uses statusCode 200
      if (res.data.statusCode === 200 || res.data.statusCode === 201) return true;
      // Some responses may mirror Agoda schema
      if (res.data.STATUS === 1) return true;
      const msg = res.data.message || res.data.MESSAGE || 'Failed to create HyperGuest mappings';
      toast.error(msg);
      return false;
    } catch (e: any) {
      console.error('Failed to create HyperGuest mappings', e);
      const msg = e.response?.data?.message || e.response?.data?.MESSAGE || 'Failed to create HyperGuest mappings';
      toast.error(msg);
      return false;
    }
  };

  // Detect if a row has changed vs server for Agoda
  const agodaRowChanged = (row: MappingRow) => {
    const original = agodaMappings.find((m: any) => m.mapped_class === row.class_code);
    const originalId = original?.agoda_room_id || '';
    return (row.agoda_room_id || '') !== originalId;
  };

  // Detect if HG mapping changed vs server
  const hyperguestMappingChanged = (mapping: HyperGuestMapping) => {
    if (!mapping._id) return true; // new mapping
    const original = hyperGuestMappings.find((m: any) => m._id === mapping._id);
    if (!original) return true;
    return (
      original.room_type_code !== mapping.room_type_code ||
      original.rate_plan_code !== mapping.rate_plan_code ||
      original.mapped_class_code !== mapping.mapped_class_code ||
      (original.room_name || '') !== (mapping.room_name || '') ||
      (original.rate_plan_name || '') !== (mapping.rate_plan_name || '') ||
      (original.agoda_room_id || '') !== (mapping.agoda_room_id || '')
    );
  };

  // Update handlers
  const handleUpdateAgodaRow = async (row: MappingRow) => {
    if (!agodaPropertyId.trim()) {
      toast.error('Enter Agoda Property ID first');
      return;
    }
    if (!row.agoda_room_id.trim()) {
      toast.error('Agoda Room ID required');
      return;
    }
    setSaving(true);
    try {
      if (row.agoda_mapping_id) {
        const deleted = await deleteAgodaMapping(row.agoda_mapping_id);
        if (!deleted) {
          toast.error('Could not delete existing Agoda mapping');
          return;
        }
      }
      const ok = await createAgodaMappingsBulk([{ agoda_room_id: row.agoda_room_id, mapped_class_code: row.class_code }]);
      if (ok) {
        toast.success('Agoda mapping updated');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateHyperguestMapping = async (rowClassCode: string, mapping: HyperGuestMapping) => {
    if (!agodaPropertyId.trim()) {
      toast.error('Enter Agoda Property ID first');
      return;
    }
    if (!(mapping.room_type_code && mapping.rate_plan_code && mapping.mapped_class_code && mapping.agoda_room_id)) {
      toast.error('Fill required fields');
      return;
    }
    setSaving(true);
    try {
      if (mapping._id) {
        const deleted = await deleteHyperguestMapping(mapping._id);
        if (!deleted) {
          toast.error('Could not delete existing HyperGuest mapping');
          return;
        }
      }
      const ok = await createHyperguestMappingsBulk([{ 
        room_type_code: mapping.room_type_code,
        rate_plan_code: mapping.rate_plan_code,
        mapped_class_code: mapping.mapped_class_code,
        room_name: mapping.room_name,
        rate_plan_name: mapping.rate_plan_name,
        agoda_room_id: mapping.agoda_room_id
      }]);
      if (ok) {
        toast.success('HyperGuest mapping updated');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgodaRow = async (row: MappingRow) => {
    if (!agodaPropertyId.trim()) {
      toast.error('Enter Agoda Property ID first');
      return;
    }
    if (!row.agoda_room_id.trim()) {
      toast.error('Agoda Room ID required');
      return;
    }
    setSaving(true);
    try {
      const ok = await createAgodaMappingsBulk([{ agoda_room_id: row.agoda_room_id, mapped_class_code: row.class_code }]);
      if (ok) {
        toast.success('Agoda mapping saved');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHyperguestMapping = async (rowClassCode: string, mapping: HyperGuestMapping) => {
    if (!agodaPropertyId.trim()) {
      toast.error('Enter Agoda Property ID first');
      return;
    }
    if (!(mapping.room_type_code && mapping.rate_plan_code && mapping.mapped_class_code && mapping.agoda_room_id)) {
      toast.error('Fill required fields');
      return;
    }
    setSaving(true);
    try {
      const ok = await createHyperguestMappingsBulk([{ 
        room_type_code: mapping.room_type_code,
        rate_plan_code: mapping.rate_plan_code,
        mapped_class_code: mapping.mapped_class_code,
        room_name: mapping.room_name,
        rate_plan_name: mapping.rate_plan_name,
        agoda_room_id: mapping.agoda_room_id
      }]);
      if (ok) {
        toast.success('HyperGuest mapping saved');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgodaRow = async (row: MappingRow) => {
    if (!row.agoda_mapping_id) {
      toast.error('No existing Agoda mapping to delete');
      return;
    }
    setSaving(true);
    try {
      const ok = await deleteAgodaMapping(row.agoda_mapping_id);
      if (ok) {
        toast.success('Agoda mapping deleted');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHyperguestMapping = async (mapping: HyperGuestMapping) => {
    if (!mapping._id) {
      toast.error('No existing HyperGuest mapping to delete');
      return;
    }
    setSaving(true);
    try {
      const ok = await deleteHyperguestMapping(mapping._id);
      if (ok) {
        toast.success('HyperGuest mapping deleted');
        await fetchExistingMappings();
      }
    } finally {
      setSaving(false);
    }
  };

  const addHyperGuestMapping = (classCode: string) => {
    setMappingRows(prev => prev.map(row => 
      row.class_code === classCode 
        ? { 
            ...row, 
            hyperguest_mappings: [
              ...row.hyperguest_mappings,
              {
                room_type_code: '',
                rate_plan_code: '',
                mapped_class_code: classCode,
                room_name: '',
                rate_plan_name: '',
                agoda_room_id: row.agoda_room_id
              }
            ]
          }
        : row
    ));
  };

  const initializeHyperGuestMapping = (classCode: string) => {
    setMappingRows(prev => prev.map(row => 
      row.class_code === classCode 
        ? { 
            ...row, 
            hyperguest_mappings: row.hyperguest_mappings.length === 0 ? [{
              room_type_code: '',
              rate_plan_code: '',
              mapped_class_code: classCode,
              room_name: '',
              rate_plan_name: '',
              agoda_room_id: row.agoda_room_id
            }] : row.hyperguest_mappings
          }
        : row
    ));
  };

  const updateHyperGuestMapping = (classCode: string, index: number, field: string, value: string) => {
    setMappingRows(prev => prev.map(row => 
      row.class_code === classCode 
        ? {
            ...row,
            hyperguest_mappings: row.hyperguest_mappings.map((mapping, i) => 
              i === index 
                ? { ...mapping, [field]: value }
                : mapping
            )
          }
        : row
    ));
  };

  const removeHyperGuestMapping = (classCode: string, index: number) => {
    setMappingRows(prev => prev.map(row => 
      row.class_code === classCode 
        ? {
            ...row,
            hyperguest_mappings: row.hyperguest_mappings.filter((_, i) => i !== index)
          }
        : row
    ));
  };

  // ──────────────────────────────────────────────────────────────
  // • Save Mappings
  // ──────────────────────────────────────────────────────────────
  const saveMappings = async () => {
    if (!agodaPropertyId.trim()) {
      toast.error('Please enter Agoda Property ID');
      return;
    }

    setSaving(true);

    try {
      // Build Agoda deletes and creates
      const agodaDeletes: string[] = [];
      const agodaCreates: Array<{ agoda_room_id: string; mapped_class_code: string }> = [];
      mappingRows.forEach(row => {
        const original = agodaMappings.find((m: any) => m.mapped_class === row.class_code);
        const originalRoomId = original?.agoda_room_id || '';
        const originalMappingId = original?.mapping_id as string | undefined;
        const hasNew = !!row.agoda_room_id.trim();
        const changed = (row.agoda_room_id || '') !== originalRoomId;
        if (originalMappingId && changed) {
          agodaDeletes.push(originalMappingId);
        }
        if (hasNew && changed) {
          agodaCreates.push({ agoda_room_id: row.agoda_room_id, mapped_class_code: row.class_code });
        }
        if (!hasNew && originalMappingId) {
          agodaDeletes.push(originalMappingId);
        }
      });

      // Build HyperGuest deletes and creates
      const hyperDeletes: string[] = [];
      const hyperCreates: Array<{ room_type_code: string; rate_plan_code: string; mapped_class_code: string; room_name: string; rate_plan_name: string; agoda_room_id: string }> = [];
      mappingRows.forEach(row => {
        row.hyperguest_mappings.forEach(mapping => {
          const valid = mapping.room_type_code.trim() && mapping.rate_plan_code.trim() && row.class_code && row.agoda_room_id.trim();
          const changed = hyperguestMappingChanged(mapping);
          if (mapping._id && (!valid || changed)) {
            hyperDeletes.push(mapping._id);
          }
          if (valid && (!mapping._id || changed)) {
            hyperCreates.push({
                room_type_code: mapping.room_type_code,
                rate_plan_code: mapping.rate_plan_code,
                mapped_class_code: row.class_code,
                room_name: mapping.room_name,
                rate_plan_name: mapping.rate_plan_name,
                agoda_room_id: row.agoda_room_id
            });
          }
        });
      });

      // Execute deletes first
      await Promise.all([
        ...agodaDeletes.map(id => deleteAgodaMapping(id)),
        ...hyperDeletes.map(id => deleteHyperguestMapping(id))
      ]);

      // Then bulk create
      const createdOk = await Promise.all([
        createAgodaMappingsBulk(agodaCreates),
        createHyperguestMappingsBulk(hyperCreates)
      ]);

      if (createdOk.every(Boolean)) {
        toast.success('Mappings saved successfully');
      await fetchExistingMappings();
      } else {
        toast.error('Some mappings failed to save');
      }

    } catch (error: any) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to save mappings');
    } finally {
      setSaving(false);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HyperGuest Mappings</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Room Class</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Agoda Room ID</th>
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
            <h1 className="text-2xl font-semibold text-gray-900">Room Mapping</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure room mappings between Agoda and HyperGuest platforms
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="min-w-0 flex-1 sm:min-w-[300px]">
              <SearchInput
                placeholder="Search room classes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onClear={handleClearSearch}
              />
            </div>
          </div>
        </div>

        {/* Property ID Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Agoda Property ID
              </label>
              <Select
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
                onClick={handleManualSearch}
                disabled={!agodaPropertyId.trim() || initialLoading}
                leftIcon={<RefreshCw className={`h-4 w-4 ${initialLoading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Mapping Table */}
        {!initialLoading && filteredMappingRows.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HyperGuest Mappings
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Class
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agoda Room ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMappingRows.map((row, rowIndex) => (
                    <tr key={row.class_code} className="hover:bg-gray-50">
                      {/* HyperGuest Mappings Column */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-3">
                          {/* Always show at least one mapping form */}
                          {row.hyperguest_mappings.length === 0 ? (
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 space-y-3">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">HyperGuest Mapping</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Room Type Code
                                  </label>
                                  <Input
                                    value={getHyperguestDraft(row.class_code).room_type_code}
                                    onChange={(e) => updateHyperguestDraft(row.class_code, 'room_type_code', e.target.value)}
                                    placeholder="e.g., STD"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Rate Plan Code
                                  </label>
                                  <Input
                                    value={getHyperguestDraft(row.class_code).rate_plan_code}
                                    onChange={(e) => updateHyperguestDraft(row.class_code, 'rate_plan_code', e.target.value)}
                                    placeholder="e.g., BAR"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Room Name
                                </label>
                                <Input
                                  value={getHyperguestDraft(row.class_code).room_name}
                                  onChange={(e) => updateHyperguestDraft(row.class_code, 'room_name', e.target.value)}
                                  placeholder="Standard Room"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Rate Plan Name
                                </label>
                                <Input
                                  value={getHyperguestDraft(row.class_code).rate_plan_name}
                                  onChange={(e) => updateHyperguestDraft(row.class_code, 'rate_plan_name', e.target.value)}
                                  placeholder="Best Available Rate"
                                />
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    const d = getHyperguestDraft(row.class_code);
                                    // Push a draft mapping into state without unmounting inputs
                                    setMappingRows(prev => prev.map(r => r.class_code === row.class_code ? {
                                      ...r,
                                      hyperguest_mappings: [{
                                        room_type_code: d.room_type_code,
                                        rate_plan_code: d.rate_plan_code,
                                        mapped_class_code: row.class_code,
                                        room_name: d.room_name,
                                        rate_plan_name: d.rate_plan_name,
                                        agoda_room_id: row.agoda_room_id
                                      }]
                                    } : r));
                                    // After committing to state, trigger save flow
                                    handleSaveHyperguestMapping(row.class_code, {
                                      room_type_code: d.room_type_code,
                                      rate_plan_code: d.rate_plan_code,
                                      mapped_class_code: row.class_code,
                                      room_name: d.room_name,
                                      rate_plan_name: d.rate_plan_name,
                                      agoda_room_id: row.agoda_room_id
                                    } as any);
                                  }}
                                  leftIcon={<Save className="h-3 w-3" />}
                                  disabled={
                                    saving || (
                                      getHyperguestDraft(row.class_code).room_type_code.trim() === '' &&
                                      getHyperguestDraft(row.class_code).rate_plan_code.trim() === '' &&
                                      getHyperguestDraft(row.class_code).room_name.trim() === '' &&
                                      getHyperguestDraft(row.class_code).rate_plan_name.trim() === ''
                                    )
                                  }
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            row.hyperguest_mappings.map((mapping, mappingIndex) => (
                              <div key={mappingIndex} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {mapping.room_type_code && mapping.rate_plan_code 
                                      ? `${mapping.room_type_code} - ${mapping.rate_plan_code}` 
                                      : `Mapping #${mappingIndex + 1}`
                                    }
                                  </h4>
                                  {row.hyperguest_mappings.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => removeHyperGuestMapping(row.class_code, mappingIndex)}
                                      leftIcon={<X size={14} />}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                                
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Room Type Code
                                    </label>
                                    <Input
                                    value={mapping.room_type_code}
                                    onChange={(e) => updateHyperGuestMapping(row.class_code, mappingIndex, 'room_type_code', e.target.value)}
                                    placeholder="e.g., STD"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Rate Plan Code
                                  </label>
                                  <Input
                                    value={mapping.rate_plan_code}
                                    onChange={(e) => updateHyperGuestMapping(row.class_code, mappingIndex, 'rate_plan_code', e.target.value)}
                                    placeholder="e.g., BAR"
                                  />
                                </div>
                              </div>
                                
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Room Name
                                </label>
                                <Input
                                  value={mapping.room_name}
                                  onChange={(e) => updateHyperGuestMapping(row.class_code, mappingIndex, 'room_name', e.target.value)}
                                  placeholder="Standard Room"
                                />
                              </div>
                                
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Rate Plan Name
                                </label>
                                <Input
                                  value={mapping.rate_plan_name}
                                  onChange={(e) => updateHyperGuestMapping(row.class_code, mappingIndex, 'rate_plan_name', e.target.value)}
                                  placeholder="Best Available Rate"
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                {mapping._id ? (
                                  <>
                                <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleUpdateHyperguestMapping(row.class_code, mapping)}
                                      leftIcon={<Save className="h-3 w-3" />}
                                      disabled={saving}
                                    >
                                      Update
                                </Button>
                          <Button
                                      size="sm"
                            variant="secondary"
                                      onClick={() => handleDeleteHyperguestMapping(mapping)}
                                      leftIcon={<X className="h-3 w-3" />}
                                      disabled={saving}
                          >
                                      Delete
                          </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleSaveHyperguestMapping(row.class_code, { ...mapping, mapped_class_code: row.class_code, agoda_room_id: row.agoda_room_id })}
                                    leftIcon={<Save className="h-3 w-3" />}
                                    disabled={
                                      saving || (
                                        (mapping.room_type_code?.trim?.() || '') === '' &&
                                        (mapping.rate_plan_code?.trim?.() || '') === '' &&
                                        (mapping.room_name?.trim?.() || '') === '' &&
                                        (mapping.rate_plan_name?.trim?.() || '') === ''
                                      )
                                    }
                                  >
                                    Save
                                  </Button>
                                )}
                              </div>
                              </div>
                            ))
                          )}
                          
                          {/* Removed Add Another Mapping button as requested */}
                        </div>
                      </td>

                      {/* Room Class Column */}
                      <td className="px-6 py-4 text-center align-top">
                        <div className="bg-gradient-to-br from-gray-100 to-white border-2 border-gray-300 rounded-xl p-4">
                          <div className="space-y-3">
                            <div className="text-lg font-bold text-gray-900">{row.class_code}</div>
                            <div className="text-sm font-medium text-gray-700">{row.class_name}</div>
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                row.category === 'STD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {row.category} L{row.level}
                              </span>
                              {row.has_breakfast && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  BF
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono px-2 py-1 rounded">
                              {row.price_formula}
                          </div>
                            <div className="text-xs text-gray-600">
                              {row.description}
                        </div>
                          </div>
                        </div>
                        
                      </td>

                      {/* Agoda Room ID Column */}
                      <td className="px-6 py-4 align-top">
                        <div className="text-right">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Agoda Room ID
                          </label>
                          <Input
                            type="text"
                            value={row.agoda_room_id}
                            onChange={(e) => updateAgodaRoomId(row.class_code, e.target.value)}
                            placeholder="Enter Room ID"
                            className="text-right"
                          />
                          <div className="flex justify-end mt-2 gap-2">
                            {row.agoda_mapping_id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleUpdateAgodaRow(row)}
                                  leftIcon={<Save className="h-3 w-3" />}
                                  disabled={saving || !row.agoda_room_id.trim()}
                                >
                                  Update
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDeleteAgodaRow(row)}
                                  leftIcon={<X className="h-3 w-3" />}
                                  disabled={saving}
                                >
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveAgodaRow(row)}
                                leftIcon={<Save className="h-3 w-3" />}
                                disabled={saving || !row.agoda_room_id.trim()}
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredMappingRows.length === 0 && searchTerm && (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No mappings found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No room classes match your search criteria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save Button
        {!initialLoading && filteredMappingRows.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={saveMappings}
              disabled={saving || !agodaPropertyId.trim()}
              isLoading={saving}
              leftIcon={<Save className="h-4 w-4" />}
              size="lg"
            >
              {saving ? 'Saving Mappings...' : 'Save All Mappings'}
            </Button>
          </div>
        )} */}

        {/* Empty State */}
        {!initialLoading && mappingRows.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Mappings Available</h3>
            <p className="text-sm text-gray-600">
              Enter an Agoda Property ID to start creating room mappings.
            </p>
          </div>
        )}
      </div>
    </PageTransitionWrapper>
  );
}
