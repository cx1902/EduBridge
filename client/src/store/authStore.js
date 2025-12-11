import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import i18n from '../i18n/config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// Helper function to ensure profile picture URL is complete
const normalizeProfilePictureUrl = (user) => {
  if (user && user.profilePictureUrl && !user.profilePictureUrl.startsWith('http')) {
    return {
      ...user,
      profilePictureUrl: `${BASE_URL}${user.profilePictureUrl}`
    };
  }
  return user;
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });

          const { user, token } = response.data.data;

          // Set authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Normalize profile picture URL
          const normalizedUser = normalizeProfilePictureUrl(user);

          // Set language from user preference
          if (normalizedUser.preferredLanguage && i18n.language !== normalizedUser.preferredLanguage) {
            i18n.changeLanguage(normalizedUser.preferredLanguage);
          }

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.post(`${API_URL}/auth/register`, userData);

          const { user, token } = response.data.data;

          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Normalize profile picture URL
          const normalizedUser = normalizeProfilePictureUrl(user);

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await axios.post(`${API_URL}/auth/logout`);
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth data regardless of API response
          delete axios.defaults.headers.common['Authorization'];
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await axios.get(`${API_URL}/auth/me`);
          
          // Normalize profile picture URL
          const normalizedUser = normalizeProfilePictureUrl(response.data.data.user);
          
          // Set language from user preference
          if (normalizedUser.preferredLanguage && i18n.language !== normalizedUser.preferredLanguage) {
            i18n.changeLanguage(normalizedUser.preferredLanguage);
          }
          
          set({
            user: normalizedUser,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token is invalid or expired - silently fail
          console.log('Auth check failed, clearing token');
          delete axios.defaults.headers.common['Authorization'];
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // Update user data
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...normalizeProfilePictureUrl(userData) },
        }));
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
