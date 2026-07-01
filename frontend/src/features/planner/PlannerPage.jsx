import { useState, useEffect } from 'react';
import useAbsenceStore from '../../stores/absenceStore';
import useReportStore from '../../stores/reportStore';
import { isHoliday, getHolidayName, getMonthHolidays } from '../../lib/holidays';

const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const absenceConfig = {
  cuti: { label: 'Cuti', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400', dot: 'bg-amber-500' },
  sakit: { label: 'Sakit', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400', dot: 'bg-red-500' },
  izin: { label: 'Izin', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400', dot: 'bg-purple-500' },
};

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const startDow = firstDay.getDay();
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export default function PlannerPage() {
  const { absences, fetchAbsences, toggleAbsence } = useAbsenceStore();
  const { fetchMonthlyStats } = useReportStore();

  const today = new Date();
  const todayStr = today.toDateString();

  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const isCurrentMonth = pickerYear === today.getFullYear() && pickerMonth === today.getMonth();

  // Cycle absence type: none → izin → sakit → cuti → none
  const nextType = (current) => {
    if (!current) return 'izin';
    if (current === 'izin') return 'sakit';
    if (current === 'sakit') return 'cuti';
    return null; // remove
  };

  useEffect(() => {
    fetchAbsences(pickerYear, pickerMonth);
  }, [pickerYear, pickerMonth]);

  const monthDays = getMonthDays(pickerYear, pickerMonth);

  const goToPrevMonth = () => {
    if (pickerMonth === 0) { setPickerMonth(11); setPickerYear((y) => y - 1); }
    else { setPickerMonth((m) => m - 1); }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear((y) => y + 1); }
    else { setPickerMonth((m) => m + 1); }
  };

  const handleDateClick = async (d) => {
    if (d > today) return; // can't mark future
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const existing = absences.find((a) => a.date === dateStr);
    const newType = nextType(existing?.type || null);
    await toggleAbsence(d, newType);
    // Refresh dashboard stats after change
    fetchMonthlyStats(pickerYear, pickerMonth);
  };

  const hasAbsence = (d) => {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return absences.find((a) => a.date === dateStr);
  };

  // Count summary
  const countCuti = absences.filter((a) => a.type === 'cuti').length;
  const countSakit = absences.filter((a) => a.type === 'sakit').length;
  const countIzin = absences.filter((a) => a.type === 'izin').length;

  const monthHolidays = getMonthHolidays(pickerYear, pickerMonth);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Planner / Absensi</h1>
        <p className="text-sm text-on-surface-variant mt-1">Tandai hari cuti, sakit, atau izin untuk perhitungan SLA yang akurat.</p>
      </div>

      {/* Legend + Summary */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(absenceConfig).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}: {key === 'cuti' ? countCuti : key === 'sakit' ? countSakit : countIzin}
          </div>
        ))}
        <span className="text-xs text-on-surface-variant ml-auto">
          Klik tanggal berulang kali untuk ganti jenis
        </span>
      </div>

      {/* Calendar */}
      <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-xl p-4 flex flex-col gap-3">
        {/* Month Nav */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-on-surface-variant">Pilih Bulan</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <span className="text-xs font-semibold text-on-surface min-w-[110px] text-center">
              {monthNames[pickerMonth]} {pickerYear}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {dayHeaders.map((dh) => (
            <span key={dh} className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[10px] font-semibold ${dh === 'Min' || dh === 'Sab' ? 'text-red-400' : 'text-on-surface-variant/60'}`}>{dh}</span>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {monthDays.map((d, idx) => {
            if (!d) return <div key={`empty-${idx}`} className="w-8 h-8 md:w-9 md:h-9" />;

            const dateStr = d.toDateString();
            const absence = hasAbsence(d);
            const cfg = absence ? absenceConfig[absence.type] : null;
            const isToday = dateStr === todayStr;
            const isFuture = d > today;
            const dow = d.getDay();
            const isWeekend = dow === 0 || dow === 6;
            const isLibur = isHoliday(d) && !isWeekend; // only highlight non-weekend holidays separately

            let boxClass = '';
            if (cfg) {
              boxClass = `${cfg.bg} ${cfg.text} ${cfg.border}`;
            } else if (isFuture) {
              boxClass = 'border-transparent text-on-surface-variant/20 cursor-not-allowed';
            } else if (isLibur) {
              boxClass = 'border-transparent text-red-500 bg-red-100 font-bold';
            } else if (isWeekend) {
              boxClass = 'border-transparent text-red-300 bg-red-50/30';
            } else if (isToday) {
              boxClass = 'border-primary text-primary bg-primary-container/10';
            } else {
              boxClass = 'border-transparent text-on-surface hover:bg-surface-container-low';
            }

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isFuture}
                onClick={() => handleDateClick(d)}
                title={absence ? `${cfg.label} — klik untuk ganti` : isLibur ? getHolidayName(d) : isWeekend ? 'Akhir pekan' : 'Klik untuk tandai izin'}
                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md border transition-colors text-center text-sm font-semibold leading-none ${boxClass}`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tanggal Merah Bulan Ini */}
      {monthHolidays.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">🔴 Tanggal Merah — {monthNames[pickerMonth]} {pickerYear}</h3>
          <div className="flex flex-wrap gap-2">
            {monthHolidays.map((h) => (
              <span key={h.date} className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs text-red-600 font-semibold">
                {h.day} — {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-xl p-4">
        <h3 className="text-sm font-semibold text-on-surface mb-2">ℹ️ Cara Pakai</h3>
        <ul className="text-xs text-on-surface-variant space-y-1">
          <li>• Klik <strong>sekali</strong> pada tanggal → tandai <span className="text-purple-600 font-semibold">Izin</span></li>
          <li>• Klik <strong>dua kali</strong> → <span className="text-red-600 font-semibold">Sakit</span></li>
          <li>• Klik <strong>tiga kali</strong> → <span className="text-amber-600 font-semibold">Cuti</span></li>
          <li>• Klik <strong>empat kali</strong> → hapus tanda</li>
          <li>• Hari yang ditandai akan <strong>dikurangi</strong> dari jumlah hari kerja di perhitungan SLA</li>
        </ul>
      </div>
    </div>
  );
}
