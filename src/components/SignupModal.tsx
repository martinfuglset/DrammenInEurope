import { X, Users } from 'lucide-react';
import type { User } from '../types';
import { useStore, selectIsAdmin } from '../store';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
}

export function SignupModal({ isOpen, onClose, activityId, activityTitle }: SignupModalProps) {
  const isAdmin = useStore(selectIsAdmin);
  const { signups, users } = useStore();

  const signedUpUsers = signups
    .filter(s => s.activityId === activityId)
    .map(s => users.find(u => u.id === s.userId))
    .filter((u): u is User => !!u)
    .sort((a, b) => (a.displayName || a.fullName).localeCompare(b.displayName || b.fullName));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Panel */}
      <div className="relative bg-paper w-full max-w-md shadow-2xl border-2 border-royal overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-royal text-white p-4 flex justify-between items-center">
          <h3 className="font-display font-bold uppercase tracking-wide pr-8">
            {activityTitle}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 text-royal/60 type-label pb-2">
            <Users size={14} />
            <span>{signedUpUsers.length} Påmeldt</span>
          </div>

          {signedUpUsers.length === 0 ? (
            <p className="text-center text-royal/40 italic py-8">Ingen påmeldte enda.</p>
          ) : (
            <ul className="space-y-3">
              {signedUpUsers.map(user => (
                <li key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-royal/10 text-royal flex items-center justify-center font-sans font-bold text-xs border border-royal/20">
                    {(user.displayName || user.fullName).charAt(0)}
                  </div>
                  <span className="font-medium text-royal font-sans">
                    {/* Admin sees full name, Participant sees Display Name */}
                    {isAdmin ? user.fullName : user.displayName}
                  </span>
                  {user.role === 'admin' && (
                    <span className="ml-auto text-[10px] bg-royal text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-royal/5 text-center">
          <button 
            onClick={onClose}
            className="text-royal/60 type-label hover:text-royal"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
