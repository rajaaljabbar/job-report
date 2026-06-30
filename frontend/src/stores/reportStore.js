import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './authStore';

const useReportStore = create((set, get) => ({
  monthlyStats: { jobdesc: 0, improvement: 0, helpUser: 0, total: 0, daysWithReport: 0, workingDays: 0 },
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

  fetchMonthlyStats: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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

      // Count working days (Mon-Fri) from start of month to today
      const today = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      let workingDays = 0;
      const cursor = new Date(firstDay);
      while (cursor <= today) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) workingDays++; // Skip Sat(6) & Sun(0)
        cursor.setDate(cursor.getDate() + 1);
      }

      set({
        monthlyStats: {
          jobdesc, improvement, helpUser, total: data.length,
          daysWithReport,
          workingDays,
        },
      });
    }
  },

  fetchRecentActivities: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('date_worked', { ascending: false })
      .limit(3);

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
}));

export default useReportStore;
