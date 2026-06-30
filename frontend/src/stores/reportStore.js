import { create } from 'zustand';

const useReportStore = create((set) => ({
  monthlyStats: { jobdesc: 15, improvement: 8, helpUser: 7, total: 30 },

  recentActivities: [
    {
      id: '1',
      date: '28 Jun 2026',
      category: 'jobdesc',
      title: 'Monitoring jaringan kantor pusat',
      description: 'Pengecekan rutin performa jaringan dan troubleshooting minor.',
    },
    {
      id: '2',
      date: '27 Jun 2026',
      category: 'improvement',
      title: 'Migrasi server ke TrueNAS',
      description: 'Setup dan konfigurasi environment server baru di TrueNAS Scale.',
    },
    {
      id: '3',
      date: '27 Jun 2026',
      category: 'helpUser',
      title: 'Bantu pengecekan IC Power laptop',
      description: 'Membantu pengecekan kerusakan IC Power laptop untuk staf Finance.',
      userName: 'Bu Rina (Finance)',
    },
  ],

  allReports: [
    { id: '1', date: '30 Jun 2026', time: '14:30', category: 'secondary', categoryLabel: 'Network Issue', title: 'Router Replacement - Floor 3', description: 'Replaced faulty Cisco ISR with new unboxing unit. Confirmed connectivity across all access points on the east wing.', userName: 'Alex Mercer (Network Ops)', hasEvidence: true },
    { id: '2', date: '30 Jun 2026', time: '11:15', category: 'primary', categoryLabel: 'Hardware Request', title: 'New Hire Setup: Jane Doe', description: 'Provisioned standard developer kit (MacBook Pro 16", 2x Dell Monitors, Docking Station).', userName: 'Sarah Connor (Helpdesk)', hasEvidence: false },
    { id: '3', date: '29 Jun 2026', time: '16:45', category: 'tertiary', categoryLabel: 'Software Patch', title: 'Emergency VPN Update Deployment', description: 'Pushed critical security patch v2.4.1 to all remote client endpoints.', userName: 'System Auto (SCCM)', hasEvidence: false },
  ],

  filters: { search: '', dateRange: null, category: 'all' },

  submitReport: (data) => {
    const newReport = { id: Date.now().toString(), ...data };
    set((state) => ({
      allReports: [newReport, ...state.allReports],
    }));
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: { search: '', dateRange: null, category: 'all' } });
  },
}));

export default useReportStore;
