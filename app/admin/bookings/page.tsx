'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../lib/axios';
import toast from 'react-hot-toast';

import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Search,
  RefreshCw,
  Eye,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Home,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Bed,
  Users,
  AlertCircle,
  Globe
} from 'lucide-react';

import SearchInput from '../../../components/UI/SearchInput';
import Button from '../../../components/UI/Button';
import Shimmer from '../../../components/UI/Shimmer';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';
import Pagination from '../../../components/UI/Pagination';
import Modal from '../../../components/UI/Modal';

// ──────────────────────────────────────────────────────────────
// • Interface Definitions
// ──────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  platform: 'agoda' | 'hyperguest';
  property_id: string;
  property_name: string;
  status: string;
  booking_date: string;
  check_in: string;
  check_out: string;
  room_type: string;
  room_count: number;
  guest_count: number;
  primary_guest_name: string;
  primary_guest_email: string;
  total_amount: number;
  currency: string;
  processing_status: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
}

interface BookingStats {
  agoda: Record<string, { count: number; total_amount: number }>;
  hyperguest: Record<string, { count: number; total_amount: number }>;
  summary: {
    total_bookings: number;
    total_revenue: number;
  };
}

interface BookingDetails {
  _id: string;
  booking_id: string;
  agoda_property_id?: string;
  property_name: string;
  status: string;
  booking_date: string;
  last_action?: string;
  arrival: string;
  departure: string;
  room_details: {
    agoda_room_id?: string;
    room_type: string;
    room_count: number;
    adults: number;
    children: number;
    extrabeds?: number;
  };
  customer: {
    first_name: string;
    last_name: string;
    nationality?: string;
    email: string;
  };
  pricing: {
    currency: string;
    sell_inclusive_amt: number;
    daily_prices?: Array<{
      date: string;
      sell_inclusive_amt: number;
      refsell_amt?: number;
      type?: string;
    }>;
  };
  processing_status: string;
  reservation_status: string;
  cancellation_date?: string;
  platform: 'agoda' | 'hyperguest';
  [key: string]: any;
}

interface BookingsResponse {
  RESULT: {
    agoda: Booking[];
    hyperguest: Booking[];
    summary: {
      total_count: number;
      agoda_count: number;
      hyperguest_count: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
  MESSAGE: string;
  STATUS: number;
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-6 w-24" /></td>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-6 w-32" /></td>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-6 w-20" /></td>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-6 w-24" /></td>
    <td className="px-3 md:px-6 py-4"><Shimmer className="h-6 w-16" /></td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(10)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

export default function BookingsPage() {
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [agodaBookings, setAgodaBookings] = useState<Booking[]>([]);
  const [hyperguestBookings, setHyperguestBookings] = useState<Booking[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filter state
  const [platformFilter, setPlatformFilter] = useState<'all' | 'agoda' | 'hyperguest'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  // Details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBookings();
    fetchBookingStats();
  }, [currentPage, itemsPerPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchBookings();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get<BookingsResponse>(
        `admin/bookings?page=${currentPage}&limit=${itemsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
      );

      if (response.data.STATUS === 1) {
        const result = response.data.RESULT;
        setAgodaBookings(result.agoda || []);
        setHyperguestBookings(result.hyperguest || []);
        setTotalItems(result.summary.total_count);
        setTotalPages(result.summary.total_pages);
      } else {
        toast.error(response.data.MESSAGE || 'Failed to fetch bookings');
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to fetch bookings');
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const response = await axios.get('admin/bookings/stats');
      if (response.data.STATUS === 1) {
        setBookingStats(response.data.RESULT);
      }
    } catch (error: any) {
      console.error('Error fetching booking stats:', error);
    }
  };

  const fetchBookingDetails = async (bookingId: string, platform: 'agoda' | 'hyperguest') => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`admin/bookings/${platform}/${bookingId}`);
      if (response.data.STATUS === 1) {
        setSelectedBooking(response.data.RESULT);
        setIsDetailsModalOpen(true);
      } else {
        toast.error('Failed to fetch booking details');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to fetch booking details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Helper Functions
  // ──────────────────────────────────────────────────────────────
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleRefresh = () => {
    fetchBookings();
    fetchBookingStats();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleViewDetails = (booking: Booking) => {
    fetchBookingDetails(booking.id, booking.platform);
  };

  const getStatusBadge = (status: string, reservationStatus: string) => {
    if (reservationStatus === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      );
    }
    
    if (reservationStatus === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        {reservationStatus}
      </span>
    );
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === 'agoda') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          <Globe className="h-3 w-3 mr-1" />
          Agoda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
        <Globe className="h-3 w-3 mr-1" />
        HyperGuest
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  // Combine and filter bookings
  const allBookings = [...agodaBookings, ...hyperguestBookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );

  const filteredBookings = allBookings.filter(booking => {
    if (platformFilter !== 'all' && booking.platform !== platformFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && booking.reservation_status !== 'active') return false;
      if (statusFilter === 'cancelled' && booking.reservation_status !== 'cancelled') return false;
    }
    return true;
  });

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

        {/* Stats shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Shimmer className="h-6 w-24 mb-2" />
              <Shimmer className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Table shimmer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track bookings across Agoda and HyperGuest platforms
              </p>
            </div>

              
          {/* Search and Filters Row */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="Search by booking ID, guest name, or property..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onClear={handleClearSearch}
              />
            </div>

         

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="min-w-[160px]">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="agoda">Agoda</option>
                  <option value="hyperguest">HyperGuest</option>
                </select>
              </div>

              <div className="min-w-[160px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Button
                variant="secondary"
                leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                onClick={handleRefresh}
                disabled={loading}
                className="flex-shrink-0 ml-0"
              >
              </Button>
            </div>
          </div>
          </div>

        </div>

        {/* Stats Cards */}
        {bookingStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{bookingStats.summary.total_bookings}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    ${bookingStats.summary.total_revenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agoda Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{agodaBookings.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">HyperGuest Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{hyperguestBookings.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Information
                  </th>
                  <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in / Check-out
                  </th>
                  <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room & Guests
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <ShimmerTableRows />
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={`${booking.platform}-${booking.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {getPlatformBadge(booking.platform)}
                            <span className="text-xs font-mono text-gray-500">#{booking.id}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {booking.property_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(booking.booking_date)}
                          </div>
                          {/* Show dates on mobile */}
                          <div className="lg:hidden text-xs text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white font-medium bg-gray-700 text-sm">
                              {booking.primary_guest_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {booking.primary_guest_name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center truncate">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[200px] break-words overflow-hidden" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>{booking.primary_guest_email}</span>
                            </div>
                            {/* Show room & guests on mobile */}
                            <div className="lg:hidden text-xs text-gray-500 mt-1">
                              <Bed className="h-3 w-3 inline mr-1" />
                              {booking.room_count} room(s) • {booking.guest_count} guest(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDate(booking.check_in)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDate(booking.check_out)}
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Bed className="h-3 w-3 mr-1 text-gray-400" />
                            {booking.room_type}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.room_count} room(s) • {booking.guest_count} guest(s)
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.total_amount, booking.currency)}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status, booking.reservation_status)}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => handleViewDetails(booking)}
                          disabled={loadingDetails}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? 'No bookings match your search criteria. Try a different search term.'
                          : 'No bookings are available at the moment.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onLimitChange={handleItemsPerPageChange}
            />
          )}
        </div>

