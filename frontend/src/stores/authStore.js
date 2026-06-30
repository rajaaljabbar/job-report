import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: {
    id: '1',
    name: 'Putra Raja Aljabbar',
    email: 'putra@it-support.com',
    position: 'IT Support & Infrastructure',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuzZJV9EEKvAeOA3G6xIK_N04ZHCWbPvmSGzkURjjox3o2-6Aa6sX4WkUCKTlIiC3yOwb7yBwukXyLcExqT6597ziMSjoE9y7mO2GwmwOxsXjxMy4q5GZcVwj0f1VTnHPva_1HEddRzYjvXd5GM2s0CD6_QpiM07m7weCcBdYpNiB3Iy0X79RV9QD54CAKMcyQzZN1V9EFIlJlRhKe3fBsTtee1AvNQzTQP7CkwFArJc3Eel2TYuT-eGPGrqL50QMPFifv_Iv4WrA',
  },
  isAuthenticated: true,
  isProfileComplete: true,

  login: async (email, password) => {
    // Mock login
    set({ isAuthenticated: true });
  },

  loginWithGoogle: async () => {
    set({ isAuthenticated: true });
  },

  register: async (name, email, password) => {
    set({
      isAuthenticated: true,
      user: { ...useAuthStore.getState().user, name, email },
      isProfileComplete: false,
    });
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
  },

  updateProfile: (data) => {
    set((state) => ({
      user: { ...state.user, ...data },
      isProfileComplete: true,
    }));
  },
}));

export default useAuthStore;
