import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <span className="material-symbols-outlined text-7xl text-on-surface-variant mb-6">error</span>
      <h1 className="text-3xl font-bold text-on-surface mb-2">404 - Halaman Tidak Ditemukan</h1>
      <p className="text-base text-on-surface-variant mb-8">Halaman yang kamu cari tidak tersedia.</p>
      <Link to="/dashboard" className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-surface-tint transition-colors">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
