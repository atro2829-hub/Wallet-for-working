import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminRole = 'admin' | 'owner';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  photoURL?: string;
}

interface AdminState {
  // Auth
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  setAdminUser: (user: AdminUser | null) => void;
  logout: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Navigation
  activePanel: string;
  setActivePanel: (panel: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Toast
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Auth
      adminUser: null,
      isAuthenticated: false,
      setAdminUser: (user) =>
        set({
          adminUser: user,
          isAuthenticated: !!user,
        }),
      logout: () =>
        set({
          adminUser: null,
          isAuthenticated: false,
          activePanel: 'dashboard',
        }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      // Navigation
      activePanel: 'dashboard',
      setActivePanel: (panel) => set({ activePanel: panel, sidebarOpen: false }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Toast
      toastMessage: '',
      toastType: 'info',
      showToast: (message, type = 'info') =>
        set({ toastMessage: message, toastType: type }),
      clearToast: () => set({ toastMessage: '' }),
    }),
    {
      name: 'south-admin-store',
      partialize: (state) => ({
        theme: state.theme,
        activePanel: state.activePanel,
      }),
    }
  )
);
