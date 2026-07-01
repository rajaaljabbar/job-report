import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './authStore';
import { countWorkingDays, isWorkingDay } from '../lib/holidays';

const useReportStore = create((set, get) => ({
  monthlyStats: { jobdesc: 0, improvement: 0, helpUser: 0, total: 0, daysWithReport: 0, workingDays: 0, cuti: 0, sakit: 0, izin: 0 },
  recentActivities: [],
  allReports: [],
  isLoading: false,
  filters: { search: '', dateRange: null, category: 'all' },

  fetchReports: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    const { filters } = get();

    let query = supabase
      .from('reports')
      .select('*, jobdescs(text), report_evidence(*)')
      .eq('user_id', user.id)
      .order('date_worked', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%`);
    }
    if (filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.dateRange?.start) {
      query = query.gte('date_worked', filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      query = query.lte('date_worked', filters.dateRange.end);
    }

    const { data, error } = await query.limit(50);
    if (!error) {
      set({ allReports: data || [], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchMonthlyStats: async (year, month) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth(); // 0-indexed

    const startOfMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${new Date(targetYear, targetMonth + 1, 0).getDate()}`;

    const { data, error } = await supabase
      .from('reports')
      .select('category, date_worked')
      .eq('user_id', user.id)
      .gte('date_worked', startOfMonth)
      .lte('date_worked', endOfMonth);

    if (!error && data) {
      const jobdesc = data.filter((r) => r.category === 'jobdesc').length;
      const improvement = data.filter((r) => r.category === 'improvement').length;
      const helpUser = data.filter((r) => r.category === 'helpUser').length;

      // Count unique working days with reports
      const uniqueDates = new Set(data.map((r) => r.date_worked));
      const daysWithReport = uniqueDates.size;

      // Count working days (Sen-Jum, minus tanggal merah & cuti bersama Indonesia)
      const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth();
      const lastDay = isCurrentMonth ? now : new Date(targetYear, targetMonth + 1, 0);
      let workingDays = countWorkingDays(targetYear, targetMonth, lastDay);

      // Also fetch user absences for this month & subtract from working days
      const { data: absences } = await supabase
        .from('absences')
        .select('date, type')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (absences) {
        const absenceDates = new Set(absences.map((a) => a.date));
        const cuti = absences.filter((a) => a.type === 'cuti').length;
        const sakit = absences.filter((a) => a.type === 'sakit').length;
        const izin = absences.filter((a) => a.type === 'izin').length;
        // Subtract absences that fall on working days (not weekends/holidays)
        const cursor2 = new Date(targetYear, targetMonth, 1);
        while (cursor2 <= lastDay) {
          const y = cursor2.getFullYear();
          const m = String(cursor2.getMonth() + 1).padStart(2, '0');
          const d = String(cursor2.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          if (absenceDates.has(dateStr) && isWorkingDay(cursor2)) {
            workingDays--;
          }
          cursor2.setDate(cursor2.getDate() + 1);
        }
        set({
          monthlyStats: {
            jobdesc, improvement, helpUser, total: data.length,
            daysWithReport, workingDays, cuti, sakit, izin,
          },
        });
      } else {
        set({
          monthlyStats: {
            jobdesc, improvement, helpUser, total: data.length,
            daysWithReport, workingDays, cuti: 0, sakit: 0, izin: 0,
          },
        });
      }
    }
  },

  fetchRecentActivities: async (year, month) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('date_worked', { ascending: false });

    // If month/year provided, filter by that month
    if (year !== undefined && month !== undefined) {
      const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
      query = query.gte('date_worked', startOfMonth).lte('date_worked', endOfMonth);
    }

    const { data, error } = await query.limit(3);

    if (!error && data) {
      set({
        recentActivities: data.map((r) => ({
          id: r.id,
          date: new Date(r.date_worked).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          category: r.category,
          title: r.title,
          description: r.description,
          userName: r.user_name || '',
        })),
      });
    }
  },

  submitReport: async (reportData) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        jobdesc_id: reportData.jobdescId || null,
        category: reportData.category,
        date_worked: reportData.dateWorked,
        title: reportData.title,
        description: reportData.description,
        user_name: reportData.userName || null,
        is_user_requested: reportData.isUserRequested || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  addEvidence: async (reportId, evidenceData) => {
    const { error } = await supabase
      .from('report_evidence')
      .insert({
        report_id: reportId,
        file_url: evidenceData.url,
        cloudinary_public_id: evidenceData.publicId,
        file_name: evidenceData.fileName,
        file_size: evidenceData.size,
        mime_type: evidenceData.mimeType,
      });

    if (error) throw error;
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: { search: '', dateRange: null, category: 'all' } });
  },

  deleteReport: async (reportId) => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    // Remove from local state
    set((state) => ({
      allReports: state.allReports.filter((r) => r.id !== reportId),
      recentActivities: state.recentActivities.filter((r) => r.id !== reportId),
    }));
  },
}));

export default useReportStore;
