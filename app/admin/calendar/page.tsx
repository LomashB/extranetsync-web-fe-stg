"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Save,
  Search,
  CheckSquare,
  Eraser,
  Square,
  Check,
  Building2,
  Globe,
  Bed,
  Star,
  Settings,
  Clock,
  CreditCard,
  Percent,
  Calendar,
} from "lucide-react";
import Button from "../../../components/UI/Button";
import Input from "../../../components/UI/Input";
import SearchInput from "../../../components/UI/SearchInput";
import Shimmer from "../../../components/UI/Shimmer";
import Modal from "../../../components/UI/Modal";
import PageTransitionWrapper from "../../../components/PageTransitionWrapper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

// ══════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ══════════════════════════════════════════════════════════════
const formatDate = (d: Date | string | any) => {
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (d && typeof d === "object") {
    if (d.fullDate) return d.fullDate;
    if (d.isoDate || d.iso_date) return d.isoDate || d.iso_date;
    if (d.date) {
      if (typeof d.date === "string") return d.date;
      if (d.date instanceof Date) return d.date.toISOString().slice(0, 10);
      if (typeof d.date === "number") {
        const year = d.year || new Date().getFullYear();
        const month = d.month || new Date().getMonth() + 1;
        const day = d.date;
        return `${year}-${String(month).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
      }
    }
  }
  return "";
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ══════════════════════════════════════════════════════════════
// INTERFACES - UPDATED FOR NEW API
// ══════════════════════════════════════════════════════════════
interface RoomInventory {
  agoda_room_id?: string;
  room_type_code?: string;
  rate_plan_code?: string;
  room_name: string;
  inventory: number;
  availability: number;
  booked_rooms: number;
  occupancy_rate: number;
  price?: number | null;
  currency?: string | null;
  has_pricing: boolean;
  availability_status: string;
  close_out: string;
  max_occupancy: number;
  has_availability_data: boolean;
  sync_status: string;
  restrictions: {
    closed: boolean;
    ctd: boolean;
    cta: boolean;
  };
}

interface DateColumn {
  month: string;
  date: number;
  day: string;
  average_room_rate?: number | null;
  currency?: string | null;
  inventory: number;
  availability: number;
  booked_rooms: number;
  occupancy_rate: number;
  availability_status: string;
  close_out: string;
  room_inventory: RoomInventory[];
  fullDate?: string;
}

interface CalendarData {
  property_id: string;
  property_name: string;
  agoda: {
    property_id: string;
    property_name: string;
    date_columns: DateColumn[];
  };
  hyperguest: {
    property_code: string;
    property_name: string;
    date_columns: DateColumn[];
  };
  ota_configuration: {
    agoda_enabled: boolean;
    hyperguest_enabled: boolean;
    hyperguest_property_code: string;
  };
}

interface MergedRoom {
  room_id: string;
  room_name: string;
  ota: "agoda" | "hyperguest";
  room_data: RoomInventory;
}

// ══════════════════════════════════════════════════════════════
// SHIMMER COMPONENTS
// ══════════════════════════════════════════════════════════════
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4">
      <Shimmer className="h-12 w-full" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="h-12 w-full" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="h-12 w-full" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="h-12 w-full" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="h-12 w-full" />
    </td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CalendarManagement() {
  // ─────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  // Property options
  const [propertyOptions, setPropertyOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Edit states - UPDATED FOR PER-ROOM PRICING
  const [priceEdits, setPriceEdits] = useState<
    Record<string, Record<string, number>>
  >({});
  const [inventoryEdits, setInventoryEdits] = useState<
    Record<string, Record<string, number>>
  >({});
  const [closeOutEdits, setCloseOutEdits] = useState<
    Record<string, Record<string, "Y" | "N">>
  >({});

  // Selection states
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState<
    "none" | "price" | "availability"
  >("none");

  // Modal states
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    date: string;
    roomId: string;
    ota?: "agoda" | "hyperguest";
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{
    date: string;
    roomId: string;
    ota?: "agoda" | "hyperguest";
  } | null>(null);

  // Client-side mount state to prevent hydration errors
  const [mounted, setMounted] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // FETCH PROPERTY OPTIONS
  // ─────────────────────────────────────────────────────────────
  const fetchPropertyOptions = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const response = await axios.get("/admin/ota-status");
      if (response.data.success && response.data.data.configurations) {
        const options = response.data.data.configurations.map(
          (config: any) => ({
            value: config.property_id,
            label: `${config.agoda_property_name} (ID: ${config.property_id})`,
          })
        );
        setPropertyOptions(options);
      }
    } catch (error: any) {
      console.error("Error fetching property options:", error);
      toast.error("Failed to load property options");
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // FETCH CALENDAR DATA - UPDATED FOR NEW API
  // ─────────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    if (!propertyId.trim()) {
      toast.error("Please enter property ID.");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    setInitialLoading(true);
    setCalendarData(null);

    try {
      const resp = await axios.get(
        `/admin/availability?days=14&start_date=${formatDate(
          startDate
        )}&end_date=${formatDate(endDate)}&property_id=${propertyId}`
      );
      const data = resp.data.RESULT?.[0] || null;

      if (data) {
        const baseDate = new Date(startDate);
        const enrichColumns = (columns?: any[]) =>
          (columns || []).map((col, index) => ({
            ...col,
            fullDate: addDays(baseDate, index).toISOString().slice(0, 10),
          }));

        data.agoda = {
          ...data.agoda,
          date_columns: enrichColumns(data.agoda?.date_columns),
        };

        data.hyperguest = {
          ...data.hyperguest,
          date_columns: enrichColumns(data.hyperguest?.date_columns),
        };

        setCalendarData(data);
        setPriceEdits({});
        setInventoryEdits({});
        setCloseOutEdits({});
        setSelectedCells(new Set());
        setSelectionMode("none");
        toast.success("Calendar data loaded successfully!");
      }
    } catch (error: any) {
      console.error("Fetch calendar error:", error);
      toast.error(error.response?.data?.MESSAGE || "Failed to load calendar.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [propertyId, startDate, endDate]);

  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPropertyOptions();
  }, [fetchPropertyOptions]);

  useEffect(() => {
    if (propertyId.trim()) {
      fetchCalendar();
    }
  }, [propertyId, fetchCalendar]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isDragging,
    dragStart,
    dragEnd,
    calendarData,
    selectedCells,
    selectionMode,
  ]);

  // ─────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  const createCellKey = (
    date: string,
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    return `${type}_${roomId}_${date}`;
  };

  const isCellSelected = (
    date: string,
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    const cellKey = createCellKey(date, roomId, type);
    return selectedCells.has(cellKey);
  };

  const toggleCellSelection = (
    date: string,
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    const cellKey = createCellKey(date, roomId, type);

    setSelectedCells((prev) => {
      // Only keep selections for the current type to enforce exclusivity
      const newSet = new Set<string>();
      prev.forEach((key) => {
        if (type === "price" && key.startsWith("price_")) {
          newSet.add(key);
        }
        if (type === "inventory" && key.startsWith("inventory_")) {
          newSet.add(key);
        }
      });

      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }

      const newMode: typeof selectionMode =
        newSet.size === 0
          ? "none"
          : type === "price"
          ? "price"
          : "availability";
      setSelectionMode(newMode);

      return newSet;
    });
  };

  const isRowFullySelected = (
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return false;
    const dates = calendarData.agoda.date_columns.map((d) => formatDate(d));
    return dates.every((date) => isCellSelected(date, roomId, type));
  };

  const selectRoomRow = (
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return;
    const dates = calendarData.agoda.date_columns.map((d) => formatDate(d));

    // Start from only the currently relevant type to keep modes exclusive
    const newSelection = new Set<string>();
    selectedCells.forEach((key) => {
      if (type === "price" && key.startsWith("price_")) {
        newSelection.add(key);
      }
      if (type === "inventory" && key.startsWith("inventory_")) {
        newSelection.add(key);
      }
    });

    dates.forEach((date) => {
      newSelection.add(createCellKey(date, roomId, type));
    });

    setSelectedCells(newSelection);
    if (type === "price") setSelectionMode("price");
    else setSelectionMode("availability");
  };

  const unselectRoomRow = (
    roomId: string,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return;
    const dates = calendarData.agoda.date_columns.map((d) => formatDate(d));
    const newSelection = new Set(selectedCells);

    dates.forEach((date) => {
      newSelection.delete(createCellKey(date, roomId, type));
    });

    setSelectedCells(newSelection);
  };

  const isColumnFullySelected = (
    dateObj: any,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return false;
    const date = formatDate(dateObj);
    const allRooms = getAllRooms();

    return allRooms.every((room) => isCellSelected(date, room.room_id, type));
  };

  const selectColumn = (
    dateObj: any,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return;
    const date = formatDate(dateObj);

    // Start from only the currently relevant type to keep modes exclusive
    const newSelection = new Set<string>();
    selectedCells.forEach((key) => {
      if (type === "price" && key.startsWith("price_")) {
        newSelection.add(key);
      }
      if (type === "inventory" && key.startsWith("inventory_")) {
        newSelection.add(key);
      }
    });
    const allRooms = getAllRooms();

    allRooms.forEach((room) => {
      newSelection.add(createCellKey(date, room.room_id, type));
    });

    setSelectedCells(newSelection);
    if (type === "price") setSelectionMode("price");
    else setSelectionMode("availability");
  };

  const unselectColumn = (
    dateObj: any,
    type: "price" | "inventory" = "price"
  ) => {
    if (!calendarData) return;
    const date = formatDate(dateObj);
    const newSelection = new Set(selectedCells);
    const allRooms = getAllRooms();

    allRooms.forEach((room) => {
      newSelection.delete(createCellKey(date, room.room_id, type));
    });

    setSelectedCells(newSelection);
  };

  const getAllRooms = (): MergedRoom[] => {
    if (!calendarData) return [];

    const agodaRoomMap = new Map<string, RoomInventory>();
    const hgRoomMap = new Map<string, RoomInventory>();

    // Collect unique Agoda rooms across all dates
    (calendarData.agoda?.date_columns || []).forEach((col) => {
      (col.room_inventory || []).forEach((room) => {
        if (room.agoda_room_id && !agodaRoomMap.has(room.agoda_room_id)) {
          agodaRoomMap.set(room.agoda_room_id, room);
        }
      });
    });

    // Collect unique HyperGuest rooms across all dates
    (calendarData.hyperguest?.date_columns || []).forEach((col) => {
      (col.room_inventory || []).forEach((room) => {
        if (room.room_type_code && room.rate_plan_code) {
          const id = `${room.room_type_code}_${room.rate_plan_code}`;
          if (!hgRoomMap.has(id)) {
            hgRoomMap.set(id, room);
          }
        }
      });
    });

    const agodaRooms: MergedRoom[] = Array.from(agodaRoomMap.entries()).map(
      ([room_id, room]) => ({
        room_id,
        room_name: room.room_name,
        ota: "agoda" as const,
        room_data: room,
      })
    );

    const hgRooms: MergedRoom[] = Array.from(hgRoomMap.entries()).map(
      ([id, room]) => ({
        room_id: id,
        room_name: room.room_name,
        ota: "hyperguest" as const,
        room_data: room,
      })
    );

    return [...agodaRooms, ...hgRooms];
  };

  const clearSelection = () => {
    setSelectedCells(new Set());
    setSelectionMode("none");
  };

  // ─────────────────────────────────────────────────────────────
  // EDIT HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handlePriceChange = (roomId: string, date: string, value: number) => {
    setPriceEdits((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [date]: value,
      },
    }));
  };

  const handleInventoryChange = (
    roomId: string,
    date: string,
    value: number
  ) => {
    setInventoryEdits((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [date]: value,
      },
    }));
  };

  const batchUpdateSelected = (value: number) => {
    if (selectionMode === "price") {
      const newPriceEdits = { ...priceEdits };
      const selectedDates = new Set<string>();

      // Update price edits for all selected price cells (Agoda + HyperGuest)
      selectedCells.forEach((cellKey) => {
        if (!cellKey.startsWith("price_")) return;

        // cellKey format: "price_${roomId}_${date}"
        const parts = cellKey.split("_");
        if (parts.length < 3) return;

        // Date is always the last segment (YYYY-MM-DD)
        const date = parts[parts.length - 1];
        // RoomId is everything between "price" and the date (can contain underscores for HyperGuest)
        const roomId = parts.slice(1, -1).join("_");

        selectedDates.add(date);

        if (!newPriceEdits[roomId]) newPriceEdits[roomId] = {};
        newPriceEdits[roomId][date] = value;
      });

      // Also apply the same price to all HyperGuest rooms for selected dates
      if (selectedDates.size > 0 && calendarData) {
        const allRooms = getAllRooms();
        const hgRooms = allRooms.filter((r) => r.ota === "hyperguest");

        selectedDates.forEach((date) => {
          hgRooms.forEach((room) => {
            if (!newPriceEdits[room.room_id]) newPriceEdits[room.room_id] = {};
            newPriceEdits[room.room_id][date] = value;
          });
        });
      }

      setPriceEdits(newPriceEdits);
    } else if (selectionMode === "availability") {
      const newInventoryEdits = { ...inventoryEdits };

      // Update availability for all selected availability cells (Agoda + HyperGuest)
      selectedCells.forEach((cellKey) => {
        if (!cellKey.startsWith("inventory_")) return;

        // cellKey format: "inventory_${roomId}_${date}"
        const parts = cellKey.split("_");
        if (parts.length < 3) return;

        // Date is always the last segment (YYYY-MM-DD)
        const date = parts[parts.length - 1];
        // RoomId is everything between "inventory" and the date (can contain underscores for HyperGuest)
        const roomId = parts.slice(1, -1).join("_");

        if (!newInventoryEdits[roomId]) newInventoryEdits[roomId] = {};
        newInventoryEdits[roomId][date] = value;
      });

      setInventoryEdits(newInventoryEdits);
    }
  };

  const batchUpdateCloseOut = (closeOut: "Y" | "N") => {
    if (selectionMode === "availability") {
      const newCloseOutEdits = { ...closeOutEdits };

      // Update close_out for all selected availability cells (Agoda + HyperGuest)
      selectedCells.forEach((cellKey) => {
        if (!cellKey.startsWith("inventory_")) return;

        // cellKey format: "inventory_${roomId}_${date}"
        const parts = cellKey.split("_");
        if (parts.length < 3) return;

        // Date is always the last segment (YYYY-MM-DD)
        const date = parts[parts.length - 1];
        // RoomId is everything between "inventory" and the date (can contain underscores for HyperGuest)
        const roomId = parts.slice(1, -1).join("_");

        if (!newCloseOutEdits[roomId]) newCloseOutEdits[roomId] = {};
        newCloseOutEdits[roomId][date] = closeOut;
      });

      setCloseOutEdits(newCloseOutEdits);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DRAG SELECTION HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleMouseDown = (
    date: string,
    roomId: string,
    ota?: "agoda" | "hyperguest"
  ) => {
    setIsDragging(true);
    setDragStart({ date, roomId, ota });
    setDragEnd({ date, roomId, ota });
  };

  const handleMouseEnter = (
    date: string,
    roomId: string,
    ota?: "agoda" | "hyperguest"
  ) => {
    if (isDragging && dragStart) {
      setDragEnd({ date, roomId, ota });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && calendarData) {
      const allDates = calendarData.agoda.date_columns.map((d) =>
        formatDate(d)
      );
      const startDateIndex = allDates.indexOf(dragStart.date);
      const endDateIndex = allDates.indexOf(dragEnd.date);

      if (startDateIndex === -1 || endDateIndex === -1) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      const minDateIndex = Math.min(startDateIndex, endDateIndex);
      const maxDateIndex = Math.max(startDateIndex, endDateIndex);
      const dateRange = allDates.slice(minDateIndex, maxDateIndex + 1);

      const allRooms = getAllRooms();
      const startRoomIndex = allRooms.findIndex(
        (r) => r.room_id === dragStart.roomId
      );
      const endRoomIndex = allRooms.findIndex(
        (r) => r.room_id === dragEnd.roomId
      );

      if (startRoomIndex !== -1 && endRoomIndex !== -1) {
        const minRoomIndex = Math.min(startRoomIndex, endRoomIndex);
        const maxRoomIndex = Math.max(startRoomIndex, endRoomIndex);
        const roomRange = allRooms.slice(minRoomIndex, maxRoomIndex + 1);

        // Start with only the current selection mode type to keep modes exclusive
        const newSelection = new Set<string>();
        selectedCells.forEach((key) => {
          if (selectionMode === "price" && key.startsWith("price_")) {
            newSelection.add(key);
          }
          if (selectionMode === "availability" && key.startsWith("inventory_")) {
            newSelection.add(key);
          }
        });

        // Add all cells in the drag range
        const type: "price" | "inventory" = selectionMode === "price" ? "price" : "inventory";
        const modeToSet: "price" | "availability" = type === "price" ? "price" : "availability";
        roomRange.forEach((room) => {
          dateRange.forEach((date) => {
            newSelection.add(createCellKey(date, room.room_id, type));
          });
        });

        setSelectedCells(newSelection);
        if (selectionMode === "none") {
          setSelectionMode(modeToSet);
        }
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isCellInDragRange = (date: string, roomId: string) => {
    if (!isDragging || !dragStart || !dragEnd || !calendarData) return false;

    const allDates = calendarData.agoda.date_columns.map((d) => formatDate(d));
    const currentDateIndex = allDates.indexOf(date);
    const startDateIndex = allDates.indexOf(dragStart.date);
    const endDateIndex = allDates.indexOf(dragEnd.date);

    if (currentDateIndex === -1 || startDateIndex === -1 || endDateIndex === -1)
      return false;

    const minDateIndex = Math.min(startDateIndex, endDateIndex);
    const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    const isInDateRange =
      currentDateIndex >= minDateIndex && currentDateIndex <= maxDateIndex;

    if (!isInDateRange) return false;

    const allRooms = getAllRooms();
    const currentRoomIndex = allRooms.findIndex((r) => r.room_id === roomId);
    const startRoomIndex = allRooms.findIndex(
      (r) => r.room_id === dragStart.roomId
    );
    const endRoomIndex = allRooms.findIndex(
      (r) => r.room_id === dragEnd.roomId
    );

    if (currentRoomIndex === -1 || startRoomIndex === -1 || endRoomIndex === -1)
      return false;

    const minRoomIndex = Math.min(startRoomIndex, endRoomIndex);
    const maxRoomIndex = Math.max(startRoomIndex, endRoomIndex);

    return currentRoomIndex >= minRoomIndex && currentRoomIndex <= maxRoomIndex;
  };

  // ─────────────────────────────────────────────────────────────
  // SAVE CHANGES - UPDATED FOR NEW API
  // ─────────────────────────────────────────────────────────────
  const saveAllChanges = async () => {
    if (!calendarData) return;

    setSaving(true);
    try {
      // Build a union of all dates from both Agoda and HyperGuest so we send pricing for both
      const agodaDates = (calendarData.agoda?.date_columns || []).map((d) =>
        formatDate(d)
      );
      const hyperguestDates = (calendarData.hyperguest?.date_columns || []).map(
        (d) => formatDate(d)
      );
      const allDatesSet = new Set<string>([...agodaDates, ...hyperguestDates]);
      const allDates = Array.from(allDatesSet);

      // Prepare pricing updates for new bulk API
      const pricingPayload: Array<{
        date: string;
        agoda_rooms: Array<{ agoda_room_id: string; price: number }>;
        hyperguest_rooms: Array<{
          room_type_code: string;
          rate_plan_code: string;
          price: number;
        }>;
      }> = [];

      allDates.forEach((date) => {
        const dateUpdate: {
          date: string;
          agoda_rooms: Array<{ agoda_room_id: string; price: number }>;
          hyperguest_rooms: Array<{
            room_type_code: string;
            rate_plan_code: string;
            price: number;
          }>;
        } = { date, agoda_rooms: [], hyperguest_rooms: [] };

        // Collect price updates for both Agoda and HyperGuest
        Object.entries(priceEdits).forEach(([roomId, roomDates]) => {
          const priceForDate = roomDates[date];
          if (!priceForDate) return;

          if (roomId.includes("_")) {
            // HyperGuest room: room_id is `${room_type_code}_${rate_plan_code}`
            const [room_type_code, rate_plan_code] = roomId.split("_");

            // Only send HyperGuest pricing when that room actually exists for this date
            const hgDateCol = calendarData.hyperguest?.date_columns.find(
              (col) => formatDate(col) === date
            );
            const hasRoomOnDate = hgDateCol?.room_inventory?.some(
              (r) =>
                r.room_type_code === room_type_code &&
                (r.rate_plan_code || "CP") === (rate_plan_code || "CP")
            );

            if (hasRoomOnDate) {
              dateUpdate.hyperguest_rooms.push({
                room_type_code,
                rate_plan_code: rate_plan_code || "CP",
                price: priceForDate,
              });
            }
          } else {
            // Agoda room: roomId is agoda_room_id
            dateUpdate.agoda_rooms.push({
              agoda_room_id: roomId,
              price: priceForDate,
            });
          }
        });

        if (
          dateUpdate.agoda_rooms.length > 0 ||
          dateUpdate.hyperguest_rooms.length > 0
        ) {
          pricingPayload.push(dateUpdate);
        }
      });

      // Send pricing updates if any
      if (pricingPayload.length > 0) {
        try {
          // API expects: { pricing: [ { date, agoda_rooms, hyperguest_rooms } ] }
          // {
          //   "pricing": [
          //     {
          //       "date": "2026-12-20",
          //       "agoda_rooms": [{ "agoda_room_id": "1217830716", "price": 2200 }],
          //       "hyperguest_rooms": [
          //         { "room_type_code": "Room-02", "rate_plan_code": "CP", "price": 200 }
          //       ]
          //     }
          //   ]
          // }
          await axios.put(`/admin/properties/${propertyId}/pricing/bulk`, {
            pricing: pricingPayload,
          });
          toast.success("Pricing updated successfully!");
        } catch (error: any) {
          console.error("Pricing update error:", error);
          const errorMessage =
            error.response?.data?.MESSAGE ||
            error.response?.data?.message ||
            (error.code === "ERR_NETWORK"
              ? "Network error: Please check your internet connection and try again."
              : error.message) ||
            "Failed to update pricing. Please try again.";
          toast.error(errorMessage);
          setSaving(false);
          return; // Exit early if pricing update fails
        }
      }

      // Prepare availability updates (Agoda + HyperGuest)
      const availabilityUpdates: Array<any> = [];
      const updatesMap = new Map<string, any>();

      // Process inventory edits
      Object.entries(inventoryEdits).forEach(([roomId, dates]) => {
        Object.entries(dates).forEach(([date, available_rooms]) => {
          const key = `${roomId}_${date}`;
          if (!updatesMap.has(key)) {
            updatesMap.set(key, { roomId, date, available_rooms });
          } else {
            updatesMap.get(key).available_rooms = available_rooms;
          }
        });
      });

      // Process close_out edits
      Object.entries(closeOutEdits).forEach(([roomId, dates]) => {
        Object.entries(dates).forEach(([date, close_out]) => {
          const key = `${roomId}_${date}`;
          if (!updatesMap.has(key)) {
            updatesMap.set(key, { roomId, date, close_out });
          } else {
            updatesMap.get(key).close_out = close_out;
          }
        });
      });

      // Build availability updates array
      updatesMap.forEach((update) => {
        const { roomId, date, available_rooms, close_out } = update;

        if (roomId.includes("_") && roomId.split("_").length >= 2) {
          // HyperGuest room: room_id is `${room_type_code}_${rate_plan_code}`
          const roomParts = roomId.split("_");
          const rate_plan_code = roomParts.pop() || "CP";
          const room_type_code = roomParts.join("_");

          // Only send HyperGuest availability when that room actually exists for this date
          const hgDateCol = calendarData.hyperguest?.date_columns.find(
            (col) => formatDate(col) === date
          );
          const hasRoomOnDate = hgDateCol?.room_inventory?.some(
            (r) =>
              r.room_type_code === room_type_code &&
              (r.rate_plan_code || "CP") === (rate_plan_code || "CP")
          );

          if (hasRoomOnDate) {
            const updatePayload: any = {
              room_type_code,
              rate_plan_code: rate_plan_code || "CP",
              date,
              closed: false,
              ctd: false,
              cta: false,
            };
            if (available_rooms !== undefined) {
              updatePayload.available_rooms = available_rooms;
            }
            if (close_out !== undefined) {
              updatePayload.close_out = close_out;
            }
            availabilityUpdates.push(updatePayload);
          }
        } else {
          // Agoda room
          const updatePayload: any = {
            agoda_room_id: roomId,
            date,
            closed: false,
            ctd: false,
            cta: false,
          };
          if (available_rooms !== undefined) {
            updatePayload.available_rooms = available_rooms;
          }
          if (close_out !== undefined) {
            updatePayload.close_out = close_out;
          }
          availabilityUpdates.push(updatePayload);
        }
      });

      // Send availability updates if any
      if (availabilityUpdates.length > 0) {
        try {
          await axios.put("/admin/availability/bulk-update", {
            property_id: propertyId,
            updates: availabilityUpdates,
          });
          toast.success("Availability updated successfully!");
        } catch (error: any) {
          console.error("Availability update error:", error);
          const errorMessage =
            error.response?.data?.MESSAGE ||
            error.response?.data?.message ||
            (error.code === "ERR_NETWORK"
              ? "Network error: Please check your internet connection and try again."
              : error.message) ||
            "Failed to update availability. Please try again.";
          toast.error(errorMessage);
          setSaving(false);
          return; // Exit early if availability update fails
        }
      }

      // Clear edits and selections only if all requests succeeded
      setPriceEdits({});
      setInventoryEdits({});
      setCloseOutEdits({});
      setSelectedCells(new Set());
      setSelectionMode("none");

      // Refresh data
      await fetchCalendar();
    } catch (error: any) {
      // Fallback error handler for any unexpected errors
      console.error("Save error:", error);
      const errorMessage =
        error.response?.data?.MESSAGE ||
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK"
          ? "Network error: Please check your internet connection and try again."
          : error.message) ||
        "Failed to save changes. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    Object.keys(priceEdits).length > 0 ||
    Object.keys(inventoryEdits).length > 0 ||
    Object.keys(closeOutEdits).length > 0;
  const selectedCount = selectedCells.size;

  // ─────────────────────────────────────────────────────────────
  // CUSTOM SELECT STYLES
  // ─────────────────────────────────────────────────────────────
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "42px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#111827",
      fontSize: "14px",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#f3f4f6"
        : state.isFocused
        ? "#f9fafb"
        : "white",
      color: state.isSelected ? "#111827" : "#111827",
      fontSize: "14px",
      padding: "8px 12px",
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  // ═════════════════════════════════════════════════════════════
  // RENDER - SHIMMER LOADING STATE
  // ═════════════════════════════════════════════════════════════
  if (initialLoading) {
    return (
      <PageTransitionWrapper>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date 3
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <ShimmerTableRows />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageTransitionWrapper>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER - MAIN UI
  // ═════════════════════════════════════════════════════════════
  return (
    <PageTransitionWrapper>
      <div
        className={`mx-auto space-y-6 p-2 md:p-4 ${
          isDragging ? "select-none" : ""
        }`}
      >
        {/* ──────────────────────────────────────────────────────── */}
        {/* HEADER */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Calendar Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage pricing and availability across Agoda and HyperGuest
              platforms
            </p>
            {calendarData && (
              <div className="mt-3 md:flex hidden md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Property:
                  </span>
                  <span className="text-sm text-gray-900">
                    {calendarData.property_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {calendarData.property_id}
                  </span>
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
                Clear Selection ({selectedCount})
              </Button>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* FILTER CONTROLS */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="">
          <div className="flex flex-col md:flex-row gap-4 md:items-end md:gap-2">
            <div className="flex-1 md:max-w-sm">
            
              <Select
                id="calendar-property-select"
                instanceId="calendar-property-select"
                value={
                  propertyOptions.find(
                    (option) => option.value === propertyId
                  ) || null
                }
                onChange={(selectedOption) =>
                  setPropertyId(selectedOption?.value || "")
                }
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
              
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => {
                    setTempStartDate(startDate);
                    setTempEndDate(endDate);
                    setIsDateModalOpen(true);
                  }}
                >
                  {formatDate(startDate)} → {formatDate(endDate)}
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:pb-1">
                <Button
                  variant="secondary"
                  leftIcon={
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  }
                  onClick={fetchCalendar}
                  disabled={loading || !propertyId.trim()}
                  className="flex-1 md:w-auto"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* DATE RANGE MODAL */}
        {/* ──────────────────────────────────────────────────────── */}
        <Modal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          title="Select Date Range"
          primaryActionLabel="Apply"
          onPrimaryAction={() => {
            if (!tempStartDate || !tempEndDate) {
              toast.error("Please select both start and end dates.");
              return;
            }
            if (tempEndDate < tempStartDate) {
              toast.error("End date cannot be before start date.");
              return;
            }
            setStartDate(tempStartDate);
            setEndDate(tempEndDate);
            setIsDateModalOpen(false);
          }}
          size="lg"
        >
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-800">
              {`${formatDate(tempStartDate)} → ${formatDate(tempEndDate)}`}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Start Date
              </p>
              <DatePicker
                selected={tempStartDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setTempStartDate(date);
                    if (tempEndDate < date) setTempEndDate(date);
                  }
                }}
                selectsStart
                startDate={tempStartDate}
                inline
                minDate={new Date()}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">End Date</p>
              <DatePicker
                selected={tempEndDate}
                onChange={(date: Date | null) => date && setTempEndDate(date)}
                selectsEnd
                endDate={tempEndDate}
                minDate={tempStartDate}
                inline
              />
            </div>
          </div>
        </Modal>

        {/* ──────────────────────────────────────────────────────── */}
        {/* BULK OPERATIONS */}
        {/* ──────────────────────────────────────────────────────── */}
        {calendarData && (
          <div className="">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Bulk Select:
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const allRooms = getAllRooms();
                      const dates = calendarData.agoda.date_columns.map((d) =>
                        formatDate(d)
                      );
                      const allPriceCells = allRooms.flatMap((room) =>
                        dates.map((date) =>
                          createCellKey(date, room.room_id, "price")
                        )
                      );
                      const allSelected = allPriceCells.every((cell) =>
                        selectedCells.has(cell)
                      );

                      if (allSelected) {
                        const newSelection = new Set(selectedCells);
                        allPriceCells.forEach((cell) =>
                          newSelection.delete(cell)
                        );
                        setSelectedCells(newSelection);
                        if (newSelection.size === 0) setSelectionMode("none");
                      } else {
                        // When bulk-selecting prices, clear all availability selections
                        setSelectionMode("price");
                        setSelectedCells((prev) => {
                          const base = new Set<string>();
                          prev.forEach((key) => {
                            if (key.startsWith("price_")) {
                              base.add(key);
                            }
                          });
                          allPriceCells.forEach((cell) => base.add(cell));
                          return base;
                        });
                      }
                    }}
                    leftIcon={<CheckSquare className="h-4 w-4" />}
                    className="flex-1 sm:flex-none whitespace-nowrap"
                  >
                    {(() => {
                      const allRooms = getAllRooms();
                      const dates = calendarData.agoda.date_columns.map((d) =>
                        formatDate(d)
                      );
                      const allPriceCells = allRooms.flatMap((room) =>
                        dates.map((date) =>
                          createCellKey(date, room.room_id, "price")
                        )
                      );
                      const allSelected = allPriceCells.every((cell) =>
                        selectedCells.has(cell)
                      );
                      return allSelected
                        ? "Unselect All Prices"
                        : "Select All Prices";
                    })()}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const allRooms = getAllRooms();
                      const dates = calendarData.agoda.date_columns.map((d) =>
                        formatDate(d)
                      );
                      const allInventoryCells = allRooms.flatMap((room) =>
                        dates.map((date) =>
                          createCellKey(date, room.room_id, "inventory")
                        )
                      );
                      const allSelected = allInventoryCells.every((cell) =>
                        selectedCells.has(cell)
                      );

                      if (allSelected) {
                        const newSelection = new Set(selectedCells);
                        allInventoryCells.forEach((cell) =>
                          newSelection.delete(cell)
                        );
                        setSelectedCells(newSelection);
                        if (newSelection.size === 0) setSelectionMode("none");
                      } else {
                        // When bulk-selecting availability, clear all price selections
                        setSelectionMode("availability");
                        setSelectedCells((prev) => {
                          const base = new Set<string>();
                          prev.forEach((key) => {
                            if (key.startsWith("inventory_")) {
                              base.add(key);
                            }
                          });
                          allInventoryCells.forEach((cell) => base.add(cell));
                          return base;
                        });
                      }
                    }}
                    leftIcon={<CheckSquare className="h-4 w-4" />}
                    className="flex-1 sm:flex-none whitespace-nowrap"
                  >
                    {(() => {
                      const allRooms = getAllRooms();
                      const dates = calendarData.agoda.date_columns.map((d) =>
                        formatDate(d)
                      );
                      const allInventoryCells = allRooms.flatMap((room) =>
                        dates.map((date) =>
                          createCellKey(date, room.room_id, "inventory")
                        )
                      );
                      const allSelected = allInventoryCells.every((cell) =>
                        selectedCells.has(cell)
                      );
                      return allSelected
                        ? "Unselect All Availability"
                        : "Select All Availability";
                    })()}
                  </Button>
                </div>

                {selectedCount > 0 && (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-gray-200 md:border-t-0 md:pt-0">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
                      <div className="flex flex-col items-center gap-1">
                      {selectedCount} cells selected
                      {selectionMode !== "none" && (
                        <span className="p-1 rounded text-xs font-medium">
                          {selectionMode === "price" ? (
                            <span className="bg-blue-100 text-blue-800">
                              Price Mode
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-800">
                              Availability Mode
                            </span>
                          )}
                        </span>
                      )}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Set value"
                        className="w-full md:w-auto"
                        onChange={(e) =>
                          batchUpdateSelected(Number(e.target.value))
                        }
                      />
                      {selectionMode === "availability" && (
                        <div className="flex flex-row items-center gap-2 ml-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => batchUpdateCloseOut("Y")}
                            className="text-xs whitespace-nowrap"
                          >
                            Close Out (Y)
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => batchUpdateCloseOut("N")}
                            className="text-xs whitespace-nowrap"
                          >
                            Open (N)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* CALENDAR TABLE */}
        {/* ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Loading calendar data...
              </span>
            </div>
          </div>
        ) : calendarData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[250px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Room / Date
                      </div>
                    </th>
                    {calendarData.agoda.date_columns.map((d) => {
                      const isPriceColFullySelected = isColumnFullySelected(
                        d,
                        "price"
                      );
                      const isAvailColFullySelected = isColumnFullySelected(
                        d,
                        "inventory"
                      );
                      const dateKey = formatDate(d);

                      return (
                        <th
                          key={dateKey}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold text-gray-900">
                              {d.day}
                            </span>
                            <span className="text-gray-400">
                              {d.date}/{d.month}
                            </span>
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() =>
                                  isPriceColFullySelected
                                    ? unselectColumn(d, "price")
                                    : selectColumn(d, "price")
                                }
                                className="text-xs font-medium transition-colors duration-200 px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: isPriceColFullySelected
                                    ? "#fee2e2"
                                    : "#dbeafe",
                                  color: isPriceColFullySelected
                                    ? "#991b1b"
                                    : "#1e40af",
                                }}
                              >
                                {isPriceColFullySelected
                                  ? "✕ Price"
                                  : "✓ Price"}
                              </button>
                              <button
                                onClick={() =>
                                  isAvailColFullySelected
                                    ? unselectColumn(d, "inventory")
                                    : selectColumn(d, "inventory")
                                }
                                className="text-xs font-medium transition-colors duration-200 px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: isAvailColFullySelected
                                    ? "#fee2e2"
                                    : "#d1fae5",
                                  color: isAvailColFullySelected
                                    ? "#991b1b"
                                    : "#065f46",
                                }}
                              >
                                {isAvailColFullySelected
                                  ? "✕ Avail"
                                  : "✓ Avail"}
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getAllRooms().map((room, roomIndex) => {
                    const isPriceRowFullySelected = isRowFullySelected(
                      room.room_id,
                      "price"
                    );
                    const isAvailRowFullySelected = isRowFullySelected(
                      room.room_id,
                      "inventory"
                    );

                    return (
                      <tr
                        key={`${room.room_id}-${roomIndex}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                          <div className="flex gap-4 items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* <div
                                className={`w-3 h-3 rounded ${
                                  room.ota === "agoda"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                                }`}
                              ></div> */}
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">
                                  {room.ota === "agoda"
                                    ? `Agoda: ${room.room_id}`
                                    : `HG: ${room.room_id}`}
                                </div>
                                <div className="text-xs font-medium max-w-[200px] whitespace-pre-line overflow-hidden text-ellipsis line-clamp-2 break-words">
                                  {room.room_name}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] mt-1">
                                  <span className="px-1.5 bg-gray-100 text-gray-800 rounded-md">
                                    Inv: {room.room_data.inventory}
                                  </span>
                                  <span className="px-1.5 bg-blue-100 text-blue-800 rounded-md">
                                    Avail: {room.room_data.availability}
                                  </span>
                                  {room.room_data.price && (
                                      <span className="px-1.5 bg-indigo-100 text-indigo-800 rounded-md">
                                      ₹{room.room_data.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center justify-between gap-1">
                               
                                <button
                                  onClick={() =>
                                    isPriceRowFullySelected
                                      ? unselectRoomRow(room.room_id, "price")
                                      : selectRoomRow(room.room_id, "price")
                                  }
                                  className="text-xs font-bold transition-colors duration-200 px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: isPriceRowFullySelected
                                      ? "#fee2e2"
                                      : "#dbeafe",
                                    color: isPriceRowFullySelected
                                      ? "#991b1b"
                                      : "#1e40af",
                                  }}
                                >
                                  {isPriceRowFullySelected
                                    ? "✕ Price"
                                    : "✓ Price"}
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                              
                                <button
                                  onClick={() =>
                                    isAvailRowFullySelected
                                      ? unselectRoomRow(room.room_id, "inventory")
                                      : selectRoomRow(room.room_id, "inventory")
                                  }
                                  className="text-xs font-bold transition-colors duration-200 px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: isAvailRowFullySelected
                                      ? "#fee2e2"
                                      : "#d1fae5",
                                    color: isAvailRowFullySelected
                                      ? "#991b1b"
                                      : "#065f46",
                                  }}
                                >
                                  {isAvailRowFullySelected
                                    ? "✕ Avail"
                                    : "✓ Avail"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {calendarData.agoda.date_columns.map((d) => {
                          const date = formatDate(d);
                          const isPriceSelected = isCellSelected(
                            date,
                            room.room_id,
                            "price"
                          );
                          const isAvailSelected = isCellSelected(
                            date,
                            room.room_id,
                            "inventory"
                          );
                          const isInDragRangePrice = isCellInDragRange(
                            date,
                            room.room_id
                          );

                          // Get current values from API or edits - per date and per OTA
                          let currentPrice = 0;
                          let currentAvail = 0;
                          let currentCloseOut: "Y" | "N" = "N";

                          if (room.ota === "hyperguest") {
                            const hgDateCol =
                              calendarData.hyperguest.date_columns.find(
                                (col) => formatDate(col) === date
                              );
                            if (hgDateCol && hgDateCol.room_inventory) {
                              const [room_type_code, rate_plan_code] =
                                room.room_id.split("_");
                              const hgRoom = hgDateCol.room_inventory.find(
                                (r) =>
                                  r.room_type_code === room_type_code &&
                                  (r.rate_plan_code || "CP") ===
                                    (rate_plan_code || "CP")
                              );
                              currentPrice = hgRoom?.price ?? 0;
                              currentAvail = hgRoom?.availability ?? 0;
                              currentCloseOut = (hgRoom?.close_out as "Y" | "N") ?? "N";
                            }
                          } else {
                            const agodaDateCol =
                              calendarData.agoda.date_columns.find(
                                (col) => formatDate(col) === date
                              );
                            if (agodaDateCol && agodaDateCol.room_inventory) {
                              const agodaRoom =
                                agodaDateCol.room_inventory.find(
                                  (r) => r.agoda_room_id === room.room_id
                                );
                              currentPrice = agodaRoom?.price ?? 0;
                              currentAvail = agodaRoom?.availability ?? 0;
                              currentCloseOut = (agodaRoom?.close_out as "Y" | "N") ?? "N";
                            }
                          }

                          const editedPrice =
                            priceEdits[room.room_id]?.[date] ?? currentPrice;
                          const editedAvail =
                            inventoryEdits[room.room_id]?.[date] ??
                            currentAvail;
                          const editedCloseOut =
                            closeOutEdits[room.room_id]?.[date] ?? currentCloseOut;

                          const isInDragRangeAvail = isCellInDragRange(
                            date,
                            room.room_id
                          );

                          return (
                            <td
                              key={date}
                              className={`px-4 py-4 text-center relative ${
                                isInDragRangePrice && selectionMode === "price"
                                  ? "bg-blue-50"
                                  : isInDragRangeAvail &&
                                    selectionMode === "availability"
                                  ? "bg-green-50"
                                  : ""
                              }`}
                              onMouseDown={(e) => {
                                // Only start drag if clicking on cell background, not on inputs or buttons
                                if (
                                  e.target === e.currentTarget ||
                                  (e.target as HTMLElement).closest(".cell-drag-area")
                                ) {
                                  // Determine which type based on where in the cell the click happened
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickY = e.clientY - rect.top;
                                  const cellHeight = rect.height;
                                  
                                  // If click is in upper half, select price; lower half, select availability
                                  const type = clickY < cellHeight / 2 ? "price" : "inventory";
                                  setSelectionMode(clickY < cellHeight / 2 ? "price" : "availability");
                                  handleMouseDown(date, room.room_id, room.ota);
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (isDragging && dragStart) {
                                  handleMouseEnter(date, room.room_id, room.ota);
                                }
                              }}
                            >
                              <div className="flex flex-col gap-2 cell-drag-area">
                                {/* Price Input */}
                                <div className="flex items-center justify-center gap-1">
                                  <Input
                                    type="number"
                                    className="w-20 text-center text-sm h-8"
                                    value={editedPrice}
                                    onChange={(e) =>
                                      handlePriceChange(
                                        room.room_id,
                                        date,
                                        Number(e.target.value)
                                      )
                                    }
                                    onFocus={(e) => {
                                      if (editedPrice === 0) {
                                        e.target.select();
                                      }
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      // Start drag selection for price when clicking on input
                                      setSelectionMode("price");
                                      handleMouseDown(date, room.room_id, room.ota);
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isDragging && dragStart && selectionMode === "price") {
                                        handleMouseEnter(date, room.room_id, room.ota);
                                      }
                                    }}
                                    onWheel={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onTouchMove={(e) => {
                                      e.stopPropagation();
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCellSelection(
                                        date,
                                        room.room_id,
                                        "price"
                                      );
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className={`p-0.5 rounded transition-colors duration-200 ${
                                      isPriceSelected
                                        ? "text-blue-600 bg-blue-100"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    {isPriceSelected ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>

                                {/* Availability Input */}
                                <div className="flex items-center justify-center gap-1">
                                  <Input
                                    type="number"
                                    className="w-20 text-center text-sm h-8"
                                    value={editedAvail}
                                    onChange={(e) =>
                                      handleInventoryChange(
                                        room.room_id,
                                        date,
                                        Number(e.target.value)
                                      )
                                    }
                                    onFocus={(e) => {
                                      if (editedAvail === 0) {
                                        e.target.select();
                                      }
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      // Start drag selection for availability when clicking on input
                                      setSelectionMode("availability");
                                      handleMouseDown(date, room.room_id, room.ota);
                                    }}
                                    onMouseEnter={(e) => {
                                      if (
                                        isDragging &&
                                        dragStart &&
                                        selectionMode === "availability"
                                      ) {
                                        handleMouseEnter(date, room.room_id, room.ota);
                                      }
                                    }}
                                    onWheel={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onTouchMove={(e) => {
                                      e.stopPropagation();
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCellSelection(
                                        date,
                                        room.room_id,
                                        "inventory"
                                      );
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className={`p-0.5 rounded transition-colors duration-200 ${
                                      isAvailSelected
                                        ? "text-green-600 bg-green-100"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    {isAvailSelected ? (
                                      <CheckSquare className="h-3 w-3" />
                                    ) : (
                                      <Square className="h-3 w-3" />
                                    )}
                                  </button>
                                  {editedCloseOut === "Y" && (
                                    <span
                                      className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-800 font-medium"
                                      title="Close Out"
                                    >
                                      CO
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="block md:hidden p-4">
              <div className="text-center text-gray-500">
                <p className="mb-2">📱 Mobile view under construction</p>
                <p className="text-sm">
                  Please use desktop for full calendar functionality
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No calendar data
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a property ID and click search to load calendar data.
            </p>
          </div>
        )}
      </div>
    </PageTransitionWrapper>
  );
}
