import { create } from 'zustand';

const useJobdescStore = create((set) => ({
  items: [
    { id: '1', text: 'Monitoring & troubleshooting jaringan' },
    { id: '2', text: 'Hardening & update software staff' },
    { id: '3', text: 'Onboarding karyawan baru' },
  ],

  addJobdesc: (text) => {
    set((state) => ({
      items: [...state.items, { id: Date.now().toString(), text }],
    }));
  },

  updateJobdesc: (id, text) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  },

  deleteJobdesc: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));

export default useJobdescStore;
