import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/history', icon: 'history', label: 'Timeline' },
  { path: '/profile/edit', icon: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] hidden md:flex flex-col bg-surface border-r border-surface-variant z-40">
      <div className="flex flex-col h-full py-6">
        {/* Brand */}
        <div className="px-6 mb-8">
          <h1 className="text-lg font-bold text-primary">DayTrack</h1>
          <p className="text-xs text-on-surface-variant mt-1">Work Logger</p>
        </div>

        {/* New Log Button */}
        <div className="px-4 mb-6">
          <Link
            to="/report/new"
            className="w-full h-12 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors"
          >
            <span className="material-symbols-outlined filled text-lg">add</span>
            New Log
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-r-lg transition-all ${
                  isActive
                    ? 'text-primary border-l-4 border-primary bg-primary-container/10'
                    : 'text-on-surface-variant border-l-4 border-transparent hover:bg-surface-container-high hover:border-surface-variant'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-2 flex flex-col gap-1 pt-4 border-t border-surface-variant">
          <Link
            to="/profile/edit"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all rounded-r-lg"
          >
            <span className="material-symbols-outlined">help</span>
            Help
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-error hover:bg-error-container/20 transition-all rounded-r-lg w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
