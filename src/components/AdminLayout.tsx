import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store';

export function AdminLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/';

  return (
    <div className="min-h-screen bg-paper selection:bg-royal selection:text-white pb-safe">
      <div className="bg-royal text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-50 shadow-md" data-keep-royal>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="bg-white text-royal font-bold font-mono px-2 py-1 text-xs rounded-sm shrink-0">
            ADMIN
          </div>
          <h1 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight truncate">
            {isDashboard ? (
              'Tur Dashboard'
            ) : (
              <Link to="/admin" className="text-white/90 hover:text-white">
                Tur Dashboard
              </Link>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/"
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <ArrowUpRight size={16} /> Til Appen
          </Link>
          <button
            onClick={() => {
              useStore.getState().logout();
              window.location.href = '/';
            }}
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <LogOut size={16} /> Logg ut
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
