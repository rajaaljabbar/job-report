import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import useAuthStore from '../../stores/authStore';
import useReportStore from '../../stores/reportStore';

const COLORS = { jobdesc: '#10b981', improvement: '#2170e4', helpUser: '#e29100' };

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { monthlyStats, recentActivities } = useReportStore();
  const navigate = useNavigate();

  const chartData = [
    { name: 'Jobdesc Utama', value: monthlyStats.jobdesc, color: COLORS.jobdesc },
    { name: 'Improvement', value: monthlyStats.improvement, color: COLORS.improvement },
    { name: 'Help User', value: monthlyStats.helpUser, color: COLORS.helpUser },
  ];

  const categoryConfig = {
    jobdesc: { color: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10', icon: 'computer', label: 'Jobdesc' },
    improvement: { color: 'bg-secondary', text: 'text-secondary', bg: 'bg-secondary/10', icon: 'security', label: 'Improvement' },
    helpUser: { color: 'bg-tertiary', text: 'text-tertiary', bg: 'bg-tertiary/10', icon: 'vpn_key', label: 'Help User' },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-8">
      {/* Header / Greeting */}
      <section className="flex justify-between items-center bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-xl p-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-on-surface">Halo, {user?.name?.split(' ')[0] || 'User'} 👋</h2>
          <p className="text-sm text-on-surface-variant mt-1">{user?.position || 'IT Support'}</p>
        </div>
        <Link to="/profile/edit" className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 p-1 flex-shrink-0">
          <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={user?.avatar || ''} />
        </Link>
      </section>

      {/* Hero Analytics */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
        {/* Scoreboard */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined filled text-3xl">task_alt</span>
          </div>
          <h3 className="text-5xl font-bold text-on-surface leading-tight">{monthlyStats.total}</h3>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-2">Total Tugas</p>
          <p className="text-sm text-on-surface-variant mt-4 bg-surface-container px-3 py-1 rounded-full">Bulan Ini</p>
        </div>

        {/* Donut Chart */}
        <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col md:flex-row items-center justify-around gap-8">
          <div className="relative w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  dataKey="value" strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-on-surface-variant">SLA</span>
              <span className="text-2xl font-bold text-on-surface">94%</span>
            </div>
          </div>

          {/* Legend */}
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
          <Link to="/history" className="text-xs font-semibold text-primary hover:underline">Lihat Semua &gt;</Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentActivities.map((activity) => {
            const cfg = categoryConfig[activity.category];
            return (
              <div
                key={activity.id}
                onClick={() => navigate(`/history?highlight=${activity.id}`)}
                className="group relative bg-surface-container-lowest border border-outline-variant shadow-sm hover:shadow-md rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.color}`} />
                <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center flex-shrink-0 mt-1`}>
                  <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">{activity.title}</h4>
                    <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">{activity.date}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-1 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold uppercase`}>{cfg.label}</span>
                    {activity.userName && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">👤 {activity.userName}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
