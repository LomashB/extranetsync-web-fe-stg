'use client'
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCookie, deleteCookie } from "cookies-next";
import toast from "react-hot-toast";
import axios from "../lib/axios";

// ──────────────────────────────────────────────────────────────
// • Types for Extranetsync Admin User
// ──────────────────────────────────────────────────────────────
interface AdminUser {
  _id: string;
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  role: {
    _id: string;
    name: string;
    role_for: string;
    permissions: string[];
    description: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type UserType = 'admin';
type User = AdminUser;

interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  loginAdmin: (mobile_number: string, password: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ──────────────────────────────────────────────────────────────
// • Auth Context
// ──────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ──────────────────────────────────────────────────────────────
  // • Initialize auth state from localStorage
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = () => {
      try {
        const adminToken = localStorage.getItem("admin_auth_token");
        const adminInfo = localStorage.getItem("admin_user_info");

        if (adminToken && adminInfo) {
          const userData = JSON.parse(adminInfo);
          setUser(userData);
          setUserType('admin');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAllAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // • Admin Login Function
  // ──────────────────────────────────────────────────────────────

  const loginAdmin = async (mobile_number: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing auth
      clearAllAuth();
      
      // Make API call to Extranetsync admin login endpoint
      const response = await axios.post('/admin/login-admin-user', {
        mobile_number,
        password,
      });

      const data = response.data;

      // Check if login was successful based on your API response structure
      if (data.STATUS === 1 && data.RESULT) {
        const { user, jwt } = data.RESULT;
        
        // Store authentication data
        localStorage.setItem("admin_auth_token", jwt);
        localStorage.setItem("admin_user_info", JSON.stringify(user));
        
        // Set cookies with 30-day expiration
        setCookie("admin_auth_token", jwt, { maxAge: 30 * 24 * 60 * 60 });
        setCookie("admin_user_info", JSON.stringify(user), { maxAge: 30 * 24 * 60 * 60 });
        
        // Update context state
        setUser(user);
        setUserType('admin');
        
        return true;
      } else {
        throw new Error(data.MESSAGE || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Handle different error types
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.MESSAGE) {
        errorMessage = error.response.data.MESSAGE;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Admin Logout Function (API call)
  // ──────────────────────────────────────────────────────────────
  const logoutAdmin = async (): Promise<void> => {
    try {
      // Make API call to logout endpoint
      await axios.post('/admin/logout-admin-user');
      
      // Clear local auth data
      clearAllAuth();
      setUser(null);
      setUserType(null);
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login
      router.push("/auth/admin/login");
      
    } catch (error: any) {
      console.error('Logout API error:', error);
      
      // Even if API call fails, clear local auth data
      clearAllAuth();
      setUser(null);
      setUserType(null);
      
      toast.error('Logged out locally');
      router.push("/auth/admin/login");
    }
  };

  // ──────────────────────────────────────────────────────────────
  // • Clear all authentication data
  // ──────────────────────────────────────────────────────────────
  const clearAllAuth = () => {
    // Clear localStorage
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("admin_user_info");
    localStorage.removeItem("lastAdminLoginMobile");
    
    // Clear cookies
    deleteCookie("admin_auth_token");
    deleteCookie("admin_user_info");
  };

  // ──────────────────────────────────────────────────────────────
  // • Simple logout (no API call)
  // ──────────────────────────────────────────────────────────────
  const logout = () => {
    clearAllAuth();
    setUser(null);
    setUserType(null);
    router.push("/auth/admin/login");
  };

  // ──────────────────────────────────────────────────────────────
  // • Computed authentication state
  // ──────────────────────────────────────────────────────────────
  const isAuthenticated = user !== null && userType === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      loginAdmin, 
      logoutAdmin,
      logout, 
      isAuthenticated,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ──────────────────────────────────────────────────────────────
// • useAuth hook
// ──────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