        {/* Booking Details Modal */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedBooking(null);
          }}
          title="Booking Details"
          size="lg"
        >
          {loadingDetails ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading booking details...</p>
            </div>
          ) : selectedBooking ? (
            <div className="space-y-6">
              {/* Booking Header */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getPlatformBadge(selectedBooking.platform)}
                      <span className="text-sm font-mono text-gray-500">#{selectedBooking.booking_id}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedBooking.property_name}</h4>
                    <p className="text-sm text-gray-500">Property ID: {selectedBooking.agoda_property_id || selectedBooking.property_name}</p>
                  </div>
                  {getStatusBadge(selectedBooking.status, selectedBooking.reservation_status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Calendar className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Booking Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedBooking.booking_date)}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Bed className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Rooms</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.room_details?.room_count || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Guests</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBooking.room_details?.adults || 0} Adults
                      {selectedBooking.room_details?.children && selectedBooking.room_details.children > 0 && `, ${selectedBooking.room_details.children} Children`}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedBooking.pricing?.sell_inclusive_amt || 0, selectedBooking.pricing?.currency || 'USD')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Guest Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Guest Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBooking.customer?.first_name || 'N/A'} {selectedBooking.customer?.last_name || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-words max-w-[200px] overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                    {selectedBooking.customer?.email || 'N/A'}</p>
                  </div>
                  {selectedBooking.customer?.nationality && (
                    <div>
                      <p className="text-xs text-gray-500">Nationality</p>
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.customer.nationality}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Stay Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Check-in</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedBooking.arrival)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Check-out</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedBooking.departure)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Room Type</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.room_details?.room_type || 'N/A'}</p>
                  </div>
                  {selectedBooking.room_details?.agoda_room_id && (
                    <div>
                      <p className="text-xs text-gray-500">Room ID</p>
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.room_details.agoda_room_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Details */}
              {selectedBooking.pricing?.daily_prices && selectedBooking.pricing.daily_prices.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Daily Pricing
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedBooking.pricing.daily_prices.map((price: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">{formatDate(price.date)}</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(price.sell_inclusive_amt, selectedBooking.pricing?.currency || 'USD')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Processing Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Processing Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedBooking.processing_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reservation Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedBooking.reservation_status}</p>
                  </div>
                  {selectedBooking.cancellation_date && (
                    <div>
                      <p className="text-xs text-gray-500">Cancellation Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedBooking.cancellation_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </PageTransitionWrapper>
  );
}

