import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Home' },
  { path: '/history', icon: 'schedule', label: 'History' },
  { path: '/profile/edit', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full md:hidden z-50 bg-surface border-t border-surface-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1 active:scale-95 transition-transform duration-150 ${
                isActive
                  ? 'text-primary bg-primary-container/20'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
