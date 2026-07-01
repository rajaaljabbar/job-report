/**
 * Kalender Hari Libur Indonesia (SKB 3 Menteri)
 * Format: 'YYYY-MM-DD' — hanya hari libur nasional & cuti bersama
 * Sumber: https://publicholidays.co.id
 */

// Semua tanggal libur (tanggal merah + cuti bersama) — Map<dateString, name>
const HOLIDAYS = new Map([
  // === 2025 ===
  ['2025-01-01', 'Tahun Baru Masehi'],
  ['2025-01-27', 'Isra Mi\'raj'],
  ['2025-01-28', 'Cuti Bersama Imlek'],
  ['2025-01-29', 'Tahun Baru Imlek'],
  ['2025-03-28', 'Cuti Bersama Nyepi'],
  ['2025-03-29', 'Nyepi (Saka 1947)'],
  ['2025-03-31', 'Idul Fitri 1446 H (1)'],
  ['2025-04-01', 'Idul Fitri 1446 H (2)'],
  ['2025-04-02', 'Cuti Bersama Idul Fitri'],
  ['2025-04-03', 'Cuti Bersama Idul Fitri'],
  ['2025-04-04', 'Cuti Bersama Idul Fitri'],
  ['2025-04-07', 'Cuti Bersama Idul Fitri'],
  ['2025-04-18', 'Wafat Isa Almasih'],
  ['2025-05-01', 'Hari Buruh Internasional'],
  ['2025-05-12', 'Waisak 2569 BE'],
  ['2025-05-13', 'Cuti Bersama Waisak'],
  ['2025-05-29', 'Kenaikan Isa Almasih'],
  ['2025-05-30', 'Cuti Bersama Kenaikan Isa Almasih'],
  ['2025-06-01', 'Hari Lahir Pancasila'],
  ['2025-06-06', 'Idul Adha 1446 H'],
  ['2025-06-09', 'Cuti Bersama Idul Adha'],
  ['2025-06-27', 'Tahun Baru Islam 1447 H'],
  ['2025-08-17', 'Hari Kemerdekaan RI'],
  ['2025-09-05', 'Maulid Nabi Muhammad SAW'],
  ['2025-12-25', 'Natal'],
  ['2025-12-26', 'Cuti Bersama Natal'],

  // === 2026 ===
  ['2026-01-01', 'Tahun Baru Masehi'],
  ['2026-01-16', 'Isra Mi\'raj'],
  ['2026-02-17', 'Tahun Baru Imlek 2577'],
  ['2026-03-19', 'Nyepi (Saka 1948)'],
  ['2026-03-20', 'Idul Fitri 1447 H (1)'],
  ['2026-03-21', 'Idul Fitri 1447 H (2)'],
  ['2026-03-23', 'Cuti Bersama Idul Fitri'],
  ['2026-03-24', 'Cuti Bersama Idul Fitri'],
  ['2026-04-03', 'Wafat Isa Almasih'],
  ['2026-05-01', 'Hari Buruh Internasional'],
  ['2026-05-12', 'Waisak 2570 BE'],
  ['2026-05-14', 'Kenaikan Isa Almasih'],
  ['2026-05-27', 'Idul Adha 1447 H'],
  ['2026-06-01', 'Hari Lahir Pancasila'],
  ['2026-06-16', 'Tahun Baru Islam 1448 H'],
  ['2026-08-17', 'Hari Kemerdekaan RI'],
  ['2026-08-25', 'Maulid Nabi Muhammad SAW'],
  ['2026-12-25', 'Natal'],

  // === 2027 ===
  ['2027-01-01', 'Tahun Baru Masehi'],
  ['2027-02-06', 'Tahun Baru Imlek 2578'],
  ['2027-03-09', 'Idul Fitri 1448 H (1)'],
  ['2027-03-10', 'Idul Fitri 1448 H (2)'],
  ['2027-03-26', 'Wafat Isa Almasih'],
  ['2027-04-08', 'Nyepi'],
  ['2027-05-01', 'Hari Buruh Internasional'],
  ['2027-05-06', 'Kenaikan Isa Almasih'],
  ['2027-05-17', 'Idul Adha 1448 H'],
  ['2027-06-01', 'Hari Lahir Pancasila'],
  ['2027-06-06', 'Tahun Baru Islam 1449 H'],
  ['2027-08-14', 'Maulid Nabi Muhammad SAW'],
  ['2027-08-17', 'Hari Kemerdekaan RI'],
  ['2027-12-25', 'Natal'],
]);

/**
 * Cek apakah tanggal tertentu adalah hari libur (tanggal merah / cuti bersama)
 */
export function isHoliday(date) {
  const key = toDateString(date);
  return HOLIDAYS.has(key);
}

export function getHolidayName(date) {
  const key = toDateString(date);
  return HOLIDAYS.get(key) || null;
}

/**
 * Dapatkan semua libur dalam satu bulan
 * @returns Array<{ date: string, day: number, name: string }>
 */
export function getMonthHolidays(year, month) {
  const result = [];
  const lastDay = new Date(year, month + 1, 0);
  const cursor = new Date(year, month, 1);
  while (cursor <= lastDay) {
    const key = toDateString(cursor);
    if (HOLIDAYS.has(key)) {
      result.push({ date: key, day: cursor.getDate(), name: HOLIDAYS.get(key) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/**
 * Cek apakah tanggal adalah hari kerja (Senin-Jumat, bukan libur)
 */
export function isWorkingDay(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  // 0 = Minggu, 6 = Sabtu
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  if (isHoliday(d)) return false;
  return true;
}

/**
 * Hitung jumlah hari kerja dalam satu bulan (Sen-Jum, bukan libur nasional/cuti bersama)
 * @param {number} year
 * @param {number} month - 0-indexed (0 = Jan)
 * @param {Date|null} capDate - batas akhir perhitungan (default: akhir bulan)
 */
export function countWorkingDays(year, month, capDate = null) {
  const lastDay = capDate || new Date(year, month + 1, 0);
  let count = 0;
  const cursor = new Date(year, month, 1);
  while (cursor <= lastDay) {
    if (isWorkingDay(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Format tanggal ke string 'YYYY-MM-DD'
 */
export function toDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
