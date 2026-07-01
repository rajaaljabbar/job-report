import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './authStore';

const useAbsenceStore = create((set, get) => ({
  absences: [], // { id, date, type, note }
  isLoading: false,

  fetchAbsences: async (year, month) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (!error) {
      set({ absences: data || [], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  toggleAbsence: async (date, type) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const existing = get().absences.find((a) => a.date === dateStr);

    if (existing && !type) {
      // Remove absence (4th click)
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('id', existing.id);

      if (!error) {
        set((state) => ({
          absences: state.absences.filter((a) => a.id !== existing.id),
        }));
      }
    } else if (existing && type) {
      // Update type (2nd/3rd click)
      const { data, error } = await supabase
        .from('absences')
        .update({ type })
        .eq('id', existing.id)
        .select()
        .single();

      if (!error && data) {
        set((state) => ({
          absences: state.absences.map((a) => (a.id === existing.id ? data : a)),
        }));
      }
    } else if (!existing && type) {
      // Insert new absence (1st click)
      const { data, error } = await supabase
        .from('absences')
        .insert({ user_id: user.id, date: dateStr, type, note: '' })
        .select()
        .single();

      if (!error && data) {
        set((state) => ({ absences: [...state.absences, data] }));
      }
    }
  },

  // For guest/public view
  fetchPublicAbsences: async (username, year, month) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    const { data, error } = await supabase.rpc('get_public_absences', {
      target_username: username,
      start_date: startDate,
      end_date: endDate,
    });

    if (!error && data) {
      return data.map((a) => ({ date: a.date, type: a.type }));
    }
    return [];
  },
}));

export default useAbsenceStore;
