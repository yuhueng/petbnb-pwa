import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // State
  isSidebarOpen: false,
  isModalOpen: false,
  modalContent: null,
  notifications: [],
  isLoading: false,
  pageTitle: '',

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Modal actions
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // Notification actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now(), ...notification }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  // Loading actions
  setLoading: (isLoading) => set({ isLoading }),

  // Page title actions
  setPageTitle: (title) => set({ pageTitle: title }),
}));
