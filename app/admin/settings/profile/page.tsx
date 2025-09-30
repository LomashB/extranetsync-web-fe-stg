'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import axios from '../../../../lib/axios';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  EyeOffIcon, 
  User, 
  Lock, 
  Mail, 
  Shield, 
  CheckCircle, 
  Phone,
  Calendar,
  Key,
  Settings,
  Save
} from 'lucide-react';
import Input from '../../../../components/UI/Input';
import Button from '../../../../components/UI/Button';
import PageTransitionWrapper from '../../../../components/PageTransitionWrapper';

export default function AdminProfile() {
  const { user } = useAuth();
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const adminId = (user as any)?._id;
      if (!adminId) {
        throw new Error('Admin ID not found');
      }

      const response = await axios.patch(`admin/change-pass/${adminId}`, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.data.STATUS === 1) {
        toast.success(response.data.MESSAGE || 'Password changed successfully!');
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(response.data.MESSAGE || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.MESSAGE || error.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <PageTransitionWrapper>
    <div className="mx-auto space-y-8 p-2 md:p-4">
      {/* Header */}
      <div className="">
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your personal information and security preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">Your personal account information</p>
        </div>
        
        <div className="px-6 py-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {(user as any)?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                    {(user as any)?.name || 'Administrator'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                    {(user as any)?.email || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Mobile Number
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                    {(user as any)?.mobile_number || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Role
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                    {typeof (user as any)?.role === 'object' 
                      ? (user as any)?.role?.name 
                      : 'Admin'
                    }
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Account Status
                  </label>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-700 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Account Created
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                    {(user as any)?.createdAt 
                      ? new Date((user as any).createdAt).toLocaleDateString()
                      : 'Not available'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">Update your password to keep your account secure</p>
        </div>
        
        <div className="px-6 py-6">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="h-4 w-4 inline mr-1" />
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) {
                        setErrors({ ...errors, currentPassword: '' });
                      }
                    }}
                    placeholder="Enter your current password"
                    className={`pr-10 ${errors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="h-4 w-4 inline mr-1" />
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors({ ...errors, newPassword: '' });
                      }
                    }}
                    placeholder="Enter your new password"
                    className={`pr-10 ${errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: '' });
                      }
                    }}
                    placeholder="Confirm your new password"
                    className={`pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isChangingPassword}
                disabled={isChangingPassword}
                leftIcon={<Save size={16} />}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={clearForm}
                disabled={isChangingPassword}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </div>
      </div> */}

      {/* Security Notice */}
      {/* <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">Security Tips</h3>
            <div className="mt-2 text-sm text-gray-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use a strong password with at least 6 characters</li>
                <li>Don't share your password with anyone</li>
                <li>Change your password regularly for better security</li>
                <li>Make sure you're on a secure network when changing your password</li>
              </ul>
            </div>
          </div>
        </div>
      </div> */}
    </div>
    </PageTransitionWrapper>
  );
}
