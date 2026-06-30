import { Link } from 'react-router-dom';

export default function FAB() {
  return (
    <Link
      to="/report/new"
      className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-50"
    >
      <span className="material-symbols-outlined text-3xl">add</span>
    </Link>
  );
}
