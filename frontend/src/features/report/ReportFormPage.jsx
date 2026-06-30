import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useJobdescStore from '../../stores/jobdescStore';
import useReportStore from '../../stores/reportStore';
import { uploadToCloudinary } from '../../lib/cloudinary';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const day = today.getDay();
  // Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  // Apply week offset
  monday.setDate(monday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Max weeks we can go back (within same month)
function getMaxPastWeeks() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  // First day of current month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let weeks = 0;
  const check = new Date(monday);
  while (check > firstOfMonth) {
    check.setDate(check.getDate() - 7);
    if (check >= firstOfMonth) weeks++;
  }
  return weeks;
}

export default function ReportFormPage() {
  const navigate = useNavigate();
  const { items: jobdescs } = useJobdescStore();
  const submitReport = useReportStore((s) => s.submitReport);
  const addEvidence = useReportStore((s) => s.addEvidence);

  const maxPastWeeks = getMaxPastWeeks();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = getWeekDates(weekOffset);
  const today = new Date();
  const todayStr = today.toDateString();

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
      const reportData = {
        category,
        dateWorked: selectedDate.toISOString().split('T')[0],
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
                  onClick={() => setWeekOffset((w) => Math.max(w - 1, -maxPastWeeks))}
                  disabled={weekOffset <= -maxPastWeeks}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
                  disabled={weekOffset >= 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-2 md:grid md:grid-cols-7 pb-2">
              {weekDates.map((d) => {
                const dateStr = d.toDateString();
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate.toDateString();
                const isPast = d > today;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(d)}
                    className={`snap-center shrink-0 w-[60px] md:w-auto flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : isPast
                        ? 'border-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'
                        : 'border-surface-variant text-on-surface cursor-pointer hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`text-sm ${isSelected ? 'opacity-90' : 'text-on-surface-variant'}`}>
                      {days[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                    </span>
                    <span className="text-lg font-semibold mt-1">{d.getDate()}</span>
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
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="jobdesc-select">Specific Task / Jobdesc</label>
                <div className="relative">
                  <select
                    id="jobdesc-select" value={jobdescId} onChange={(e) => setJobdescId(e.target.value)}
                    className="w-full appearance-none bg-background border border-outline-variant text-on-surface text-base rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  >
                    <option value="">Select specific task...</option>
                    {jobdescs.map((j) => (
                      <option key={j.id} value={j.id}>{j.text}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
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
