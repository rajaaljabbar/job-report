import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useJobdescStore from '../../stores/jobdescStore';
import useReportStore from '../../stores/reportStore';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { isHoliday } from '../../lib/holidays';

const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  // Add empty slots for days before the 1st
  const startDow = firstDay.getDay(); // 0=Sun
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }

  // Add all days in month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export default function ReportFormPage() {
  const navigate = useNavigate();
  const { items: jobdescs, fetchJobdescs } = useJobdescStore();
  const submitReport = useReportStore((s) => s.submitReport);
  const addEvidence = useReportStore((s) => s.addEvidence);

  // Fetch jobdescs on mount so the dropdown is always populated
  useEffect(() => {
    fetchJobdescs();
  }, []);

  const today = new Date();
  const todayStr = today.toDateString();

  // Month navigation for date picker (up to 6 months back)
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const isPickerCurrentMonth = pickerYear === today.getFullYear() && pickerMonth === today.getMonth();
  const maxPastMonth = (today.getFullYear() - pickerYear) * 12 + (today.getMonth() - pickerMonth) >= 6;

  const monthDays = getMonthDays(pickerYear, pickerMonth);

  const goToPrevPickerMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const goToNextPickerMonth = () => {
    if (isPickerCurrentMonth) return;
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  const [selectedDate, setSelectedDate] = useState(today);
  const [category, setCategory] = useState('jobdesc');
  const [jobdescId, setJobdescId] = useState('');
  const [isUserRequested, setIsUserRequested] = useState(false);
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    if (evidence.length + files.length > 5) return;
    setEvidence((prev) => [...prev, ...files]);
    files.forEach((f) => {
      setEvidencePreviews((prev) => [...prev, URL.createObjectURL(f)]);
    });
  };

  const handleRemoveFile = (idx) => {
    setEvidence((prev) => prev.filter((_, i) => i !== idx));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const isFormValid = () => {
    if (category === 'jobdesc') return jobdescId && description.trim();
    if (category === 'improvement') return title.trim() && description.trim();
    if (category === 'helpUser') return userName.trim() && description.trim();
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setSubmitting(true);

    try {
      // 1. Upload evidence files to Cloudinary first
      const uploadedEvidence = [];
      for (const file of evidence) {
        const result = await uploadToCloudinary(file);
        uploadedEvidence.push({
          url: result.url,
          publicId: result.publicId,
          fileName: file.name,
          size: result.size,
          mimeType: file.type,
        });
      }

      // 2. Create report in Supabase
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const reportData = {
        category,
        dateWorked: `${y}-${m}-${d}`,
        title:
          category === 'improvement'
            ? title
            : category === 'jobdesc'
            ? jobdescs.find((j) => j.id === jobdescId)?.text || ''
            : `Help: ${userName}`,
        description,
        userName: category === 'helpUser' ? userName : isUserRequested ? userName : '',
        isUserRequested: isUserRequested,
        jobdescId: category === 'jobdesc' ? jobdescId : null,
      };

      const report = await submitReport(reportData);

      // 3. Save evidence records
      for (const ev of uploadedEvidence) {
        await addEvidence(report.id, ev);
      }

      setSubmitting(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
      alert('Gagal menyimpan laporan. Silakan coba lagi.');
    }
  };

  const categories = [
    {
      key: 'jobdesc',
      label: 'Jobdesc Utama',
      desc: 'Routine maintenance and core responsibilities.',
      color: 'primary',
      dot: 'bg-primary',
      icon: 'computer',
    },
    {
      key: 'improvement',
      label: 'Improvement',
      desc: 'System upgrades or process enhancements.',
      color: 'secondary',
      dot: 'bg-secondary',
      icon: 'security',
    },
    {
      key: 'helpUser',
      label: 'Help User',
      desc: 'Direct support and issue resolution.',
      color: 'tertiary',
      dot: 'bg-tertiary-container',
      icon: 'vpn_key',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Step 1: Date & Category */}
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-on-surface">Step 1: Context</h3>

          {/* Date Picker */}
          <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant">Date of Activity</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPrevPickerMonth}
                  disabled={maxPastMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <span className="text-xs font-semibold text-on-surface min-w-[110px] text-center">
                  {monthNames[pickerMonth]} {pickerYear}
                </span>
                <button
                  type="button"
                  onClick={goToNextPickerMonth}
                  disabled={isPickerCurrentMonth}
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
                if (!d) {
                  return <div key={`empty-${idx}`} className="w-8 h-8 md:w-9 md:h-9" />;
                }
                const dateStr = d.toDateString();
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate.toDateString();
                const isFuture = d > today;
                const dow = d.getDay();
                const isWeekend = dow === 0 || dow === 6;
                const isLibur = isHoliday(d) && !isWeekend;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setSelectedDate(d)}
                    className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md border transition-colors text-center ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : isFuture
                        ? 'border-transparent text-on-surface-variant/30 cursor-not-allowed'
                        : isLibur
                        ? 'border-transparent text-red-500 bg-red-50 hover:bg-red-100'
                        : isWeekend
                        ? 'border-transparent text-red-300 bg-red-50/30 hover:bg-red-50'
                        : isToday
                        ? 'border-primary text-primary bg-primary-container/10'
                        : 'border-transparent text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="text-sm font-semibold leading-none">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Cards */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-on-surface-variant block mb-3">Category</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <label
                  key={cat.key}
                  className={`relative rounded-xl p-4 cursor-pointer flex flex-col gap-2 overflow-hidden shadow-sm transition-all hover:shadow-md group ${
                    category === cat.key
                      ? `bg-${cat.color}-container/10 border-2 border-${cat.color}`
                      : 'bg-surface-container-lowest border border-surface-variant hover:border-secondary'
                  }`}
                >
                  <input
                    type="radio" name="category" value={cat.key}
                    checked={category === cat.key}
                    onChange={() => setCategory(cat.key)}
                    className="sr-only"
                  />
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${cat.color}`} />
                  <div className="flex items-center justify-between pl-2">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.dot} inline-block`} />
                      {cat.label}
                    </span>
                    <span className={`material-symbols-outlined text-xl ${category === cat.key ? `text-${cat.color}` : 'text-outline'}`}>
                      {category === cat.key ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant pl-2 mt-1">{cat.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Step 2: Dynamic Details */}
        <section className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-xl p-5 md:p-6 relative flex flex-col gap-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed-dim rounded-t-xl opacity-50" />
          <h3 className="text-lg font-semibold text-on-surface mb-2">Step 2: Activity Details</h3>

          {category === 'jobdesc' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-on-surface-variant">Specific Task / Jobdesc</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between bg-background border border-outline-variant text-on-surface text-base rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow text-left"
                  >
                    <span className={jobdescId ? 'text-on-surface' : 'text-on-surface-variant/50'}>
                      {jobdescId ? jobdescs.find((j) => j.id === jobdescId)?.text || 'Select specific task...' : 'Select specific task...'}
                    </span>
                    <span className={`material-symbols-outlined text-xl text-on-surface-variant transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-lowest border border-surface-variant rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {jobdescs.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-on-surface-variant">Belum ada jobdesc. Tambahkan di halaman Profile.</p>
                      ) : (
                        jobdescs.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => { setJobdescId(j.id); setDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-base hover:bg-surface-container transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              jobdescId === j.id ? 'bg-primary-container/10 text-primary font-semibold' : 'text-on-surface'
                            }`}
                          >
                            {j.text}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-surface-variant">
                <div>
                  <p className="text-xs font-semibold text-on-surface">Berdasarkan permintaan User?</p>
                  <p className="text-sm text-on-surface-variant">Was this activity triggered by a specific ticket?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isUserRequested} onChange={(e) => setIsUserRequested(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner" />
                </label>
              </div>

              {isUserRequested && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="userName">Nama User / Departemen</label>
                  <input
                    id="userName" type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-background text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    placeholder="Nama user atau departemen..."
                  />
                </div>
              )}
            </>
          )}

          {category === 'improvement' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="improvementTitle">Judul Improvement</label>
              <input
                id="improvementTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-background text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Misal: Membuat rule firewall baru di MikroTik"
              />
            </div>
          )}

          {category === 'helpUser' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="helpUserName">
                Nama User / Departemen <span className="text-error">*</span>
              </label>
              <input
                id="helpUserName" type="text" required value={userName} onChange={(e) => setUserName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-background text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Misal: Pak Budi (Finance)"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-semibold text-on-surface-variant" htmlFor="description">Action Description</label>
            <textarea
              id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-outline-variant text-on-surface text-base rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none"
              placeholder="Detail the steps taken, systems affected, and current status..."
            />
          </div>

          {/* Evidence */}
          <div className="mt-4 pt-6 border-t border-surface-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">Evidence (Foto / Log)</h4>
                <p className="text-sm text-on-surface-variant">Attach supporting imagery.</p>
              </div>
              <label className="flex items-center gap-2 bg-surface-container text-primary text-xs font-semibold px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant border-dashed cursor-pointer">
                <span className="material-symbols-outlined text-lg">add_a_photo</span>
                Tambah Foto
                <input type="file" accept="image/*" multiple onChange={handleFileAdd} className="hidden" />
              </label>
            </div>
            {evidencePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {evidencePreviews.map((preview, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-variant shadow-sm group">
                    <img src={preview} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveFile(idx)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Submit */}
        <div className="sticky bottom-0 pb-4 bg-background pt-4">
          <button
            type="submit" disabled={!isFormValid() || submitting}
            className="w-full h-12 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-tint shadow-md transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined">send</span>
            {submitting ? 'Mengirim...' : 'Submit Laporan'}
          </button>
        </div>
      </form>
    </div>
  );
}
