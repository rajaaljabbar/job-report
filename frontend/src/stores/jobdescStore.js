import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './authStore';

const useJobdescStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchJobdescs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('jobdescs')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (!error) {
      set({ items: data.map((j) => ({ id: j.id, text: j.text })), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  addJobdesc: async (text) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('jobdescs')
      .insert({ user_id: user.id, text })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        items: [...state.items, { id: data.id, text: data.text }],
      }));
    }
  },

  updateJobdesc: async (id, text) => {
    const { error } = await supabase
      .from('jobdescs')
      .update({ text })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, text } : item
        ),
      }));
    }
  },

  deleteJobdesc: async (id) => {
    const { error } = await supabase
      .from('jobdescs')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    }
  },
}));

export default useJobdescStore;
