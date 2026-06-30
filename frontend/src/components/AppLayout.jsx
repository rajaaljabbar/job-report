import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FAB from './FAB';

const pagesWithFAB = ['/dashboard', '/history'];

export default function AppLayout() {
  const location = useLocation();
  const showFAB = pagesWithFAB.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar />
      <main className="md:ml-[260px] pb-24 md:pb-8 min-h-screen">
        <Outlet />
      </main>
      {showFAB && <FAB />}
      <BottomNav />
    </div>
  );
}
