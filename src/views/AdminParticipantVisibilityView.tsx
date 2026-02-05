import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowUpRight, LogOut, Eye, EyeOff, Layout } from 'lucide-react';
import {
  PARTICIPANT_VIEW_SECTION_IDS,
  PARTICIPANT_VIEW_SECTION_LABELS,
  type ParticipantViewSectionId,
} from '../types';
import clsx from 'clsx';

export function AdminParticipantVisibilityView() {
  const { participantHiddenSections, setParticipantSectionHidden, getIsAdmin, logout } = useStore();
  const isAdmin = getIsAdmin();

  if (!isAdmin) return null;

  const isHidden = (id: string) => participantHiddenSections.includes(id);

  const toggle = (sectionId: ParticipantViewSectionId) => {
    const hidden = isHidden(sectionId);
    setParticipantSectionHidden(sectionId, !hidden);
  };

  return (
    <div className="min-h-screen bg-paper selection:bg-royal selection:text-white pb-safe">
      <div className="bg-royal text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="bg-white text-royal font-bold font-mono px-2 py-1 text-xs rounded-sm shrink-0">
            ADMIN
          </div>
          <h1 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight truncate">
            Synlighet på deltakerside
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-royal/70 text-sm">
          Velg hva som skal vises på forsiden for deltakere. Du kan skjule elementer når som helst og
          vise dem igjen senere.
        </p>

        <section>
          <h2 className="font-display font-bold text-xl text-royal uppercase flex items-center gap-2 mb-4">
            <Layout size={20} />
            Elementer på deltakersiden
          </h2>
          <ul className="bg-white border border-royal/10 shadow-sm divide-y divide-royal/5">
            {PARTICIPANT_VIEW_SECTION_IDS.map((sectionId) => {
              const hidden = isHidden(sectionId);
              return (
                <li
                  key={sectionId}
                  className={clsx(
                    'flex items-center justify-between gap-4 px-4 py-3',
                    hidden && 'bg-royal/5 opacity-75'
                  )}
                >
                  <span className="text-royal font-medium">
                    {PARTICIPANT_VIEW_SECTION_LABELS[sectionId]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(sectionId)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase border transition-colors',
                      hidden
                        ? 'border-royal/30 text-royal/70 hover:border-royal hover:text-royal hover:bg-royal/10'
                        : 'border-royal/20 text-royal hover:border-royal hover:bg-royal/5'
                    )}
                  >
                    {hidden ? (
                      <>
                        <Eye size={14} />
                        Vis igjen
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Skjul
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-royal/50 text-xs font-mono uppercase">
          Skjulte elementer vises ikke for innloggede deltakere. Endringer lagres med en gang.
        </p>
      </div>
    </div>
  );
}
