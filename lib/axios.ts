import axios from "axios";

const isServer = typeof window === 'undefined';

// ──────────────────────────────────────────────────────────────
// • Extranetsync Axios Instance - Admin Only
// ──────────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// ──────────────────────────────────────────────────────────────
// • Request Interceptor - Admin Token Only
// ──────────────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config) => {
    if (config?.headers) {
      if (!isServer) {
        // Only get admin token for Extranetsync
        const accessToken = localStorage.getItem("admin_auth_token");
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      config.headers.Accept = "application/json";
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────
// • Response Interceptor - Token Expiry & Unauthorized Handling
// ──────────────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiry based on Extranetsync API response
    if (error.response?.data?.IS_TOKEN_EXPIRE === 1 && !isServer) {
      // Clear admin auth data
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem("admin_user_info");
      localStorage.removeItem("lastAdminLoginMobile");
      
      // Redirect to admin login
      window.location.href = "/auth/admin/login";
      
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle unauthorized access (403)
    if (error.response?.status === 403 && !isServer) {
      const unauthorizedEvent = new CustomEvent('unauthorizedAccess', {
        detail: {
          message: error.response?.data?.MESSAGE || 'You are not authorized to perform this action.',
          path: error.config.url,
          statusCode: error.response.status
        }
      });
      window.dispatchEvent(unauthorizedEvent);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
