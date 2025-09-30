'use client'

import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Calendar,
  User,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  Heart,
  FileText,
  Phone,
  MapPin,
  Truck
} from 'lucide-react';
import PageTransitionWrapper from '../../../components/PageTransitionWrapper';

export default function AdminDashboard() {
  const { user, userType } = useAuth();

  const stats = [
    {
      title: 'Total Clinics',
      value: '0',
      subtitle: 'Registered healthcare facilities',
        icon: <Building2 className="h-8 w-8 text-[#000000]" />,
      bgColor: 'bg-[#000000]/10',
      textColor: 'text-[#000000]'
    },
    {
      title: 'Total Doctors',
      value: '0',
      subtitle: 'Active healthcare professionals',
      icon: <Stethoscope className="h-8 w-8 text-[#000000]" />,
      bgColor: 'bg-[#000000]/10',
      textColor: 'text-[#000000]'
    },
    {
      title: 'Total Patients',
      value: '0',
      subtitle: 'Registered patients',
      icon: <Users className="h-8 w-8 text-[#000000]" />,
      bgColor: 'bg-[#000000]/10',
      textColor: 'text-[#000000]'
    },
    {
      title: 'Total Sessions',
      value: '0',
      subtitle: 'This month',
      icon: <FileText className="h-8 w-8 text-[#000000]" />,
      bgColor: 'bg-[#000000]/10',
      textColor: 'text-[#000000]'
    }
  ];

  const recentActivities = [
    {
      icon: <CheckCircle className="h-5 w-5 text-[#000000]" />,
      title: 'New hotel registered',
      description: 'City Hotel joined the platform',
      time: '2 hours ago',
      bgColor: 'bg-[#000000]/10'
    },
    {
      icon: <Stethoscope className="h-5 w-5 text-[#000000]" />,
      title: 'New hotel professional registered',
      description: 'Dr. Sarah Johnson joined City Hotel',
      time: '4 hours ago',
      bgColor: 'bg-[#000000]/10'
    },
    {
        icon: <Users className="h-5 w-5 text-[#000000]" />,
            title: 'Hotel milestone reached',
      description: '100+ patients registered this week',
      time: '1 day ago',
      bgColor: 'bg-[#000000]/10'
    }
  ];

  return (
    <PageTransitionWrapper>
    <div className="p-2 md:p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {user?.name || 'Administrator'}! Here's what's happening with your healthcare platform.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-xs transition-shadow">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-600" />
              Recent Activity
            </h2>
            <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 p-2 rounded-lg ${activity.bgColor}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center py-4 mt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">More activity will appear as your healthcare platform grows</p>
          </div>
        </div>

        {/* Admin Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-600" />
              Admin Information
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-200 text-gray-800">
              Active
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Administrator'}</p>
                <p className="text-sm text-gray-500">System Administrator</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Email Address</p>
                  <p className="text-sm text-gray-500">{user?.email || 'Not available'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Role</p>
                  <p className="text-sm text-gray-500">{(user as any)?.role?.name || 'Administrator'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">User Type</p>
                  <p className="text-sm text-gray-500 capitalize">{userType || 'Admin'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#000000] hover:bg-[#000000]/5 transition-colors group">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-gray-400 group-hover:text-[#000000] mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-[#000000]">Manage Hotels</p>
                <p className="text-xs text-gray-500">View and manage registered clinics</p>
              </div>
            </button>
            
              <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#000000] hover:bg-[#000000]/5 transition-colors group">
              <div className="text-center">
                <Stethoscope className="h-8 w-8 text-gray-400 group-hover:text-[#000000] mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-[#000000]">Hotel Management</p>
                <p className="text-xs text-gray-500">Manage hotel professionals</p>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#000000] hover:bg-[#000000]/5 transition-colors group">
              <div className="text-center">
                <Activity className="h-8 w-8 text-gray-400 group-hover:text-[#000000] mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-[#000000]">View Analytics</p>
                <p className="text-xs text-gray-500">Hotel platform metrics</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    </PageTransitionWrapper>
  );
}