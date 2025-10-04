'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import axios from '../../../../lib/axios';
import toast from 'react-hot-toast';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle,
  XCircle,
  Key,
  Calendar,
  AlertTriangle,
  Users,
  Eye
} from 'lucide-react';
import Input from '../../../../components/UI/Input';
import Button from '../../../../components/UI/Button';
import Modal from '../../../../components/UI/Modal';
import SearchInput from '../../../../components/UI/SearchInput';
import Shimmer from '../../../../components/UI/Shimmer';
import OptionsDropdown from '../../../../components/UI/OptionsDropdown';
import PageTransitionWrapper from '../../../../components/PageTransitionWrapper';

// ──────────────────────────────────────────────────────────────
// • Interface Definitions for Extranetsync
// ──────────────────────────────────────────────────────────────
interface Permission {
  _id: string;
  name: string;
  description: string;
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

interface RoleFormData {
  name: string;
  description: string;
  is_active: boolean;
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
          <Shimmer className="h-3 w-48" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Shimmer className="h-4 w-16" />
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

// ──────────────────────────────────────────────────────────────
// • Permission Categories with Labels
// ──────────────────────────────────────────────────────────────
const MODULE_LABELS: Record<string, string> = {
  'user': 'User Management',
  'role': 'Role Management', 
  'permission': 'Permission Management',
  'agodaproperty': 'Property Management',
  'ari': 'ARI Management',
  'log': 'System Logs',
};

const ACTION_LABELS: Record<string, string> = {
  'create': 'Create',
  'read': 'Read',
  'update': 'Update', 
  'delete': 'Delete',
};

export default function RolesPermissionsPage() {
  const { user, logoutAdmin } = useAuth();
  
  // ──────────────────────────────────────────────────────────────
  // • State Management
  // ──────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSelfActionModalOpen, setIsSelfActionModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Form states
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    is_active: true
  });
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selfAction, setSelfAction] = useState<'delete' | 'deactivate' | null>(null);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // • Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // • API Functions
  // ──────────────────────────────────────────────────────────────
  const fetchRoles = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get('admin/get-all-role');
      if (response.data.STATUS === 1) {
        setRoles(response.data.RESULT.filter((role: Role) => role.role_for === 'extranetsync_admin'));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error((error as any).response?.data?.MESSAGE || 'Failed to fetch roles');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('admin/get-all-permission');
      if (response.data.STATUS === 1) {
        setAllPermissions(response.data.RESULT);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error((error as any).response?.data?.MESSAGE || 'Failed to fetch permissions');
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await axios.get(`admin/get-permission-by-role-id/${roleId}`);
      if (response.data.STATUS === 1) {
        setSelectedPermissions(response.data.RESULT.permissions.map((p: Permission) => p._id));
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error((error as any).response?.data?.MESSAGE || 'Failed to fetch role permissions');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('admin/create-role', {
        ...roleFormData,
        permissions: []
      });
      if (response.data.STATUS === 1) {
        toast.success('Role created successfully');
        setIsCreateRoleModalOpen(false);
        
        // Set the newly created role and open permission modal
        const newRole = response.data.RESULT;
        console.log('New role created:', newRole); // Debug log
        setSelectedRole(newRole);
        setSelectedPermissions([]); // Start with no permissions selected
        setIsPermissionModalOpen(true);
        
        // Reset form data but keep selectedRole for permission modal
        setRoleFormData({
          name: '',
          description: '',
          is_active: true
        });
        fetchRoles();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to create role');
      }
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      const response = await axios.put(`admin/update-role/${selectedRole._id}`, roleFormData);
      if (response.data.STATUS === 1) {
        toast.success('Role updated successfully');
        setIsEditRoleModalOpen(false);
        resetForm();
        fetchRoles();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update role');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    setIsDeleting(true);

    try {
      const response = await axios.delete(`admin/delete-role/${selectedRole._id}`);
      if (response.data.STATUS === 1) {
        toast.success('Role deleted successfully');
        setIsDeleteRoleModalOpen(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to delete role');
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelfAction = async () => {
    if (!selectedRole || !selfAction) return;
    
    setIsLoggingOut(true);

    try {
      let response;
      if (selfAction === 'delete') {
        response = await axios.delete(`admin/delete-role/${selectedRole._id}`);
      } else {
        response = await axios.put(`admin/update-role/${selectedRole._id}`, {
          name: selectedRole.name,
          description: selectedRole.description,
          is_active: false
        });
      }

      if (response.data.STATUS === 1) {
        toast.success(selfAction === 'delete' ? 'Role deleted successfully' : 'Role deactivated successfully');
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        await logoutAdmin();
      } else {
        throw new Error(response.data.MESSAGE || `Failed to ${selfAction} role`);
      }
    } catch (error: any) {
      console.error(`Error ${selfAction}ing role:`, error);
      toast.error(error.response?.data?.MESSAGE || `Failed to ${selfAction} role`);
      setIsLoggingOut(false);
    }
  };

  const handleToggleStatus = async (roleData: Role) => {
    if (roleData._id === (user as any)?.role && roleData.is_active) {
      setSelectedRole(roleData);
      setSelfAction('deactivate');
      setIsSelfActionModalOpen(true);
      return;
    }

    try {
      const response = await axios.put(`admin/update-role/${roleData._id}`, {
        name: roleData.name,
        description: roleData.description,
        is_active: !roleData.is_active
      });
      if (response.data.STATUS === 1) {
        toast.success(`Role ${roleData.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchRoles();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update status');
    }
  };

  const handleManagePermissions = async (roleData: Role) => {
    setSelectedRole(roleData);
    await fetchRolePermissions(roleData._id);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      console.error('No selected role found');
      toast.error('No role selected');
      return;
    }
    
    console.log('Saving permissions for role:', selectedRole);
    console.log('Selected permissions:', selectedPermissions);
    
    setIsSavingPermissions(true);
    try {
      const response = await axios.post('admin/assign-permission-to-role-inBulk', {
        role_id: selectedRole._id,
        permission_ids: selectedPermissions
      });
      
      console.log('Save permissions response:', response.data);
      
      if (response.data.STATUS === 1) {
        toast.success('Permissions updated successfully');
        setIsPermissionModalOpen(false);
        setSelectedRole(null);
        setSelectedPermissions([]);
        fetchRoles();
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to update permissions');
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      toast.error(error.response?.data?.MESSAGE || 'Failed to update permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Helper Functions
  // ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      is_active: true
    });
    setSelectedRole(null);
  };

  const openEditModal = (roleData: Role) => {
    setSelectedRole(roleData);
    setRoleFormData({
      name: roleData.name,
      description: roleData.description,
      is_active: roleData.is_active
    });
    setIsEditRoleModalOpen(true);
  };

  const openDeleteModal = (roleData: Role) => {
    if (roleData._id === (user as any)?.role) {
      setSelectedRole(roleData);
      setSelfAction('delete');
      setIsSelfActionModalOpen(true);
      return;
    }

    setSelectedRole(roleData);
    setIsDeleteRoleModalOpen(true);
  };

  const getDropdownOptions = (roleData: Role) => [
    {
      label: "Edit Role",
      icon: <Edit size={14} />,
      onClick: () => openEditModal(roleData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    },
    {
      label: "Manage Permissions",
      icon: <Key size={14} />,
      onClick: () => handleManagePermissions(roleData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    },
    {
      label: roleData.is_active ? "Deactivate Role" : "Activate Role",
      icon: roleData.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />,
      onClick: () => handleToggleStatus(roleData),
      className: `flex items-center px-4 py-2 text-sm w-full text-left ${
        roleData.is_active 
          ? 'text-gray-600 hover:bg-gray-50' 
          : 'text-gray-700 hover:bg-gray-100'
      }`
    },
    {
      label: "Delete Role",
      icon: <Trash2 size={14} />,
      onClick: () => openDeleteModal(roleData),
      className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    }
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ──────────────────────────────────────────────────────────────
  // • Permission Matrix Helper
  // ──────────────────────────────────────────────────────────────
  const buildPermissionMatrix = () => {
    const matrix: Record<string, Record<string, Permission>> = {};
    
    allPermissions.forEach(permission => {
      const [action, module] = permission.name.split(':');
      if (!matrix[module]) {
        matrix[module] = {};
      }
      matrix[module][action] = permission;
    });
    
    return matrix;
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModulePermissions = (module: string, actions: Record<string, Permission>) => {
    const modulePermissionIds = Object.values(actions).map(p => p._id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Remove all module permissions
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    } else {
      // Add all module permissions
      setSelectedPermissions(prev => {
        const newSelection = [...prev];
        modulePermissionIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const permissionMatrix = buildPermissionMatrix();

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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
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
          <h1 className="text-2xl font-semibold text-gray-900">Role & Permission Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage Extranetsync admin roles and their permissions
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-0 flex-1 sm:min-w-[300px]">
            <SearchInput
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onClear={handleClearSearch}
            />
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="flex-shrink-0"
          >
            Add Role
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
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
                  {filteredRoles.map((roleData) => (
                    <tr key={roleData._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium bg-gray-600">
                              <Shield className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {roleData.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {roleData.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Key className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{roleData.permissions.length} permissions</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(roleData)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            roleData.is_active
                              ? 'bg-gray-700 text-white hover:bg-gray-800'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          {roleData.is_active ? (
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
                          {new Date(roleData.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <OptionsDropdown options={getDropdownOptions(roleData)} />
                      </td>
                    </tr>
                  ))}
                  
                  {filteredRoles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm ? 'No roles match your search criteria.' : 'Get started by creating a new role.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateRoleModalOpen}
        onClose={() => {
          setIsCreateRoleModalOpen(false);
          resetForm();
        }}
        title="Add New Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <Input
              type="text"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              placeholder="Enter role name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="Enter role description"
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateRoleModalOpen(false);
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
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false);
          resetForm();
        }}
        title={`Edit Role - ${selectedRole?.name}`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <Input
              type="text"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              placeholder="Enter role name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="Enter role description"
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="edit_is_active"
              type="checkbox"
              checked={roleFormData.is_active}
              onChange={(e) => setRoleFormData({ ...roleFormData, is_active: e.target.checked })}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700">
              Role is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditRoleModalOpen(false);
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
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Permissions Modal - NEW DESIGN */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setSelectedRole(null);
          setSelectedPermissions([]);
        }}
        title={`Manage Permissions - ${selectedRole?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assign Permissions</h3>
            <p className="text-sm text-gray-600">
              Select the permissions this role should have access to. Each module shows available CRUD operations.
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {Object.entries(permissionMatrix).map(([module, actions]) => {
              const availableActions = Object.keys(actions);
              const modulePermissionIds = Object.values(actions).map(p => p._id);
              const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
              const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id));
              
              return (
                <div key={module} className="mb-6 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-600 mr-3" />
                      <h4 className="text-base font-semibold text-gray-900">
                        {MODULE_LABELS[module] || module.charAt(0).toUpperCase() + module.slice(1)}
                      </h4>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleModulePermissions(module, actions)}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Select All</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableActions.map((action) => {
                      const permission = actions[action];
                      const isSelected = selectedPermissions.includes(permission._id);
                      
                      return (
                        <label
                          key={permission._id}
                          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-gray-100 border-gray-400'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermission(permission._id)}
                            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {ACTION_LABELS[action] || action}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsPermissionModalOpen(false);
                setSelectedRole(null);
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSavingPermissions}
              disabled={isSavingPermissions}
              onClick={handleSavePermissions}
            >
              Save Permissions
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Role Modal */}
      <Modal
        isOpen={isDeleteRoleModalOpen}
        onClose={() => {
          setIsDeleteRoleModalOpen(false);
          setSelectedRole(null);
        }}
        title="Delete Role"
        size="sm"
        primaryActionLabel="Delete"
        onPrimaryAction={handleDeleteRole}
        isLoading={isDeleting}
        danger={true}
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">{selectedRole?.name}</span>?
          This action cannot be undone.
        </p>
      </Modal>

      {/* Self-action Modal */}
      <Modal
        isOpen={isSelfActionModalOpen}
        onClose={() => {
          setIsSelfActionModalOpen(false);
          setSelectedRole(null);
          setSelfAction(null);
        }}
        title={selfAction === 'delete' ? 'Delete Your Role' : 'Deactivate Your Role'}
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
              ? 'This will permanently delete your own role and you will be logged out immediately.'
              : 'This will deactivate your own role and you will be logged out immediately.'}
          </p>
        </div>
      </Modal>
    </div>
    </PageTransitionWrapper>
  );
}