'use client';

import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../lib/axios";
import toast from "react-hot-toast";
import { Calendar as CalendarIcon, RefreshCw, Save, Search, CheckSquare, Eraser, Square, Check, Building2, Globe, Bed, Star, Settings, Clock, CreditCard, Percent, Calendar } from "lucide-react";
import Button from "../../../components/UI/Button";
import Input from "../../../components/UI/Input";
import SearchInput from "../../../components/UI/SearchInput";
import Shimmer from "../../../components/UI/Shimmer";
import PageTransitionWrapper from "../../../components/PageTransitionWrapper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

// Helper utility
const formatDate = (d: Date | string | any) => {
  if (typeof d === "string") {
    return d;
  }
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  if (d && typeof d === "object" && d.date) {
    // Handle case where d is an object with a date property
    if (typeof d.date === "string") {
      return d.date;
    }
    if (d.date instanceof Date) {
      return d.date.toISOString().slice(0, 10);
    }
    // Handle case where d.date is a number (day of month)
    if (typeof d.date === "number") {
      // We need to construct a proper date string from the date object
      const year = new Date().getFullYear();
      const month = d.month || new Date().getMonth() + 1;
      const day = d.date;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return "";
};

const DEFAULT_DAYS_OPTIONS = [7, 14];

interface CalendarData {
  property_id: string;
  property_name: string;
  agoda: {
    date_columns: Array<{
      month: string;
      date: number;
      day: string;
      base_room_rate: number;
      inventory: number;
      availability: number;
      booked_rooms: number;
      occupancy_rate: number;
      availability_status: string;
      close_out: string;
      room_inventory: Array<{
        agoda_room_id: string;
        room_name: string;
        room_class: string;
        inventory: number;
        availability: number;
        booked_rooms: number;
        occupancy_rate: number;
        availability_status: string;
        close_out: string;
        max_occupancy: number;
        is_mapped: boolean;
        has_availability_data: boolean;
        sync_status: string;
        restrictions: {
          closed: boolean;
          ctd: boolean;
          cta: boolean;
        };
      }>;
    }>;
  };
  hyperguest: {
    date_columns: Array<{
      month: string;
      date: number;
      day: string;
      inventory: number;
      availability: number;
      booked_rooms: number;
      occupancy_rate: number;
      availability_status: string;
      close_out: string;
      room_inventory: Array<{
        hyperguest_room_id: string;
        room_name: string;
        room_class: string;
        inventory: number;
        availability: number;
        booked_rooms: number;
        occupancy_rate: number;
        availability_status: string;
        close_out: string;
        max_occupancy: number;
        is_mapped: boolean;
        has_availability_data: boolean;
        sync_status: string;
        restrictions: {
          closed: boolean;
          ctd: boolean;
          cta: boolean;
        };
      }>;
    }>;
  };
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

export default function CalendarManagement() {
  // UI/Filter state
  const [propertyId, setPropertyId] = useState("");
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  
  // Property options state
  const [propertyOptions, setPropertyOptions] = useState<Array<{value: string, label: string}>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Edit states
  const [basePriceEdits, setBasePriceEdits] = useState<Record<string, number>>({});
  const [inventoryEdits, setInventoryEdits] = useState<Record<string, Record<string, Record<string, number>>>>({ agoda: {}, hyperguest: {} });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'none' | 'base' | 'availability'>('none');
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{date: string, roomId: string, ota?: 'agoda' | 'hyperguest'} | null>(null);
  const [dragEnd, setDragEnd] = useState<{date: string, roomId: string, ota?: 'agoda' | 'hyperguest'} | null>(null);

  // Fetch property options from OTA status API
  const fetchPropertyOptions = useCallback(async () => {
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
  }, []);

  // Load property options on component mount
  useEffect(() => {
    fetchPropertyOptions();
  }, [fetchPropertyOptions]);

  // Fetches current OTA availability/pricing for selected property/period
  const fetchCalendar = useCallback(async () => {
    if (!propertyId.trim()) {
      toast.error("Please enter property ID.");
      return;
    }
    setLoading(true);
    setInitialLoading(true);
    setCalendarData(null);
    try {
      const resp = await axios.get(
        `admin/availability?days=${days}&start_date=${formatDate(startDate)}&property_id=${propertyId}`
      );
      const data = resp.data.RESULT?.[0] || null;
      setCalendarData(data);
      setBasePriceEdits({});
      setInventoryEdits({ agoda: {}, hyperguest: {} });
      setSelectedCells(new Set());
      setSelectionMode('none');
      if (data) {
        toast.success("Calendar data loaded successfully!");
      }
    } catch (error: any) {
      console.error("Fetch calendar error:", error);
      toast.error(error.response?.data?.MESSAGE || "Failed to load calendar.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [propertyId, days, startDate]);

  // Auto-search when property ID changes
  useEffect(() => {
    if (propertyId.trim()) {
      fetchCalendar();
    }
  }, [propertyId, fetchCalendar]);

  // Add global mouseup listener for drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragEnd, calendarData, selectedCells, selectionMode]);

  // Handles in-table inline value editing
  const handleBasePriceChange = (date: string, value: number) => {
    setBasePriceEdits(prev => ({ ...prev, [date]: value }));
  };

  const handleInventoryChange = (ota: "agoda" | "hyperguest", roomId: string, date: string, value: number) => {
    setInventoryEdits((prev) => ({
      ...prev,
      [ota]: {
        ...prev[ota],
        [roomId]: { ...(prev[ota][roomId] || {}), [date]: value }
      }
    }));
  };

  // Helper function to create cell key with date and room class mapping
  const createCellKey = (date: string, roomClassOrId: string, ota?: 'agoda' | 'hyperguest') => {
    if (roomClassOrId === 'base') {
      return `base_${date}`;
    }
    return `${ota}_${roomClassOrId}_${date}`;
  };

  // Toggle individual cell selection (Excel-like)
  const toggleCellSelection = (date: string, roomClassOrId: string, ota?: 'agoda' | 'hyperguest') => {
    const cellKey = createCellKey(date, roomClassOrId, ota);
    const isBasePrice = roomClassOrId === 'base';
    const isAvailability = ota === 'agoda' || ota === 'hyperguest';
    
    // Check if trying to select a different type than current mode
    if (selectionMode === 'none') {
      // First selection - set the mode
      if (isBasePrice) {
        setSelectionMode('base');
      } else if (isAvailability) {
        setSelectionMode('availability');
      }
    } else if (selectionMode === 'base' && !isBasePrice) {
      toast.error("You can only select base prices when base price mode is active. Clear selection to change mode.");
      return;
    } else if (selectionMode === 'availability' && !isAvailability) {
      toast.error("You can only select availability when availability mode is active. Clear selection to change mode.");
      return;
    }
    
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
        // If no cells selected, reset mode
        if (newSet.size === 0) {
          setSelectionMode('none');
        }
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  // Check if cell is selected
  const isCellSelected = (date: string, roomClassOrId: string, ota?: 'agoda' | 'hyperguest') => {
    const cellKey = createCellKey(date, roomClassOrId, ota);
    return selectedCells.has(cellKey);
  };

  // Check if all cells in a row are selected
  const isRowFullySelected = (type: 'base' | 'agoda' | 'hyperguest', roomId?: string) => {
    if (!calendarData) return false;
    
    const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
    
    if (type === 'base') {
      return dates.every(date => selectedCells.has(createCellKey(date, 'base')));
    } else if (roomId) {
      const ota = type as "agoda" | "hyperguest";
      return dates.every(date => selectedCells.has(createCellKey(date, roomId, ota)));
    }
    
    return false;
  };

  // Check if all inventory cells in a column are selected (excluding base price)
  const isColumnFullySelected = (dateObj: any) => {
    if (!calendarData) return false;
    
    const date = formatDate(dateObj);
    const inventoryCells = new Set();
    
    // Check all Agoda rooms for this date
    const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
    agodaRooms.forEach((room: any) => {
      inventoryCells.add(createCellKey(date, room.agoda_room_id, 'agoda'));
    });
    
    // Check all HyperGuest rooms for this date
    const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
    hyperguestRooms.forEach((room: any) => {
      inventoryCells.add(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
    });
    
    // Check if all inventory cells in this column are selected
    return Array.from(inventoryCells).every(cellKey => selectedCells.has(cellKey as string));
  };

  // Select entire row (all dates for a specific room/base price)
  const selectRow = (type: 'base' | 'agoda' | 'hyperguest', roomId?: string) => {
    if (!calendarData) return;
    
    const isBasePrice = type === 'base';
    const isAvailability = type === 'agoda' || type === 'hyperguest';
    
    // Check if trying to select a different type than current mode
    if (selectionMode === 'none') {
      // First selection - set the mode
      if (isBasePrice) {
        setSelectionMode('base');
      } else if (isAvailability) {
        setSelectionMode('availability');
      }
    } else if (selectionMode === 'base' && !isBasePrice) {
      toast.error("You can only select base prices when base price mode is active. Clear selection to change mode.");
      return;
    } else if (selectionMode === 'availability' && !isAvailability) {
      toast.error("You can only select availability when availability mode is active. Clear selection to change mode.");
      return;
    }
    
    const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
    const newSelection = new Set(selectedCells);
    
    if (type === 'base') {
      dates.forEach(date => {
        newSelection.add(createCellKey(date, 'base'));
      });
    } else if (roomId) {
      const ota = type as "agoda" | "hyperguest";
      dates.forEach(date => {
        newSelection.add(createCellKey(date, roomId, ota));
      });
    }
    
    setSelectedCells(newSelection);
  };

  // Unselect entire row (all dates for a specific room/base price)
  const unselectRow = (type: 'base' | 'agoda' | 'hyperguest', roomId?: string) => {
    if (!calendarData) return;
    
    const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
    const newSelection = new Set(selectedCells);
    
    if (type === 'base') {
      dates.forEach(date => {
        newSelection.delete(createCellKey(date, 'base'));
      });
    } else if (roomId) {
      const ota = type as "agoda" | "hyperguest";
      dates.forEach(date => {
        newSelection.delete(createCellKey(date, roomId, ota));
      });
    }
    
    setSelectedCells(newSelection);
  };

  // Select entire column (all inventory rooms for a specific date, excluding base price)
  const selectColumn = (dateObj: any) => {
    if (!calendarData) return;
    
    // Check if trying to select availability when in base price mode
    if (selectionMode === 'base') {
      toast.error("You can only select base prices when base price mode is active. Clear selection to change mode.");
      return;
    }
    
    // Set mode to availability if not already set
    if (selectionMode === 'none') {
      setSelectionMode('availability');
    }
    
    const date = formatDate(dateObj);
    const newSelection = new Set(selectedCells);
    
    // Select all Agoda rooms for this date
    const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
    agodaRooms.forEach((room: any) => {
      newSelection.add(createCellKey(date, room.agoda_room_id, 'agoda'));
    });
    
    // Select all HyperGuest rooms for this date
    const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
    hyperguestRooms.forEach((room: any) => {
      newSelection.add(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
    });
    
    setSelectedCells(newSelection);
  };

  // Unselect entire column (all inventory rooms for a specific date, excluding base price)
  const unselectColumn = (dateObj: any) => {
    if (!calendarData) return;
    
    const date = formatDate(dateObj);
    const newSelection = new Set(selectedCells);
    
    // Unselect all Agoda rooms for this date
    const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
    agodaRooms.forEach((room: any) => {
      newSelection.delete(createCellKey(date, room.agoda_room_id, 'agoda'));
    });
    
    // Unselect all HyperGuest rooms for this date
    const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
    hyperguestRooms.forEach((room: any) => {
      newSelection.delete(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
    });
    
    setSelectedCells(newSelection);
  };

  // Select all cells of a specific type
  const selectAllCells = (type: 'base' | 'agoda' | 'hyperguest') => {
    if (!calendarData) return;
    
    const isBasePrice = type === 'base';
    const isAvailability = type === 'agoda' || type === 'hyperguest';
    
    // Check if trying to select a different type than current mode
    if (selectionMode === 'none') {
      // First selection - set the mode
      if (isBasePrice) {
        setSelectionMode('base');
      } else if (isAvailability) {
        setSelectionMode('availability');
      }
    } else if (selectionMode === 'base' && !isBasePrice) {
      toast.error("You can only select base prices when base price mode is active. Clear selection to change mode.");
      return;
    } else if (selectionMode === 'availability' && !isAvailability) {
      toast.error("You can only select availability when availability mode is active. Clear selection to change mode.");
      return;
    }
    
    const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
    const newSelection = new Set(selectedCells);
    
    if (type === 'base') {
      dates.forEach(date => {
        newSelection.add(createCellKey(date, 'base'));
      });
    } else {
      const ota = type as "agoda" | "hyperguest";
      const roomData = calendarData[ota]?.date_columns?.[0]?.room_inventory || [];
      roomData.forEach((room: any) => {
        const roomId = ota === 'agoda' ? room.agoda_room_id : room.hyperguest_room_id;
        dates.forEach(date => {
          newSelection.add(createCellKey(date, roomId, ota));
        });
      });
    }
    
    setSelectedCells(newSelection);
  };

  const clearSelection = () => {
    setSelectedCells(new Set());
    setSelectionMode('none');
  };

  // Excel-like drag selection handlers
  const handleMouseDown = (date: string, roomId: string, ota?: 'agoda' | 'hyperguest') => {
    setIsDragging(true);
    setDragStart({ date, roomId, ota });
    setDragEnd({ date, roomId, ota });
  };

  const handleMouseEnter = (date: string, roomId: string, ota?: 'agoda' | 'hyperguest') => {
    if (isDragging && dragStart) {
      setDragEnd({ date, roomId, ota });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && calendarData) {
      // Get all dates from calendar
      const allDates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
      
      // Get start and end date indices
      const startDateIndex = allDates.indexOf(dragStart.date);
      const endDateIndex = allDates.indexOf(dragEnd.date);
      
      if (startDateIndex === -1 || endDateIndex === -1) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }
      
      // Determine date range
      const minDateIndex = Math.min(startDateIndex, endDateIndex);
      const maxDateIndex = Math.max(startDateIndex, endDateIndex);
      const dateRange = allDates.slice(minDateIndex, maxDateIndex + 1);
      
      // Get all room IDs based on selection type
      let roomIds: Array<{id: string, ota?: 'agoda' | 'hyperguest'}> = [];
      
      const isBasePrice = dragStart.roomId === 'base';
      const isAvailability = dragStart.ota === 'agoda' || dragStart.ota === 'hyperguest';
      
      // Check selection mode compatibility
      if (selectionMode === 'none') {
        if (isBasePrice) {
          setSelectionMode('base');
          roomIds = [{id: 'base'}];
        } else if (isAvailability) {
          setSelectionMode('availability');
          // Get all rooms between start and end
          const mergedRooms = getMergedRooms();
          const startRoomIndex = mergedRooms.findIndex(r => 
            (r.agoda?.agoda_room_id === dragStart.roomId) || 
            (r.hyperguest?.hyperguest_room_id === dragStart.roomId)
          );
          const endRoomIndex = mergedRooms.findIndex(r => 
            (r.agoda?.agoda_room_id === dragEnd.roomId) || 
            (r.hyperguest?.hyperguest_room_id === dragEnd.roomId)
          );
          
          if (startRoomIndex !== -1 && endRoomIndex !== -1) {
            const minRoomIndex = Math.min(startRoomIndex, endRoomIndex);
            const maxRoomIndex = Math.max(startRoomIndex, endRoomIndex);
            const roomRange = mergedRooms.slice(minRoomIndex, maxRoomIndex + 1);
            
            roomRange.forEach(room => {
              if (room.agoda) {
                roomIds.push({id: room.agoda.agoda_room_id, ota: 'agoda'});
              }
            });
          }
        }
      } else if (selectionMode === 'base' && !isBasePrice) {
        toast.error("You can only select base prices when base price mode is active. Clear selection to change mode.");
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      } else if (selectionMode === 'availability' && !isAvailability) {
        toast.error("You can only select availability when availability mode is active. Clear selection to change mode.");
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      } else if (selectionMode === 'base') {
        roomIds = [{id: 'base'}];
      } else if (selectionMode === 'availability') {
        // Get all rooms between start and end
        const mergedRooms = getMergedRooms();
        const startRoomIndex = mergedRooms.findIndex(r => 
          (r.agoda?.agoda_room_id === dragStart.roomId) || 
          (r.hyperguest?.hyperguest_room_id === dragStart.roomId)
        );
        const endRoomIndex = mergedRooms.findIndex(r => 
          (r.agoda?.agoda_room_id === dragEnd.roomId) || 
          (r.hyperguest?.hyperguest_room_id === dragEnd.roomId)
        );
        
        if (startRoomIndex !== -1 && endRoomIndex !== -1) {
          const minRoomIndex = Math.min(startRoomIndex, endRoomIndex);
          const maxRoomIndex = Math.max(startRoomIndex, endRoomIndex);
          const roomRange = mergedRooms.slice(minRoomIndex, maxRoomIndex + 1);
          
          roomRange.forEach(room => {
            if (room.agoda) {
              roomIds.push({id: room.agoda.agoda_room_id, ota: 'agoda'});
            }
          });
        }
      }
      
      // Select all cells in the range
      const newSelection = new Set(selectedCells);
      roomIds.forEach(room => {
        dateRange.forEach(date => {
          const cellKey = createCellKey(date, room.id, room.ota);
          newSelection.add(cellKey);
        });
      });
      
      setSelectedCells(newSelection);
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Helper to check if cell is in drag range
  const isCellInDragRange = (date: string, roomId: string, ota?: 'agoda' | 'hyperguest') => {
    if (!isDragging || !dragStart || !dragEnd || !calendarData) return false;
    
    const allDates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
    const currentDateIndex = allDates.indexOf(date);
    const startDateIndex = allDates.indexOf(dragStart.date);
    const endDateIndex = allDates.indexOf(dragEnd.date);
    
    if (currentDateIndex === -1 || startDateIndex === -1 || endDateIndex === -1) return false;
    
    const minDateIndex = Math.min(startDateIndex, endDateIndex);
    const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    const isInDateRange = currentDateIndex >= minDateIndex && currentDateIndex <= maxDateIndex;
    
    if (!isInDateRange) return false;
    
    // Check room range
    const isBasePrice = dragStart.roomId === 'base';
    if (isBasePrice) {
      return roomId === 'base';
    }
    
    const mergedRooms = getMergedRooms();
    const currentRoomIndex = mergedRooms.findIndex(r => 
      (r.agoda?.agoda_room_id === roomId) || 
      (r.hyperguest?.hyperguest_room_id === roomId)
    );
    const startRoomIndex = mergedRooms.findIndex(r => 
      (r.agoda?.agoda_room_id === dragStart.roomId) || 
      (r.hyperguest?.hyperguest_room_id === dragStart.roomId)
    );
    const endRoomIndex = mergedRooms.findIndex(r => 
      (r.agoda?.agoda_room_id === dragEnd.roomId) || 
      (r.hyperguest?.hyperguest_room_id === dragEnd.roomId)
    );
    
    if (currentRoomIndex === -1 || startRoomIndex === -1 || endRoomIndex === -1) return false;
    
    const minRoomIndex = Math.min(startRoomIndex, endRoomIndex);
    const maxRoomIndex = Math.max(startRoomIndex, endRoomIndex);
    
    return currentRoomIndex >= minRoomIndex && currentRoomIndex <= maxRoomIndex;
  };

  const batchUpdateSelected = (value: number) => {
    const newBasePriceEdits = { ...basePriceEdits };
    const newInventoryEdits = { ...inventoryEdits };

    selectedCells.forEach(cellKey => {
      if (cellKey.startsWith('base_')) {
        const date = cellKey.replace('base_', '');
        newBasePriceEdits[date] = value;
      } else if (cellKey.startsWith('agoda_')) {
        // For Agoda: agoda_roomId_date
        const agodaPrefix = 'agoda_';
        const withoutPrefix = cellKey.substring(agodaPrefix.length);
        const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
        
        if (lastUnderscoreIndex > 0) {
          const roomId = withoutPrefix.substring(0, lastUnderscoreIndex);
          const date = withoutPrefix.substring(lastUnderscoreIndex + 1);
          
          if (!newInventoryEdits.agoda[roomId]) {
            newInventoryEdits.agoda[roomId] = {};
          }
          newInventoryEdits.agoda[roomId][date] = value;
        }
      } else if (cellKey.startsWith('hyperguest_')) {
        // For HyperGuest: hyperguest_roomId_date
        const hyperguestPrefix = 'hyperguest_';
        const withoutPrefix = cellKey.substring(hyperguestPrefix.length);
        const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
        
        if (lastUnderscoreIndex > 0) {
          const roomId = withoutPrefix.substring(0, lastUnderscoreIndex);
          const date = withoutPrefix.substring(lastUnderscoreIndex + 1);
          
          if (!newInventoryEdits.hyperguest[roomId]) {
            newInventoryEdits.hyperguest[roomId] = {};
          }
          newInventoryEdits.hyperguest[roomId][date] = value;
        }
      }
    });

    setBasePriceEdits(newBasePriceEdits);
    setInventoryEdits(newInventoryEdits);
  };

  // Helper function to format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateString: string) => {
    // If the date is already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If the date is in YYYY-Month-DD format, convert it
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      // Convert month name to number
      const monthMap: { [key: string]: string } = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      
      const monthNumber = monthMap[month] || month;
      return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
    }
    
    return dateString; 
  };

  // Save all changes
  const saveAllChanges = async () => {
    if (!calendarData) return;

    setSaving(true);
    try {
      // Save base price changes
      const priceUpdates = Object.entries(basePriceEdits).map(([date, basePrice]) => ({
        date: formatDateForAPI(date),
        basePrice
      }));

      if (priceUpdates.length > 0) {
        await axios.put(
          `admin/properties/${propertyId}/pricing/bulk`,
          { pricing: priceUpdates }
        );
        toast.success("Base prices updated successfully!");
      }

      // Save inventory changes
      const inventoryUpdates: any[] = [];
      
      Object.entries(inventoryEdits.agoda).forEach(([roomId, cells]) => {
        Object.entries(cells).forEach(([date, available_rooms]) => {
          const room = calendarData.agoda.date_columns[0]?.room_inventory.find((r: any) => r.agoda_room_id === roomId);
          if (room) {
            inventoryUpdates.push({
              room_class: room.room_class,
              date: formatDateForAPI(date),
              available_rooms,
              closed: false,
              ctd: false,
              cta: false
            });
          }
        });
      });

      Object.entries(inventoryEdits.hyperguest).forEach(([roomId, cells]) => {
        Object.entries(cells).forEach(([date, available_rooms]) => {
          const room = calendarData.hyperguest.date_columns[0]?.room_inventory.find((r: any) => r.hyperguest_room_id === roomId);
          if (room) {
            inventoryUpdates.push({
              room_class: room.room_class,
              date: formatDateForAPI(date),
              available_rooms,
              closed: false,
              ctd: false,
              cta: false
            });
          }
        });
      });

      if (inventoryUpdates.length > 0) {
        await axios.put(
          "admin/availability/bulk-update",
          { 
            property_id: propertyId, 
            updates: inventoryUpdates 
          }
        );
        toast.success("Inventory updated successfully!");
      }

      // Refresh data
      await fetchCalendar();
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.MESSAGE || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(basePriceEdits).length > 0 || 
    Object.keys(inventoryEdits.agoda).length > 0 || 
    Object.keys(inventoryEdits.hyperguest).length > 0;

  const selectedCount = selectedCells.size;

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

  // Helper function to merge Agoda and HyperGuest rooms by room_class
  const getMergedRooms = () => {
    if (!calendarData) return [];
    
    const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
    const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
    
    // Get all unique room classes
    const roomClasses = new Set([
      ...agodaRooms.map((room: any) => room.room_class),
      ...hyperguestRooms.map((room: any) => room.room_class)
    ]);
    
    // Merge rooms by room_class
    return Array.from(roomClasses).map(roomClass => {
      const agodaRoom = agodaRooms.find((room: any) => room.room_class === roomClass);
      const hyperguestRoom = hyperguestRooms.find((room: any) => room.room_class === roomClass);
      
      return {
        room_class: roomClass,
        agoda: agodaRoom,
        hyperguest: hyperguestRoom
      };
    });
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agoda Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HyperGuest Availability</th>
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
      <div className={`mx-auto space-y-6 p-2 md:p-4 ${isDragging ? 'select-none' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Calendar Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage availability and pricing across Agoda and HyperGuest platforms
            </p>
            {/* Property Details */}
            {calendarData && (
              <div className="mt-3 md:flex hidden md:flex-row gap-4">
                <div className="flex items-center gap-2 ">
                  <span className="text-sm font-medium text-gray-700">Property Name:</span>
                  <span className="text-sm text-gray-900">{calendarData.property_name}</span>
                  <span className="text-xs text-gray-500">(ID: {calendarData.property_id})</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {hasChanges && (
              <Button
                variant="primary"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={saveAllChanges}
                isLoading={saving}
                disabled={saving}
                className="whitespace-nowrap"
              >
                Save All Changes
              </Button>
            )}
            {selectedCount > 0 && (
              <Button
                variant="secondary"
                leftIcon={<Eraser className="h-4 w-4" />}
                onClick={clearSelection}
                className="whitespace-nowrap"
              >
                Clear Selection
              </Button>
            )}
          </div>
      </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-end md:gap-2">
            <div className="flex-1 md:max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Agoda Property ID
              </label>
              <Select
                instanceId="calendar-property-select"
                value={propertyOptions.find(option => option.value === propertyId) || null}
                onChange={(selectedOption) => setPropertyId(selectedOption?.value || "")}
                options={propertyOptions}
                placeholder="Select Property..."
                isSearchable
                isLoading={loadingProperties}
                styles={customSelectStyles}
                className="w-full"
                classNamePrefix="react-select"
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Days
                </label>
                <select
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DEFAULT_DAYS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt} days
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => date && setStartDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:pb-1">
              <Button
                variant="secondary"
                leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                onClick={fetchCalendar}
                disabled={loading || !propertyId.trim()}
                className="flex-1 md:w-auto md:h-auto"
              >
                Refresh
              </Button>
            </div>
          </div>  
        </div>
            
        {/* Bulk Operations */}
        {calendarData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col gap-4">
              {/* Bulk Select Options */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Bulk Select:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!calendarData) return;
                      
                      const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
                      const allBaseCells = dates.map(date => createCellKey(date, 'base'));
                      const allBaseSelected = allBaseCells.every(cellKey => selectedCells.has(cellKey));
                      
                      if (allBaseSelected) {
                        // Unselect all base price cells
                        const newSelection = new Set(selectedCells);
                        allBaseCells.forEach(cellKey => {
                          newSelection.delete(cellKey);
                        });
                        setSelectedCells(newSelection);
                        // Reset mode if no cells selected
                        if (newSelection.size === 0) {
                          setSelectionMode('none');
                        }
                      } else {
                        // Set mode to base first
                        setSelectionMode('base');
                        
                        // Select all base price cells
                        const newSelection = new Set(selectedCells);
                        dates.forEach(date => {
                          newSelection.add(createCellKey(date, 'base'));
                        });
                        setSelectedCells(newSelection);
                      }
                    }}
                    leftIcon={<CheckSquare className="h-4 w-4" />}
                    className="flex-1 sm:flex-none whitespace-nowrap"
                  >
                    {(() => {
                      if (!calendarData) return "Base Price";
                      const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
                      const allBaseCells = dates.map(date => createCellKey(date, 'base'));
                      const allBaseSelected = allBaseCells.every(cellKey => selectedCells.has(cellKey));
                      return allBaseSelected ? "Unselect Base Price" : "Base Price";
                    })()}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!calendarData) return;
                      
                      const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
                      const allAvailabilityCells = new Set();
                      
                      // Get all Agoda rooms
                      const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
                      agodaRooms.forEach((room: any) => {
                        dates.forEach(date => {
                          allAvailabilityCells.add(createCellKey(date, room.agoda_room_id, 'agoda'));
                        });
                      });
                      
                      // Get all HyperGuest rooms
                      const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
                      hyperguestRooms.forEach((room: any) => {
                        dates.forEach(date => {
                          allAvailabilityCells.add(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
                        });
                      });
                      
                      const allAvailabilitySelected = Array.from(allAvailabilityCells).every(cellKey => selectedCells.has(cellKey as string));
                      
                      if (allAvailabilitySelected) {
                        // Unselect all availability cells
                        const newSelection = new Set(selectedCells);
                        allAvailabilityCells.forEach(cellKey => {
                          newSelection.delete(cellKey as string);
                        });
                        setSelectedCells(newSelection);
                        // Reset mode if no cells selected
                        if (newSelection.size === 0) {
                          setSelectionMode('none');
                        }
                      } else {
                        // Set mode to availability first
                        setSelectionMode('availability');
                        
                        // Select all Agoda and HyperGuest cells in one operation
                        const newSelection = new Set(selectedCells);
                        
                        // Select all Agoda rooms
                        agodaRooms.forEach((room: any) => {
                          dates.forEach(date => {
                            newSelection.add(createCellKey(date, room.agoda_room_id, 'agoda'));
                          });
                        });
                        
                        // Select all HyperGuest rooms
                        hyperguestRooms.forEach((room: any) => {
                          dates.forEach(date => {
                            newSelection.add(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
                          });
                        });
                        
                        setSelectedCells(newSelection);
                      }
                    }}
                    leftIcon={<CheckSquare className="h-4 w-4" />}
                    className="flex-1 sm:flex-none whitespace-nowrap"
                  >
                    {(() => {
                      if (!calendarData) return "Availability";
                      const dates = calendarData.agoda?.date_columns?.map(d => formatDate(d)) || [];
                      const allAvailabilityCells = new Set();
                      
                      // Get all Agoda rooms
                      const agodaRooms = calendarData.agoda?.date_columns?.[0]?.room_inventory || [];
                      agodaRooms.forEach((room: any) => {
                        dates.forEach(date => {
                          allAvailabilityCells.add(createCellKey(date, room.agoda_room_id, 'agoda'));
                        });
                      });
                      
                      // Get all HyperGuest rooms
                      const hyperguestRooms = calendarData.hyperguest?.date_columns?.[0]?.room_inventory || [];
                      hyperguestRooms.forEach((room: any) => {
                        dates.forEach(date => {
                          allAvailabilityCells.add(createCellKey(date, room.hyperguest_room_id, 'hyperguest'));
                        });
                      });
                      
                      const allAvailabilitySelected = Array.from(allAvailabilityCells).every(cellKey => selectedCells.has(cellKey as string));
                      return allAvailabilitySelected ? "Unselect Availability" : "Availability";
                    })()}
                  </Button>
                </div>
              {/* Selection Actions */}
              {selectedCount > 0 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-gray-200 md:border-t-0 md:pt-0">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    {selectedCount} cells selected
                    {selectionMode !== 'none' && (
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selectionMode === 'base' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectionMode === 'base' ? 'Base Price Mode' : 'Availability Mode'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Set value"
                      className="w-full md:w-auto "
                      onChange={e => batchUpdateSelected(Number(e.target.value))} 
                    />
                  </div>
                </div>
              )}
              </div>
              
            </div>
          </div>
        )}

        {/* Calendar Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading calendar data...</span>
                </div>
              </div>
        ) : calendarData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Mobile View - Responsive Table */}
            <div className="block md:hidden">
              <div className="p-3">
                {/* Mobile Header */}
                <div className="text-center mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-gray-900 font-semibold">{calendarData.property_name}</span>
                  </div>
                </div>

                {/* Mobile Table Container */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Room Availability</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-xs text-gray-600">Agoda</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-xs text-gray-600">HyperGuest</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[120px]">
                            Room / Date
                          </th>
                          {calendarData.agoda.date_columns.map((d: any) => {
                            const isFullySelected = isColumnFullySelected(d);
                            return (
                              <th key={d.date} className="px-2 py-2 text-center text-xs font-medium text-gray-500 min-w-[80px]">
                                <div className="flex flex-col items-center">
                                  <span className="font-semibold text-gray-900">{d.day}</span>
                                  <span className="text-gray-400 text-xs">{d.date}/{d.month}</span>
                                  <button
                                    onClick={() => isFullySelected ? unselectColumn(d) : selectColumn(d)}
                                    className={`mt-1 text-xs font-medium transition-colors duration-200 px-2 py-1 rounded ${
                                      isFullySelected 
                                        ? 'bg-red-100 text-red-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {isFullySelected ? 'Unselect' : 'Select'}
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Base Price Row */}
                        <tr className="bg-blue-50">
                          <td className="px-3 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-blue-50 z-10">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-blue-600" />
                              <span>Base Price</span>
                              <button
                                onClick={() => isRowFullySelected('base') ? unselectRow('base') : selectRow('base')}
                                className={`ml-1 text-xs font-medium transition-colors duration-200 ${
                                  isRowFullySelected('base') 
                                    ? 'text-red-600' 
                                    : 'text-blue-600'
                                }`}
                              >
                                {isRowFullySelected('base') ? 'Unselect' : 'Select'}
                              </button>
                            </div>
                          </td>
                          {calendarData.agoda.date_columns.map((d: any) => {
                            const date = formatDate(d);
                            const isSelected = isCellSelected(date, 'base');
                            return (
                              <td key={d.date} className="px-2 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Input
                                    type="number"
                                    className="w-12 text-center text-sm h-8"
                                    value={
                                      (basePriceEdits[date] ?? d.base_room_rate ?? "").toString()
                                    }
                                    onChange={e =>
                                      handleBasePriceChange(date, Number(e.target.value))
                                    }
                                  />
                                  <button
                                    onClick={() => toggleCellSelection(date, 'base')}
                                    className={`p-1 rounded transition-colors duration-200 ${
                                      isSelected 
                                        ? 'text-blue-600 bg-blue-100' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Room Availability Rows */}
                        {getMergedRooms().map((mergedRoom: any) => (
                          <tr key={mergedRoom.room_class} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 font-medium">{mergedRoom.room_class}</div>
                                {mergedRoom.agoda && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                                    <span className="text-xs">{mergedRoom.agoda.room_name}</span>
                                  </div>
                                )}
                                {mergedRoom.hyperguest && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">H</div>
                                    <span className="text-xs">{mergedRoom.hyperguest.room_name}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            {calendarData.agoda.date_columns.map((d: any) => {
                              const date = formatDate(d);
                              const agodaValue = mergedRoom.agoda ? 
                                (inventoryEdits.agoda[mergedRoom.agoda.agoda_room_id]?.[date] ??
                                 d.room_inventory.find((r: any) => r.agoda_room_id === mergedRoom.agoda.agoda_room_id)?.availability ?? "") : "";
                              const hyperguestValue = mergedRoom.hyperguest ? 
                                (inventoryEdits.hyperguest[mergedRoom.hyperguest.hyperguest_room_id]?.[date] ??
                                 calendarData.hyperguest.date_columns.find((col: any) => formatDate(col) === date)?.room_inventory.find((r: any) => r.hyperguest_room_id === mergedRoom.hyperguest.hyperguest_room_id)?.availability ?? "") : "";
                              
                              const isAgodaSelected = mergedRoom.agoda ? isCellSelected(date, mergedRoom.agoda.agoda_room_id, 'agoda') : false;
                              
                              return (
                                <td key={d.date} className="px-2 py-3 text-center">
                                  <div className="space-y-1">
                                    {/* Agoda Input */}
                                    {mergedRoom.agoda && (
                                      <div className="flex flex-col items-center gap-1">
                                        <Input
                                          type="number"
                                          className="w-12 text-center text-sm h-8"
                                          value={agodaValue}
                                          onChange={e =>
                                            handleInventoryChange(
                                              "agoda",
                                              mergedRoom.agoda.agoda_room_id,
                                              date,
                                              Number(e.target.value)
                                            )
                                          }
                                        />
                                        <button
                                          onClick={() => toggleCellSelection(date, mergedRoom.agoda.agoda_room_id, 'agoda')}
                                          className={`p-1 rounded transition-colors duration-200 ${
                                            isAgodaSelected 
                                              ? 'text-blue-600 bg-blue-100' 
                                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                          }`}
                                        >
                                          {isAgodaSelected ? (
                                            <CheckSquare className="h-3 w-3" />
                                          ) : (
                                            <Square className="h-3 w-3" />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* HyperGuest Text */}
                                    {mergedRoom.hyperguest && (
                                      <div className="text-xs text-gray-500">
                                        HG: {hyperguestValue}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View - Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date / Room
            </div>
                    </th>
                    {calendarData.agoda.date_columns.map((d: any) => {
                      const isFullySelected = isColumnFullySelected(d);
                      return (
                        <th key={d.date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{d.day}</span>
                            <span className="text-gray-400">{d.date}/{d.month}</span>
                            <button
                              onClick={() => isFullySelected ? unselectColumn(d) : selectColumn(d)}
                              className={`mt-1 text-xs font-medium transition-colors duration-200 ${
                                isFullySelected 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-blue-600 hover:text-blue-800'
                              }`}
                            >
                              {isFullySelected ? 'Unselect All' : 'Select All'}
                            </button>
            </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Base Price Row */}
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-blue-50 z-10">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Base Price
                        <button
                          onClick={() => isRowFullySelected('base') ? unselectRow('base') : selectRow('base')}
                          className={`ml-2 text-xs font-medium transition-colors duration-200 ${
                            isRowFullySelected('base') 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {isRowFullySelected('base') ? 'Unselect All' : 'Select All'}
                        </button>
        </div>
                    </td>
                    {calendarData.agoda.date_columns.map((d: any) => {
                      const date = formatDate(d);
                      const isSelected = isCellSelected(date, 'base');
                      const isInDragRange = isCellInDragRange(date, 'base');
                      return (
                        <td 
                          key={d.date} 
                          className={`px-4 py-4 text-center ${isInDragRange ? 'bg-blue-100' : ''}`}
                          onMouseDown={() => handleMouseDown(date, 'base')}
                          onMouseEnter={() => handleMouseEnter(date, 'base')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="number"
                              className="w-20 text-center"
                              value={
                                (basePriceEdits[date] ?? d.base_room_rate ?? "").toString()
                              }
                              onChange={e =>
                                handleBasePriceChange(date, Number(e.target.value))
                              }
                            />
                            <button
                              onClick={() => toggleCellSelection(date, 'base')}
                              className={`p-1 rounded transition-colors duration-200 ${
                                isSelected 
                                  ? 'text-blue-600 bg-blue-50' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Merged Availability Section */}
                  <tr>
                    <td colSpan={calendarData.agoda.date_columns.length + 1} className="px-6 py-3 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">Room Availability</span>
                      </div>
                    </td>
                  </tr>
                  {getMergedRooms().map((mergedRoom: any) => (
                    <tr key={mergedRoom.room_class} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">{mergedRoom.room_class}</div>
                            {mergedRoom.agoda && (
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                                <span className="text-sm">{mergedRoom.agoda.room_name}</span>
                              </div>
                            )}
                            {mergedRoom.hyperguest && (
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">H</div>
                                <span className="text-sm">{mergedRoom.hyperguest.room_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {calendarData.agoda.date_columns.map((d: any) => {
                        const date = formatDate(d);
                        const agodaValue = mergedRoom.agoda ? 
                          (inventoryEdits.agoda[mergedRoom.agoda.agoda_room_id]?.[date] ??
                           d.room_inventory.find((r: any) => r.agoda_room_id === mergedRoom.agoda.agoda_room_id)?.availability ?? "") : "";
                        const hyperguestValue = mergedRoom.hyperguest ? 
                          (inventoryEdits.hyperguest[mergedRoom.hyperguest.hyperguest_room_id]?.[date] ??
                           calendarData.hyperguest.date_columns.find((col: any) => formatDate(col) === date)?.room_inventory.find((r: any) => r.hyperguest_room_id === mergedRoom.hyperguest.hyperguest_room_id)?.availability ?? "") : "";
                        
                        const isAgodaSelected = mergedRoom.agoda ? isCellSelected(date, mergedRoom.agoda.agoda_room_id, 'agoda') : false;
                        const isHyperguestSelected = mergedRoom.hyperguest ? isCellSelected(date, mergedRoom.hyperguest.hyperguest_room_id, 'hyperguest') : false;
                        const isInDragRange = mergedRoom.agoda ? isCellInDragRange(date, mergedRoom.agoda.agoda_room_id, 'agoda') : false;
                        
                        return (
                          <td 
                            key={d.date} 
                            className={`px-4 py-4 text-start ${isInDragRange ? 'bg-green-100' : ''}`}
                            onMouseDown={() => mergedRoom.agoda && handleMouseDown(date, mergedRoom.agoda.agoda_room_id, 'agoda')}
                            onMouseEnter={() => mergedRoom.agoda && handleMouseEnter(date, mergedRoom.agoda.agoda_room_id, 'agoda')}
                          >
                            <div className="space-y-1">
                              {/* Agoda Input */}
                              {mergedRoom.agoda && (
                                <div className="flex items-center justify-center gap-1">
                                  <Input
                                    type="number"
                                    className="w-16 text-center text-sm"
                                    value={agodaValue}
                                    onChange={e =>
                                      handleInventoryChange(
                                        "agoda",
                                        mergedRoom.agoda.agoda_room_id,
                                        date,
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                  <button
                                    onClick={() => toggleCellSelection(date, mergedRoom.agoda.agoda_room_id, 'agoda')}
                                    className={`p-1 rounded transition-colors duration-200 ${
                                      isAgodaSelected 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    {isAgodaSelected ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                              
                              {/* HyperGuest Text (only show if different from Agoda) */}
                              {/* {mergedRoom.hyperguest && agodaValue !== hyperguestValue && ( */}
                                <div className="text-xs text-gray-500">
                                  HG: {hyperguestValue}
                                </div>
                              {/* )} */}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No calendar data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a property ID and click search to load calendar data.
            </p>
          </div>
        )}
    </div>
    </PageTransitionWrapper>
  );
}