import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useJobdescStore from '../../stores/jobdescStore';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function ProfileSetupPage() {
  const { user, updateProfile } = useAuthStore();
  const { items, fetchJobdescs, addJobdesc, updateJobdesc, deleteJobdesc } = useJobdescStore();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchJobdescs();
  }, []);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [position, setPosition] = useState(user?.position || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newJobdesc, setNewJobdesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setAvatar(result.url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Gagal upload foto.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username wajib diisi.');
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username.trim())) {
      setUsernameError('Username hanya boleh huruf kecil, angka, dan underscore (3-30 karakter).');
      return;
    }
    setUsernameError('');

    try {
      await updateProfile({ name, username: username.trim().toLowerCase(), position, avatar });
      // Hard redirect to force fresh auth check
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Save profile failed:', err);
      alert('Gagal menyimpan profil: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddJobdesc = () => {
    if (newJobdesc.trim()) {
      addJobdesc(newJobdesc.trim());
      setNewJobdesc('');
    }
  };

  const handleEditJobdesc = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      updateJobdesc(editingId, editText.trim());
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCopyLink = async () => {
    const guestUsername = user?.username || user?.email?.split('@')[0] || 'username';
    const link = `${window.location.origin}/guest/${guestUsername}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = ['bg-secondary-container', 'bg-tertiary-container', 'bg-primary-container'];
  const isFirstSetup = location.pathname === '/profile/setup';

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 md:pt-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Profile &amp; Jobdesc Setup</h1>
        <p className="text-base text-on-surface-variant mt-2">Manage your personal information and daily responsibilities.</p>
      </div>

      {/* Section 1: Data Diri */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-variant bg-surface-bright/50">
          <h2 className="text-lg font-semibold text-on-surface">Data Diri</h2>
          <p className="text-sm text-on-surface-variant mt-1">Update your photo and basic details.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-3 min-w-[120px]">
            <div
              onClick={handleAvatarClick}
              className="relative group cursor-pointer"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-surface-container-lowest shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center border-4 border-surface-container-lowest shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-on-surface/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-on-surface/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="material-symbols-outlined text-on-primary">photo_camera</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={handleAvatarClick}
              className="text-xs font-semibold text-primary hover:text-surface-tint transition-colors"
            >
              {avatarUploading ? 'Uploading...' : avatar ? 'Ganti Foto' : 'Upload Foto'}
            </button>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="fullName">Full Name</label>
              <input id="fullName" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="username">Username <span className="text-on-surface-variant/50 font-normal">(untuk link guest view)</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">alternate_email</span>
                <input id="username" type="text" value={username} onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                  className={`w-full h-12 pl-10 pr-4 rounded-lg border bg-surface-container-lowest text-base text-on-surface focus:ring-1 focus:ring-primary outline-none transition-shadow ${usernameError ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                  placeholder="username_kamu" />
              </div>
              {usernameError && <p className="text-xs text-error">{usernameError}</p>}
              {!usernameError && username && (
                <p className="text-xs text-on-surface-variant">Guest link: {window.location.origin}/guest/<strong>{username.trim().toLowerCase() || '...'}</strong></p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="position">Position</label>
              <input id="position" type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Daftar Jobdesc Utama */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-variant bg-surface-bright/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Daftar Jobdesc Utama</h2>
            <p className="text-sm text-on-surface-variant mt-1">Define your core responsibilities for reporting.</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-surface-variant bg-surface hover:bg-surface-container-low transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-2 h-8 rounded-full ${colors[idx % colors.length]}`} />
                {editingId === item.id ? (
                  <input
                    value={editText} onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="flex-1 text-base text-on-surface bg-transparent border-b border-primary outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="text-base text-on-surface">{item.text}</span>
                )}
              </div>
              <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditJobdesc(item.id, item.text)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full transition-colors" title="Edit">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button onClick={() => deleteJobdesc(item.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors" title="Delete">
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}

          {/* Add Jobdesc */}
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newJobdesc} onChange={(e) => setNewJobdesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddJobdesc()}
              placeholder="Ketik jobdesc baru..."
              className="flex-1 h-12 px-4 rounded-lg border-2 border-dashed border-outline-variant bg-transparent text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-outline/60"
            />
            <button onClick={handleAddJobdesc}
              className="h-12 px-4 rounded-lg bg-primary-container/10 text-primary border-2 border-dashed border-primary/30 hover:bg-primary-container/20 hover:border-primary transition-all flex items-center gap-1 text-xs font-semibold whitespace-nowrap">
              <span className="material-symbols-outlined text-lg">add</span>
              Tambah
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Share Link (Guest View) */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-variant bg-surface-bright/50">
          <h2 className="text-lg font-semibold text-on-surface">Bagikan ke Atasan</h2>
          <p className="text-sm text-on-surface-variant mt-1">Atasan bisa melihat dashboard &amp; history kamu tanpa login.</p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-primary/30 bg-primary-container/5">
            <span className="material-symbols-outlined text-primary text-2xl">share</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface-variant mb-1">Link Guest View</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-primary bg-surface-container px-3 py-2 rounded-lg truncate select-all">
                  {window.location.origin}/guest/{user?.username || user?.email?.split('@')[0] || 'username'}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-surface-tint transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">Bagikan link ini ke atasan agar bisa melihat laporanmu (read-only).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <div className="flex flex-col gap-4 mt-4 pb-8">
        <button onClick={handleSave}
          className="w-full h-12 bg-primary hover:bg-surface-tint text-on-primary text-xs font-bold rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
          {isFirstSetup ? 'Simpan & Lanjutkan' : 'Simpan'}
        </button>
        <button
          onClick={() => { useAuthStore.getState().logout(); navigate('/login'); }}
          className="w-full h-12 border border-error text-error hover:bg-error-container/10 text-xs font-bold rounded-lg transition-colors active:scale-[0.98] uppercase tracking-wider">
          Logout
        </button>
      </div>
    </div>
  );
}
