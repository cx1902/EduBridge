import { create } from 'zustand';
import axios from 'axios';
import i18n from '../i18n/config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const STORAGE_KEY = 'auth-storage';

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

// Helper to get initial state from storage
const getStoredAuth = () => {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    const session = sessionStorage.getItem(STORAGE_KEY);
    const stored = local || session;

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.token) {
        // Set axios header immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse auth storage', e);
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    rememberMe: false
  };
};

// Helper to save state to storage
const saveStoredAuth = (data, rememberMe) => {
  const storageValue = JSON.stringify({
    user: data.user,
    token: data.token,
    isAuthenticated: true,
    rememberMe: rememberMe
  });

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, storageValue);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, storageValue);
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Helper to clear storage
const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  delete axios.defaults.headers.common['Authorization'];
};

export const useAuthStore = create((set, get) => {
  // Initialize state from storage
  const initialState = getStoredAuth();

  return {
    user: initialState.user,
    token: initialState.token,
    isAuthenticated: initialState.isAuthenticated,
    rememberMe: initialState.rememberMe,
    isLoading: false,
    error: null,

    // Login
    login: async (email, password, rememberMe = false) => {
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

        const authData = {
          user: normalizedUser,
          token,
          isAuthenticated: true,
          rememberMe
        };

        // Save to storage manually
        saveStoredAuth(authData, rememberMe);

        set({
          ...authData,
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

        const authData = {
          user: normalizedUser,
          token,
          isAuthenticated: true,
          rememberMe: false // Default to false for register
        };

        // Save to session storage by default for registration
        saveStoredAuth(authData, false);

        set({
          ...authData,
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
        await axios.post(`${API_URL}/auth/logout`, {}, { timeout: 5000 });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        clearStoredAuth();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          rememberMe: false
        });
      }
    },

    // Check authentication status
    checkAuth: async () => {
      const { token } = get();

      if (!token) {
        // Double check storage in case state was lost but storage exists
        const stored = getStoredAuth();
        if (stored.token) {
          set(stored);
          // Continue to verify with backend
        } else {
          set({ isAuthenticated: false });
          return;
        }
      }

      try {
        // Ensure header is set
        const currentToken = get().token;
        if (currentToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        }

        const response = await axios.get(`${API_URL}/auth/me`);

        // Normalize profile picture URL
        const normalizedUser = normalizeProfilePictureUrl(response.data.data.user);

        // Set language from user preference
        if (normalizedUser.preferredLanguage && i18n.language !== normalizedUser.preferredLanguage) {
          i18n.changeLanguage(normalizedUser.preferredLanguage);
        }

        const newData = {
          user: normalizedUser,
          isAuthenticated: true,
        };

        // Update storage if user data changed
        const currentAuth = get();
        saveStoredAuth({ ...currentAuth, ...newData }, currentAuth.rememberMe);

        set(newData);
      } catch (error) {
        // If token is invalid (401), logout
        if (error.response?.status === 401 || error.response?.status === 403) {
          get().logout();
        }
      }
    },

    // Update user data
    updateUser: (userData) => {
      const normalized = normalizeProfilePictureUrl(userData);
      set((state) => {
        const newUser = { ...state.user, ...normalized };
        // Update storage
        saveStoredAuth({ ...state, user: newUser }, state.rememberMe);
        return { user: newUser };
      });
    },

    // Clear error
    clearError: () => set({ error: null }),
  };
});
