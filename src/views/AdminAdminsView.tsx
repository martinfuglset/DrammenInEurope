import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowUpRight, LogOut, Shield, ShieldPlus, UserPlus } from 'lucide-react';

const INITIAL_ADMIN_NAMES = [
  'Elena Othilie Solberg',
  'Joachim Østgård',
  'Rebekka Auke',
  'Hannah Elisabeth Solberg',
  'Andreas Espegard'
];

const normalizeFullName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

function isInitialAdmin(fullName: string) {
  const n = normalizeFullName(fullName);
  return INITIAL_ADMIN_NAMES.some((name) => normalizeFullName(name) === n);
}

export function AdminAdminsView() {
  const { users, adminUserIds, addAdminUser, removeAdminUser, getIsAdmin, logout } = useStore();
  const isAdmin = getIsAdmin();

  if (!isAdmin) return null;

  const adminUsers = users.filter(
    (u) => adminUserIds.includes(u.id) || isInitialAdmin(u.fullName)
  );
  const canRemoveAdminIds = adminUserIds; // Only DB-added admins can be removed
  const participantsNotAdmin = users.filter(
    (u) => !adminUserIds.includes(u.id) && !isInitialAdmin(u.fullName)
  );

  return (
    <div className="min-h-screen bg-paper selection:bg-royal selection:text-white pb-safe">
      <div className="bg-royal text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="bg-white text-royal font-bold font-mono px-2 py-1 text-xs rounded-sm shrink-0">
            ADMIN
          </div>
          <h1 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight truncate">
            Administrer admins
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/admin"
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <ArrowUpRight size={16} /> Tilbake til dashboard
          </Link>
          <Link
            to="/"
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <ArrowUpRight size={16} /> Til Appen
          </Link>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <LogOut size={16} /> Logg ut
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <p className="text-royal/70 text-sm">
          Kun deltakere fra deltakerlisten kan gis admin-tilgang. De som har tilgang kan logge inn
          som vanlig og se «Gå til admin» ved navnet sitt.
        </p>

        <section>
          <h2 className="font-display font-bold text-xl text-royal uppercase flex items-center gap-2 mb-4">
            <Shield size={20} />
            Admins med tilgang
          </h2>
          <ul className="bg-white border border-royal/10 shadow-sm divide-y divide-royal/5">
            {adminUsers.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-royal"
              >
                <span className="participant-name font-medium">{u.fullName}</span>
                {canRemoveAdminIds.includes(u.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Fjerne admin-tilgang for ${u.fullName}?`)) {
                        removeAdminUser(u.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-mono uppercase"
                  >
                    Fjern admin
                  </button>
                ) : (
                  <span className="text-royal/40 text-xs font-mono uppercase">
                    Fast tilgang (kan ikke fjernes)
                  </span>
                )}
              </li>
            ))}
            {adminUsers.length === 0 && (
              <li className="px-4 py-6 text-center text-royal/50 italic">
                Ingen admins ennå.
              </li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl text-royal uppercase flex items-center gap-2 mb-4">
            <UserPlus size={20} />
            Legg til admin fra deltakerlisten
          </h2>
          <p className="text-royal/60 text-sm mb-4">
            Velg en deltaker nedenfor for å gi admin-tilgang. Kun personer som finnes i
            deltakerlisten kan legges til.
          </p>
          <ul className="bg-white border border-royal/10 shadow-sm divide-y divide-royal/5">
            {participantsNotAdmin.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-royal"
              >
                <span className="participant-name font-medium">{u.fullName}</span>
                <button
                  type="button"
                  onClick={() => addAdminUser(u.id)}
                  className="flex items-center gap-1 text-royal font-mono text-xs uppercase hover:underline"
                >
                  <ShieldPlus size={14} /> Legg til som admin
                </button>
              </li>
            ))}
            {participantsNotAdmin.length === 0 && (
              <li className="px-4 py-6 text-center text-royal/50 italic">
                Alle deltakere har allerede admin-tilgang, eller deltakerlisten er tom.
              </li>
            )}
          </ul>
        </section>

        <div className="pt-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-royal font-mono text-xs uppercase hover:underline"
          >
            <ArrowUpRight size={14} /> Tilbake til Tur Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
