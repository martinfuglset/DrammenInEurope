import { useStore } from '../store';
import { DayCard } from '../components/DayCard';
import { SharpStar } from '../components/Star';
import { UserCircle } from 'lucide-react';

export function ParticipantView() {
  const { days, currentUser } = useStore();

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
       {/* Background Ambience */}
       <SharpStar className="absolute top-32 left-1/4 text-royal w-4 h-4 animate-pulse opacity-60" />
       <SharpStar className="absolute top-10 right-1/3 text-royal w-6 h-6 opacity-80" />
       <SharpStar className="absolute bottom-20 left-10 text-royal w-12 h-12 opacity-10" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-royal/10 pb-8">
          <div>
            <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                <SharpStar size={12} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Programoversikt</span>
            </div>
            <h1 className="font-display font-extrabold text-5xl md:text-7xl text-royal uppercase leading-none tracking-tight">
              Drammen<br/>In Europe
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
               <span className="font-sans font-bold text-royal text-lg">Hei, {currentUser?.displayName}</span>
               <UserCircle className="text-royal/80" />
            </div>
            <p className="font-mono text-xs text-royal/50 uppercase tracking-widest text-right max-w-[200px]">
              Du er logget inn som deltaker.
            </p>
          </div>
        </header>

        {/* Day Cards */}
        <div className="space-y-6">
          {days.map(day => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>

      </div>
    </div>
  );
}
