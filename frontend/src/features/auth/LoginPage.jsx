import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await useAuthStore.getState().loginWithGoogle();
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <span className="material-symbols-outlined text-4xl">clinical_notes</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">IT Support Tracker</h1>
          <p className="text-base text-on-surface-variant mt-1">Catat. Laporkan. Selesai.</p>
        </div>

        {/* Form */}
        <div className="px-6 pb-10">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                <input
                  id="email" type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-surface-variant rounded-lg text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors placeholder:text-on-surface-variant/50"
                  placeholder="teknisi@it-support.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">lock</span>
                <input
                  id="password" required
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-surface-variant rounded-lg text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors placeholder:text-on-surface-variant/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 bg-primary text-on-primary text-sm font-bold rounded-lg hover:bg-surface-tint focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? 'Loading...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-variant" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-container-lowest text-sm text-on-surface-variant">atau</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="mt-6 w-full h-12 flex items-center justify-center gap-2 bg-surface text-on-surface text-sm border border-surface-variant rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
