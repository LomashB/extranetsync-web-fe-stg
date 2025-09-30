'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import axios from '../../../../lib/axios';
import toast from 'react-hot-toast';

import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Key,
  User,
  AlertTriangle,
  LogOut,
  Filter,
  Users,
  UserCheck,
  Building2
} from 'lucide-react';
import Input from '../../../../components/UI/Input';
import Button from '../../../../components/UI/Button';
import Modal from '../../../../components/UI/Modal';
import SearchInput from '../../../../components/UI/SearchInput';
import Shimmer from '../../../../components/UI/Shimmer';
import OptionsDropdown from '../../../../components/UI/OptionsDropdown';
import PageTransitionWrapper from '../../../../components/PageTransitionWrapper';
import Pagination from '../../../../components/UI/Pagination';

// ──────────────────────────────────────────────────────────────
// • Interface Definitions for Extranetsync
// ──────────────────────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  mobile_number: string;
  password?: string;
  role: Role | string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Role {
  _id: string;
  name: string;
  role_for: string;
  permissions: Permission[];
  description: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  __v: number;
}

interface UserFormData {
  name: string;
  email: string;
  mobile_number: string;
  password: string;
  role: string;
  is_active: boolean;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ──────────────────────────────────────────────────────────────
// • Shimmer Loading Components
// ──────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <Shimmer className="h-10 w-10 rounded-full" />
        </div>
        <div className="ml-4">
          <Shimmer className="h-4 w-32 mb-2" />
          <div className="flex items-center mb-1">
            <Shimmer className="h-3 w-3 mr-1" />
            <Shimmer className="h-3 w-48" />
          </div>
          <div className="flex items-center">
            <Shimmer className="h-3 w-3 mr-1" />
            <Shimmer className="h-3 w-36" />
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <Shimmer className="h-4 w-4 mr-2" />
        <Shimmer className="h-4 w-24" />
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Shimmer className="h-6 w-16 rounded-full" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <Shimmer className="h-3 w-3 mr-1" />
        <Shimmer className="h-4 w-20" />
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <Shimmer className="h-6 w-6 ml-auto" />
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

export default function UserManagement() {
  const { user, logoutAdmin } = useAuth();
  
  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    itemsPerPage: 10
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelfActionModalOpen, setIsSelfActionModalOpen] = useState(false);
  const [isViewPasswordModalOpen, setIsViewPasswordModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    mobile_number: '',
    password: '',
    role: '',
    is_active: true
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selfAction, setSelfAction] = useState<'delete' | 'deactivate' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  // Helper: safely extract role id from mixed role shape
  const extractRoleId = (role: User['role']): string => {
    if (typeof role === 'string') return role || '';
    if (role && typeof role === 'object' && (role as Role)._id) return (role as Role)._id;
    return '';
  };
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(true);
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchUsers(false);
    }
  }, [currentPage, itemsPerPage]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchUsers = async (isInitialOrFilter = false) => {
    try {
      if (isInitialOrFilter && initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      
      const response = await axios.get(`admin/get-all-user?${params}`);
      if (response.data.STATUS === 1) {
        setUsers(response.data.RESULT.users);
        setPagination({
          currentPage: response.data.RESULT.currentPage,
          totalPages: response.data.RESULT.totalPages,
          totalItems: response.data.RESULT.totalItems,
          itemsPerPage: response.data.RESULT.itemsPerPage
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error((error as any).response?.data?.MESSAGE || 'Failed to fetch users');
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('admin/get-all-role');
      if (response.data.STATUS === 1) {
        setRoles(response.data.RESULT.filter((role: Role) => role.role_for === 'extranetsync_admin'));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error((error as any).response?.data?.MESSAGE || 'Failed to fetch roles');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('admin/create-user', formData);
      if (response.data.STATUS === 1) {
        toast.success('User created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchUsers();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        role: formData.role,
        is_active: formData.is_active
      };
      
      const response = await axios.put(`admin/update-user/${selectedUser._id}`, updateData);
      if (response.data.STATUS === 1) {
        toast.success('User updated successfully');
        setIsEditModalOpen(false);
        resetForm();
        fetchUsers();
        
        // If user updated themselves, logout
        if ((user as any)?._id === selectedUser._id) {
          setIsLoggingOut(true);
          await new Promise(resolve => setTimeout(resolve, 2500));
          await logoutAdmin();
        }
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);

    try {
      const response = await axios.delete(`admin/delete-user/${selectedUser._id}`);
      if (response.data.STATUS === 1) {
        toast.success('User deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelfAction = async () => {
    if (!selectedUser || !selfAction) return;
    
    setIsLoggingOut(true);

    try {
      let response;
      if (selfAction === 'delete') {
        response = await axios.delete(`admin/delete-user/${selectedUser._id}`);
      } else {
        const updateData = {
          name: selectedUser.name,
          email: selectedUser.email,
          mobile_number: selectedUser.mobile_number,
          role: extractRoleId(selectedUser.role),
          is_active: false
        };
        response = await axios.put(`admin/update-user/${selectedUser._id}`, updateData);
      }

      if (response.data.STATUS === 1) {
        toast.success(selfAction === 'delete' ? 'Account deleted successfully' : 'Account deactivated successfully');
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        await logoutAdmin();
      } else {
        throw new Error(response.data.MESSAGE || `Failed to ${selfAction} user`);
      }
    } catch (error: any) {
      console.error(`Error ${selfAction}ing user:`, error);
      toast.error(error.response?.data?.MESSAGE || `Failed to ${selfAction} user`);
      setIsLoggingOut(false);
    }
  };

  const handleToggleStatus = async (userData: User) => {
    if (userData._id === (user as any)?._id && userData.is_active) {
      setSelectedUser(userData);
      setSelfAction('deactivate');
      setIsSelfActionModalOpen(true);
      return;
    }

    try {
      const updateData = {
        name: userData.name,
        email: userData.email,
        mobile_number: userData.mobile_number,
        role: extractRoleId(userData.role),
        is_active: !userData.is_active
      };
      const response = await axios.put(`admin/update-user/${userData._id}`, updateData);
      if (response.data.STATUS === 1) {
        toast.success(`User ${userData.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update status');
    }
  };

  const handleViewPassword = async (userData: User) => {
    setSelectedUser(userData);
    setIsViewPasswordModalOpen(true);
    // We already have password in the list response
    const pwd = (userData as any)?.password ?? '';
    setUserPassword(pwd);
    setShowPassword(true);
    setIsPasswordLoading(false);
  };

  // ──────────────────────────────────────────────────────────────
  // • Helper Functions
  // ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile_number: '',
      password: '',
      role: '',
      is_active: true
    });
    setSelectedUser(null);
  };

  const openEditModal = (userData: User) => {
    setSelectedUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      mobile_number: userData.mobile_number,
      password: '',
      role: extractRoleId(userData.role),
      is_active: userData.is_active
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (userData: User) => {
    if (userData._id === (user as any)?._id) {
      setSelectedUser(userData);
      setSelfAction('delete');
      setIsSelfActionModalOpen(true);
      return;
    }

    setSelectedUser(userData);
    setIsDeleteModalOpen(true);
  };

  const getRoleName = (role: User['role']) => {
    if (typeof role === 'string') return 'Unknown Role';
    return role?.name || 'No Role';
  };

  const isCurrentUser = (userId: string) => {
    return userId === (user as any)?._id;
  };

  const getDropdownOptions = (userData: User) => [
    {
      label: "Edit User",
      icon: <Edit size={14} />,
      onClick: () => openEditModal(userData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    },
    {
      label: "View Password",
      icon: <Key size={14} />,
      onClick: () => handleViewPassword(userData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    },
    {
      label: userData.is_active ? "Deactivate User" : "Activate User",
      icon: userData.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />,
      onClick: () => handleToggleStatus(userData),
      className: `flex items-center px-4 py-2 text-sm w-full text-left ${
        userData.is_active 
          ? 'text-gray-600 hover:bg-gray-50' 
          : 'text-gray-700 hover:bg-gray-100'
      }`
    },
    {
      label: "Delete User",
      icon: <Trash2 size={14} />,
      onClick: () => openDeleteModal(userData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
    );
  }

  return (
    <PageTransitionWrapper> 
    <div className="mx-auto space-y-6 p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage Extranetsync admin users and their permissions
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-0 flex-1 sm:min-w-[300px]">
            <SearchInput
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onClear={handleClearSearch}
            />
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-shrink-0"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableLoading ? (
                <ShimmerTableRows />
              ) : (
                <>
                  {users.map((userData) => (
                    <tr key={userData._id} className={`hover:bg-gray-50 ${isCurrentUser(userData._id) ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                              isCurrentUser(userData._id) ? 'bg-gray-700' : 'bg-gray-600'
                            }`}>
                              {userData.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {userData.name}
                              {isCurrentUser(userData._id) && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {userData.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {userData.mobile_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="flex items-start flex-col">
                            <span className="text-sm text-gray-900">{getRoleName(userData.role)}</span>
                            {/* <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                              Admin
                            </span> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(userData)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                            userData.is_active
                              ? 'bg-gray-700 text-white hover:bg-gray-800'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          {userData.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <OptionsDropdown options={getDropdownOptions(userData)} />
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm ? 'No users match your search criteria.' : 'Get started by creating a new user.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalItems > 0 && ( 
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            variant="primary"
          />
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Add New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <Input
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white"
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              User is active
            </label>
          </div> */}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={`Edit User - ${selectedUser?.name}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <Input
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white"
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="edit_is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700">
              User is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Password Modal */}
      <Modal
        isOpen={isViewPasswordModalOpen}
        onClose={() => {
          setIsViewPasswordModalOpen(false);
          setSelectedUser(null);
          setUserPassword('');
        }}
        title={`Password for ${selectedUser?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">User Password</p>
                <p className="text-lg font-mono mt-1 text-gray-900">
                  {showPassword ? (userPassword || '—') : '••••••••'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsViewPasswordModalOpen(false);
                setSelectedUser(null);
                setUserPassword('');
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete-confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="sm"
        primaryActionLabel="Delete"
        onPrimaryAction={handleDeleteUser}
        isLoading={isDeleting}
        danger={true}
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">{selectedUser?.name}</span>?
          This action cannot be undone.
        </p>
      </Modal>

      {/* Self-action (delete / deactivate) modal */}
      <Modal
        isOpen={isSelfActionModalOpen}
        onClose={() => {
          setIsSelfActionModalOpen(false);
          setSelectedUser(null);
          setSelfAction(null);
        }}
        title={selfAction === 'delete' ? 'Delete Account' : 'Deactivate Account'}
        size="sm"
        primaryActionLabel={
          selfAction === 'delete' ? 'Delete & Log Out' : 'Deactivate & Log Out'
        }
        onPrimaryAction={handleSelfAction}
        isLoading={isLoggingOut}
        danger={selfAction === 'delete' ? true : false}
      >
        <div className="flex items-center space-x-3">
          {selfAction === 'delete' ? (
            <Trash2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-gray-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-600">
            {selfAction === 'delete'
              ? 'This will permanently delete your own admin account and you will be logged out immediately.'
              : 'This will deactivate your own admin account and you will be logged out immediately.'}
          </p>
        </div>
      </Modal>
    </div>
    </PageTransitionWrapper>
  );
}
