import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const categoryMap = {
  jobdesc: { dot: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary', label: 'Jobdesc Utama' },
  improvement: { dot: 'bg-secondary', bg: 'bg-secondary/10', text: 'text-secondary', label: 'Improvement' },
  helpUser: { dot: 'bg-tertiary', bg: 'bg-tertiary/10', text: 'text-tertiary', label: 'Help User' },
};

export default function GuestPage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      // 1. Cari user by slug (nama tanpa spasi)
      const { data: profileData, error: profileErr } = await supabase
        .rpc('get_public_profile', { p_slug: slug });

      if (profileErr || !profileData || profileData.length === 0) {
        setError('User tidak ditemukan.');
        setLoading(false);
        return;
      }

      const user = profileData[0];
      setProfile(user);

      // 2. Ambil laporan
      const { data: reportData, error: reportErr } = await supabase
        .rpc('get_public_reports', { p_user_id: user.user_id });

      if (!reportErr) setReports(reportData || []);

      // 3. Ambil stats
      const { data: statsData } = await supabase
        .rpc('get_public_monthly_stats', { p_user_id: user.user_id });

      if (statsData && statsData.length > 0) setStats(statsData[0]);

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">person_off</span>
        <h1 className="text-2xl font-bold text-on-surface mb-2">User Tidak Ditemukan</h1>
        <p className="text-on-surface-variant mb-6">{error || 'Coba periksa kembali URL-nya.'}</p>
        <Link to="/login" className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold">Ke Halaman Login</Link>
      </div>
    );
  }

  const slaText = stats && stats.total_count > 0
    ? Math.min(Math.round((Number(stats.days_with_report) / Number(stats.working_days)) * 100), 100) + '%'
    : '-';

  // Group reports by date
  const grouped = {};
  reports.forEach((r) => {
    const dateStr = new Date(r.date_worked + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(r);
  });
  const groupedEntries = Object.entries(grouped);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-primary">person</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-on-surface">{profile.full_name}</h1>
          <p className="text-sm text-on-surface-variant">{profile.position || '-'}</p>
        </div>

        {/* Stats Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center justify-around gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-on-surface">{stats?.total_count ?? 0}</p>
            <p className="text-xs text-on-surface-variant mt-1">Total Tugas</p>
          </div>
          <div className="w-px h-12 bg-surface-variant" />
          <div className="text-center">
            <p className="text-3xl font-bold text-on-surface">{slaText}</p>
            <p className="text-xs text-on-surface-variant mt-1">SLA Bulan Ini</p>
          </div>
          <div className="w-px h-12 bg-surface-variant" />
          <div className="text-center">
            <p className="text-3xl font-bold text-on-surface">{stats?.days_with_report ?? 0}/{stats?.working_days ?? 0}</p>
            <p className="text-xs text-on-surface-variant mt-1">Hari Kerja</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-on-surface">Riwayat Laporan</h2>
          {groupedEntries.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3">article</span>
              <p className="text-lg font-semibold">Belum ada laporan</p>
            </div>
          ) : (
            groupedEntries.map(([date, items]) => (
              <section key={date} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{date}</h3>
                  <div className="flex-1 h-px bg-surface-variant" />
                </div>
                {items.map((r) => {
                  const cat = categoryMap[r.category] || categoryMap.jobdesc;
                  const timeStr = r.created_at
                    ? new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <div key={r.id} className="relative flex gap-3">
                      <div className="mt-4 w-8 flex justify-center relative z-10">
                        <div className={`w-3 h-3 rounded-full ${cat.dot} border-2 border-background ring-4 ring-background`} />
                      </div>
                      <div className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.dot}`} />
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-semibold ${cat.text} px-2 py-0.5 rounded ${cat.bg}`}>{cat.label}</span>
                          {timeStr && <span className="text-xs text-on-surface-variant">{timeStr}</span>}
                        </div>
                        <h4 className="font-semibold text-on-surface mb-1">{r.title}</h4>
                        <p className="text-sm text-on-surface-variant line-clamp-2">{r.description}</p>
                        {r.user_name && (
                          <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">person</span>
                            {r.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-on-surface-variant pb-8">
          Powered by <Link to="/login" className="text-primary font-semibold hover:underline">DayTrack</Link>
        </p>
      </div>
    </div>
  );
}
