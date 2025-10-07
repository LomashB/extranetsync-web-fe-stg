'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../lib/axios';
import toast from 'react-hot-toast';

import {
  FileText,
  RefreshCw,
  LogIn,
  LogOut,
  Activity,
  Clock,
  Mail,
  Phone,
  Shield
} from 'lucide-react';

import SearchInput from '../../../components/UI/SearchInput';
import Button from '../../../components/UI/Button';
import Shimmer from '../../../components/UI/Shimmer';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';
import Pagination from '../../../components/UI/Pagination';

// ──────────────────────────────────────────────────────────────
// • Interface Definitions
// ──────────────────────────────────────────────────────────────
interface LogUser {
  _id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Log {
  _id: string;
  user: LogUser;
  action: string;
  createdAt: string;
  updatedAt: string;
}

interface LogsResponse {
  RESULT: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    logs: Log[];
  };
  MESSAGE: string;
  STATUS: number;
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4"><Shimmer className="h-12 w-full" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-24" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-32" /></td>
    <td className="px-6 py-4"><Shimmer className="h-6 w-20" /></td>
  </tr>
);

const ShimmerTableRows = () => (
  <>
    {[...Array(10)].map((_, index) => (
      <ShimmerRow key={index} />
    ))}
  </>
);

export default function LogsPage() {
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<Log[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get<LogsResponse>(
        `admin/get-all-log?page=${currentPage}&limit=${itemsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
      );

      if (response.data.STATUS === 1) {
        const result = response.data.RESULT;
        setLogs(result.logs);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        setItemsPerPage(result.itemsPerPage);
      } else {
        toast.error(response.data.MESSAGE || 'Failed to fetch logs');
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to fetch logs');
    } finally {
      setInitialLoading(false);
      setLoading(false);
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
    fetchLogs();
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

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'logout':
        return <LogOut className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower === 'login') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <LogIn className="h-3 w-3 mr-1" />
          Login
        </span>
      );
    } else if (actionLower === 'logout') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Activity className="h-3 w-3 mr-1" />
          {action}
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
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
            <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track user activities and system events across the platform
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="min-w-0 flex-1 sm:min-w-[300px]">
              <SearchInput
                placeholder="Search by user name, email, or action..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onClear={handleClearSearch}
              />
            </div>

            <Button
              variant="secondary"
              leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={handleRefresh}
              disabled={loading}
              className="flex-shrink-0"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <ShimmerTableRows />
                ) : logs.length > 0 ? (
                  logs.map((log) => {
                    const userName = log.user?.name || 'Unknown User';
                    const userEmail = log.user?.email || 'N/A';
                    const userPhone = log.user?.mobile_number || 'N/A';
                    const isActive = log.user?.is_active ?? false;
                    
                    return (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white font-medium bg-gray-700 text-sm">
                                {userName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-3 md:ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {userName}
                              </div>
                              <div className="text-xs md:text-sm text-gray-500 flex items-center truncate">
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{userEmail}</span>
                              </div>
                              {/* Show contact on mobile */}
                              <div className="lg:hidden text-xs text-gray-500 flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                {userPhone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="hidden lg:table-cell px-3 md:px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {userPhone}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Shield className="h-3 w-3 mr-1 text-gray-400" />
                              {isActive ? (
                                <span className="text-green-600">Active</span>
                              ) : (
                                <span className="text-red-600">Inactive</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="hidden md:inline">{formatDate(log.createdAt)}</span>
                            <span className="md:hidden text-xs">
                              {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? 'No logs match your search criteria. Try a different search term.'
                          : 'No activity logs are available at the moment.'}
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
      </div>
    </PageTransitionWrapper>
  );
}

