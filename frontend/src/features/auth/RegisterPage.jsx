import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/profile/setup');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-sm border border-surface-variant p-6 md:p-8 flex flex-col gap-6 relative">
        {/* Back Button */}
        <Link to="/login" className="absolute top-6 left-6 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        {/* Header */}
        <div className="text-center mt-6">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Daftar Akun</h1>
          <p className="text-sm text-on-surface-variant">Buat akun DayTrack baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-error-container/30 border border-error/30 text-error text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">error</span>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface" htmlFor="fullName">Nama Lengkap</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline/70 text-xl">person</span>
              <input id="fullName" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface transition-colors placeholder:text-outline/60 outline-none"
                placeholder="Masukkan nama lengkap" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface" htmlFor="email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline/70 text-xl">mail</span>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface transition-colors placeholder:text-outline/60 outline-none"
                placeholder="Masukkan email" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface" htmlFor="password">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline/70 text-xl">lock</span>
              <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-10 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface transition-colors placeholder:text-outline/60 outline-none"
                placeholder="Buat password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline/70 hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface" htmlFor="confirmPassword">Konfirmasi Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline/70 text-xl">lock</span>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-12 pl-10 pr-4 rounded-lg border bg-surface-container-lowest focus:ring-1 focus:ring-primary text-sm text-on-surface transition-colors placeholder:text-outline/60 outline-none ${confirmPassword && password !== confirmPassword ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                placeholder="Ulangi password" />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-error">Password tidak cocok</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="mt-4 w-full h-12 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:bg-primary hover:text-on-primary transition-colors active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50">
            {loading ? 'Loading...' : 'Daftar'}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-surface-variant" />
          <span className="text-xs font-semibold text-outline">atau</span>
          <div className="flex-1 h-px bg-surface-variant" />
        </div>

        <button className="w-full h-12 rounded-lg border border-surface-variant bg-surface-container-lowest hover:bg-surface-container transition-colors flex justify-center items-center gap-3 active:scale-[0.98]">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.86 16.79 15.69 17.57V20.34H19.26C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/><path d="M12 23C14.97 23 17.46 22.02 19.26 20.34L15.69 17.57C14.71 18.23 13.46 18.63 12 18.63C9.18 18.63 6.78 16.72 5.91 14.18H2.23V17.03C4.03 20.61 7.7 23 12 23Z" fill="#34A853"/><path d="M5.91 14.18C5.69 13.52 5.56 12.78 5.56 12C5.56 11.22 5.69 10.48 5.91 9.82V6.97H2.23C1.49 8.44 1.06 10.16 1.06 12C1.06 13.84 1.49 15.56 2.23 17.03L5.91 14.18Z" fill="#FBBC05"/><path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.34 3.89C17.45 2.13 14.97 1.06 12 1.06C7.7 1.06 4.03 3.39 2.23 6.97L5.91 9.82C6.78 7.28 9.18 5.38 12 5.38Z" fill="#EA4335"/></svg>
          <span className="text-sm font-medium text-on-surface">Lanjutkan dgn Gmail</span>
        </button>

        <p className="text-center text-sm text-on-surface-variant">
          Sudah punya akun? <Link to="/login" className="text-primary hover:underline font-semibold ml-1">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
