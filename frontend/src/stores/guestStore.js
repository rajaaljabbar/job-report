import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { countWorkingDays, isWorkingDay } from '../lib/holidays';

const useGuestStore = create((set, get) => ({
  profile: null,
  reports: [],
  monthlyStats: { jobdesc: 0, improvement: 0, helpUser: 0, total: 0, daysWithReport: 0, workingDays: 0, cuti: 0, sakit: 0, izin: 0 },
  recentActivities: [],
  isLoading: false,
  error: null,

  fetchGuestProfile: async (username) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.rpc('get_public_profile', {
      target_username: username,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }

    const profile = data?.[0] || null;
    set({ profile, isLoading: false });
    return profile;
  },

  fetchGuestReports: async (username, year, month) => {
    const startDate = year !== undefined && month !== undefined
      ? `${year}-${String(month + 1).padStart(2, '0')}-01`
      : null;
    const endDate = startDate
      ? `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
      : null;

    const { error } = await supabase.rpc('get_public_reports', {
      target_username: username,
      start_date: startDate,
      end_date: endDate,
    }).then(({ data, error }) => {
      if (!error && data) {
        set({ reports: data });
      }
      return { error };
    });

    if (error) set({ error: error.message });
  },

  fetchGuestMonthlyStats: async (username, year, month) => {
    const { data, error } = await supabase.rpc('get_public_monthly_stats', {
      target_username: username,
      target_year: year,
      target_month: month + 1, // SQL expects 1-indexed month
    });

    if (!error && data) {
      const jobdesc = data.filter((r) => r.category === 'jobdesc').length;
      const improvement = data.filter((r) => r.category === 'improvement').length;
      const helpUser = data.filter((r) => r.category === 'helpUser').length;
      const uniqueDates = new Set(data.map((r) => r.date_worked));
      const daysWithReport = uniqueDates.size;

      const now = new Date();
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
      const lastDay = isCurrentMonth ? now : new Date(year, month + 1, 0);
      let workingDays = countWorkingDays(year, month, lastDay);

      // Fetch absences & subtract
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
      const { data: absences } = await supabase.rpc('get_public_absences', {
        target_username: username,
        start_date: startDate,
        end_date: endDate,
      });

      if (absences) {
        const absenceDates = new Set(absences.map((a) => a.date));
        const cuti = absences.filter((a) => a.type === 'cuti').length;
        const sakit = absences.filter((a) => a.type === 'sakit').length;
        const izin = absences.filter((a) => a.type === 'izin').length;
        const cursor2 = new Date(year, month, 1);
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
    } else {
      // No data for this month → zero out
      const now = new Date();
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
      const lastDay = isCurrentMonth ? now : new Date(year, month + 1, 0);
      const workingDays = countWorkingDays(year, month, lastDay);
      set({
        monthlyStats: { jobdesc: 0, improvement: 0, helpUser: 0, total: 0, daysWithReport: 0, workingDays, cuti: 0, sakit: 0, izin: 0 },
      });
    }
  },

  fetchGuestRecentActivities: async (username, year, month) => {
    const startDate = year !== undefined && month !== undefined
      ? `${year}-${String(month + 1).padStart(2, '0')}-01`
      : null;
    const endDate = startDate
      ? `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
      : null;

    const { data, error } = await supabase.rpc('get_public_reports', {
      target_username: username,
      start_date: startDate,
      end_date: endDate,
    });

    if (!error && data) {
      const latest = data.slice(0, 3);
      set({
        recentActivities: latest.map((r) => ({
          id: r.id,
          date: new Date(r.date_worked).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
          }),
          category: r.category,
          title: r.title,
          description: r.description,
          userName: r.user_name || '',
        })),
      });
    }
  },

  fetchGuestEvidence: async (reportIds) => {
    if (!reportIds || reportIds.length === 0) return {};
    const { data, error } = await supabase.rpc('get_public_evidence', {
      report_ids: reportIds,
    });
    if (!error && data) {
      const map = {};
      data.forEach((e) => {
        if (!map[e.report_id]) map[e.report_id] = [];
        map[e.report_id].push(e);
      });
      return map;
    }
    return {};
  },
}));

export default useGuestStore;
