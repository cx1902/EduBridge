import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // light, dark, high_contrast
      fontSize: 'medium', // small, medium, large, extra_large
      language: 'en',

      // Set theme
      setTheme: (theme) => set({ theme }),

      // Set font size
      setFontSize: (fontSize) => set({ fontSize }),

      // Set language
      setLanguage: (language) => set({ language }),

      // Toggle between light and dark theme with animation
      toggleTheme: () => {
        // Add transition class
        document.documentElement.classList.add('theme-transitioning');
        
        // Toggle theme
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
        
        // Remove transition class after animation completes
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 400);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
