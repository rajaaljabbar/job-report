import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import useGuestStore from '../../stores/guestStore';

const COLORS = { jobdesc: '#10b981', improvement: '#2170e4', helpUser: '#e29100' };

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const categoryMap = {
  jobdesc: { dot: 'bg-primary', bg: 'bg-primary-container/10', text: 'text-primary', label: 'Jobdesc Utama', icon: 'computer' },
  improvement: { dot: 'bg-secondary-container', bg: 'bg-secondary-container/10', text: 'text-secondary', label: 'Improvement', icon: 'security' },
  helpUser: { dot: 'bg-tertiary', bg: 'bg-tertiary-container/10', text: 'text-tertiary', label: 'Help User', icon: 'vpn_key' },
};

export default function GuestViewPage() {
  const { username } = useParams();
  const {
    profile, reports, monthlyStats, recentActivities,
    isLoading, error,
    fetchGuestProfile, fetchGuestReports, fetchGuestMonthlyStats,
    fetchGuestRecentActivities, fetchGuestEvidence,
  } = useGuestStore();

  const [evidenceMap, setEvidenceMap] = useState({});
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Month navigation
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  // History month filter
  const [historyYear, setHistoryYear] = useState(now.getFullYear());
  const [historyMonthIdx, setHistoryMonthIdx] = useState(now.getMonth());
  const historyMonth = `${historyYear}-${String(historyMonthIdx + 1).padStart(2, '0')}`;
  const isHistoryCurrentMonth = historyYear === now.getFullYear() && historyMonthIdx === now.getMonth();

  const goToPrevHistoryMonth = () => {
    if (historyMonthIdx === 0) {
      setHistoryMonthIdx(11);
      setHistoryYear((y) => y - 1);
    } else {
      setHistoryMonthIdx((m) => m - 1);
    }
  };

  const goToNextHistoryMonth = () => {
    if (isHistoryCurrentMonth) return;
    if (historyMonthIdx === 11) {
      setHistoryMonthIdx(0);
      setHistoryYear((y) => y + 1);
    } else {
      setHistoryMonthIdx((m) => m + 1);
    }
  };

  useEffect(() => {
    if (username) {
      fetchGuestProfile(username).then((p) => {
        if (p) {
          fetchGuestReports(username, selectedYear, selectedMonth);
          fetchGuestMonthlyStats(username, selectedYear, selectedMonth);
          fetchGuestRecentActivities(username, selectedYear, selectedMonth);
        }
      });
    }
  }, [username, selectedYear, selectedMonth]);

  // Fetch reports for history tab whenever month filter changes
  useEffect(() => {
    if (username) {
      fetchGuestReports(username, historyYear, historyMonthIdx);
    }
  }, [username, historyYear, historyMonthIdx, activeTab]);

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Fetch evidence after reports load
  useEffect(() => {
    if (reports.length > 0) {
      const ids = reports.map((r) => r.id);
      fetchGuestEvidence(ids).then(setEvidenceMap);
    }
  }, [reports]);

  const chartData = [
    { name: 'Jobdesc Utama', value: monthlyStats.jobdesc, color: COLORS.jobdesc },
    { name: 'Improvement', value: monthlyStats.improvement, color: COLORS.improvement },
    { name: 'Help User', value: monthlyStats.helpUser, color: COLORS.helpUser },
  ];

  const activeDays = monthlyStats.daysWithReport;
  const slaText = monthlyStats.workingDays > 0
    ? Math.min(Math.round((activeDays / monthlyStats.workingDays) * 100), 100) + '%'
    : '-';

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const userName = r.user_name || '';
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !userName.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      // Month filter
      if (historyMonth) {
        const [y, m] = historyMonth.split('-').map(Number);
        const reportDate = new Date(r.date_worked);
        if (reportDate.getFullYear() !== y || reportDate.getMonth() + 1 !== m) return false;
      }
      return true;
    });
  }, [reports, search, catFilter, historyMonth]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filteredReports.forEach((r) => {
      const dateStr = new Date(r.date_worked).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(r);
    });
    return Object.entries(map);
  }, [filteredReports]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Error / Not Found ---
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">person_off</span>
        <h1 className="text-2xl font-bold text-on-surface mb-2">User Tidak Ditemukan</h1>
        <p className="text-on-surface-variant mb-6">Username <strong>{username}</strong> tidak terdaftar atau link tidak valid.</p>
        <Link to="/login" className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-surface-tint transition-colors">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Guest Banner */}
      <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600">visibility</span>
          <span className="text-xs font-semibold text-amber-800">Guest View — Read Only</span>
        </div>
        <Link to="/login" className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline">
          Login
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* Profile Header */}
        <section className="bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-xl p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface">
              {profile.full_name || username}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">{profile.position || 'Tim Support'}</p>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 p-1 flex-shrink-0">
            {profile.avatar_url ? (
              <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={profile.avatar_url} />
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
              </div>
            )}
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-surface-container p-1 gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">dashboard</span>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">history</span>
            History
          </button>
        </div>

        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Scoreboard + Chart */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
              <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined filled text-3xl">task_alt</span>
                </div>
                <div>
                  <h3 className="text-5xl font-bold text-on-surface leading-tight">{monthlyStats.total}</h3>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Total Tugas</p>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-surface-container rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-on-surface">{activeDays}</p>
                    <p className="text-[10px] text-on-surface-variant">Hari Aktif</p>
                  </div>
                  <div className="bg-surface-container rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-on-surface">{slaText}</p>
                    <p className="text-[10px] text-on-surface-variant">SLA</p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.jobdesc }} />
                    <span className="text-xs text-on-surface-variant">{monthlyStats.jobdesc}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.improvement }} />
                    <span className="text-xs text-on-surface-variant">{monthlyStats.improvement}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.helpUser }} />
                    <span className="text-xs text-on-surface-variant">{monthlyStats.helpUser}</span>
                  </div>
                </div>

                {/* Absence Info */}
                {(monthlyStats.cuti > 0 || monthlyStats.sakit > 0 || monthlyStats.izin > 0) && (
                  <p className="text-[10px] text-on-surface-variant text-center leading-relaxed">
                    Cuti {monthlyStats.cuti} · Sakit {monthlyStats.sakit} · Izin {monthlyStats.izin}
                  </p>
                )}

                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <span className="text-sm font-semibold text-on-surface min-w-[120px] text-center">
                    {monthNames[selectedMonth]} {selectedYear}
                  </span>
                  <button
                    onClick={goToNextMonth}
                    disabled={isCurrentMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col md:flex-row items-center justify-around gap-8">
                <div className="relative w-48 h-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" strokeWidth={0}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-semibold text-on-surface-variant">SLA</span>
                    <span className="text-xl font-bold text-on-surface leading-tight">{slaText}</span>
                    <span className="text-[9px] text-on-surface-variant mt-0.5 leading-tight">{activeDays} / {monthlyStats.workingDays} hari</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-[200px]">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-on-surface">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-on-surface">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Activities */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-on-surface">Aktivitas Terakhir</h3>
                <button
                  onClick={() => {
                    setHistoryYear(selectedYear);
                    setHistoryMonthIdx(selectedMonth);
                    setActiveTab('history');
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Lihat Semua &gt;
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {recentActivities.map((activity) => {
                  const cfg = categoryMap[activity.category] || categoryMap.jobdesc;
                  return (
                    <div
                      key={activity.id}
                      className="group relative bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-4 flex items-start gap-4 transition-all overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.dot}`} />
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center flex-shrink-0 mt-1`}>
                        <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-base font-bold text-on-surface truncate">{activity.title}</h4>
                          <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">{activity.date}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant line-clamp-1 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold uppercase">{cfg.label}</span>
                          {activity.userName && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">👤 {activity.userName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <p className="text-center text-sm text-on-surface-variant py-8">Belum ada aktivitas.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  placeholder="Cari judul atau user..."
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevHistoryMonth}
                  className="h-10 px-2 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="h-10 px-3 flex items-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-semibold min-w-[130px] justify-center">
                  {monthNames[historyMonthIdx]} {historyYear}
                </span>
                <button
                  onClick={goToNextHistoryMonth}
                  disabled={isHistoryCurrentMonth}
                  className="h-10 px-2 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
              <select
                value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="h-10 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="jobdesc">Jobdesc Utama</option>
                <option value="improvement">Improvement</option>
                <option value="helpUser">Help User</option>
              </select>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-8">
              {grouped.map(([date, dateReports]) => (
                <section key={date} className="flex flex-col gap-4 relative">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider bg-background pr-4 relative z-10">{date}</h3>
                    <div className="flex-1 h-[1px] bg-outline-variant" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {dateReports.map((report) => {
                      const cat = categoryMap[report.category] || categoryMap.jobdesc;
                      const evList = evidenceMap[report.id] || [];
                      const firstEvidence = evList[0] || null;
                      const timeStr = report.created_at
                        ? new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div key={report.id} className="relative flex gap-4 w-full group">
                          <div className="mt-4 w-10 md:w-12 flex justify-center relative z-10">
                            <div className={`w-[14px] h-[14px] rounded-full ${cat.dot} border-2 border-background ring-4 ring-background group-hover:scale-125 transition-transform`} />
                          </div>
                          <div className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.dot}`} />
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-semibold ${cat.text} px-2 py-0.5 rounded ${cat.bg}`}>{cat.label}</span>
                                  {timeStr && <span className="text-sm text-on-surface-variant">{timeStr}</span>}
                                </div>
                                <h4 className="text-lg font-semibold text-on-surface mb-2">{report.title}</h4>
                                <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{report.description}</p>
                                {report.jobdesc_text && (
                                  <p className="text-xs text-on-surface-variant italic mb-2">📋 {report.jobdesc_text}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-auto">
                                <span className="material-symbols-outlined text-outline text-base">person</span>
                                <span className="text-xs font-semibold text-on-surface">{report.user_name || '-'}</span>
                              </div>
                            </div>
                            {firstEvidence && (
                              <div className="w-full md:w-32 h-24 md:h-auto rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                                <img src={firstEvidence.file_url} alt="Evidence" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              {filteredReports.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
                  <p className="text-lg font-semibold">Tidak ada laporan</p>
                  <p className="text-sm">Coba ubah filter atau kata kunci pencarian.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-outline-variant mt-4">
          <p className="text-xs text-on-surface-variant">
            Created with{' '}
            <span className="material-symbols-outlined text-sm text-red-500 align-middle">favorite</span>
            {' '}by <span className="font-semibold">Putra</span> — Guest View
          </p>
        </div>
      </div>
    </div>
  );
}
