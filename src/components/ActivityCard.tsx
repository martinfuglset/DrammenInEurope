import { MapPin, Users, Bus, Check, Tag, Car, ExternalLink } from 'lucide-react';
import type { ActivityOption } from '../types';
import { useStore } from '../store';
import { SignupModal } from './SignupModal';
import { useState } from 'react';
import clsx from 'clsx';

interface ActivityCardProps {
  activity: ActivityOption;
  isChoiceDay: boolean;
}

export function ActivityCard({ activity, isChoiceDay: _isChoiceDay }: ActivityCardProps) {
  const { signups, currentUser, toggleActivitySignup } = useStore();
  const [isModalOpen, setModalOpen] = useState(false);

  // Stats
  const currentSignups = signups.filter(s => s.activityId === activity.id);
  const count = currentSignups.length;
  const isFull = count >= activity.capacityMax;
  const percentage = Math.min((count / activity.capacityMax) * 100, 100);

  // User State
  const isSignedUp = currentUser ? currentSignups.some(s => s.userId === currentUser.id) : false;

  return (
    <>
      <div className={clsx(
        "relative group bg-white border-l-4 p-6 transition-all duration-300",
        isSignedUp ? "border-royal shadow-md bg-royal/5" : "border-royal/20 hover:border-royal/60 hover:bg-white"
      )}>
        
        {/* Status Badge */}
        {isSignedUp && (
          <div className="absolute top-4 right-4 bg-royal text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded-sm shadow-sm">
            <Check size={12} /> Påmeldt
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Main Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-royal/60 uppercase tracking-wider">
              <span className="flex items-center gap-1">{activity.timeStart} - {activity.timeEnd}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {activity.location}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Tag size={12} /> {activity.price?.trim() ? activity.price : 'Ikke angitt'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Car size={12} /> {activity.drivingLength?.trim() ? activity.drivingLength : 'Ikke angitt'}</span>
            </div>

            <h3 className="font-display font-bold text-2xl text-royal uppercase leading-none">
              {activity.title}
            </h3>

            <p className="text-royal/80 text-sm max-w-lg leading-relaxed font-sans">
              {activity.description}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="bg-paper px-2 py-1 text-[10px] font-mono uppercase text-royal/70 border border-royal/10 flex items-center gap-1">
                <Bus size={10} /> {activity.transport}
              </div>
              <div className="bg-paper px-2 py-1 text-[10px] font-mono uppercase text-royal/70 border border-royal/10 flex items-center gap-1">
                <Tag size={10} /> {activity.price?.trim() ? activity.price : '–'}
              </div>
              <div className="bg-paper px-2 py-1 text-[10px] font-mono uppercase text-royal/70 border border-royal/10 flex items-center gap-1">
                <Car size={10} /> {activity.drivingLength?.trim() ? activity.drivingLength : '–'}
              </div>
              {activity.tags?.map(tag => (
                <span key={tag} className="bg-paper px-2 py-1 text-[10px] font-mono uppercase text-royal/70 border border-royal/10">
                  {tag}
                </span>
              ))}
            </div>

            {/* Link to activity - always show row */}
            <div className="mt-3">
              {activity.link?.trim() ? (
                <a
                  href={activity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-mono uppercase text-royal font-semibold hover:text-royal-dark border-b-2 border-royal/40 hover:border-royal pb-0.5"
                >
                  <ExternalLink size={14} /> Les mer / lenke til aktivitet
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-royal/40">
                  <ExternalLink size={12} /> Lenke: Ikke angitt
                </span>
              )}
            </div>
          </div>

          {/* Action Column */}
          <div className="w-full md:w-48 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-royal/10 pt-4 md:pt-0 md:pl-6">
            
            {/* Capacity Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-royal/60 uppercase">
                <span>Plasser</span>
                <span>{count} / {activity.capacityMax}</span>
              </div>
              <div className="h-1.5 w-full bg-royal/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-royal transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase text-royal/60 hover:text-royal py-2 transition-colors group/btn"
              >
                <Users size={14} />
                <span className="border-b border-transparent group-hover/btn:border-royal/40">Se hvem som drar</span>
              </button>

              <button
                onClick={() => toggleActivitySignup(activity.id)}
                disabled={!isSignedUp && isFull}
                className={clsx(
                  "w-full py-3 px-4 font-mono text-xs uppercase tracking-widest transition-all duration-200 shadow-sm",
                  isSignedUp 
                    ? "bg-transparent border-2 border-royal text-royal hover:bg-red-50 hover:border-red-500 hover:text-red-500"
                    : isFull 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent"
                      : "bg-royal text-white border-2 border-royal hover:bg-royal-dark"
                )}
              >
                {isSignedUp ? 'Meld av' : isFull ? 'Fulltegnet' : 'Meld meg på'}
              </button>
            </div>

          </div>
        </div>
      </div>

      <SignupModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        activityId={activity.id}
        activityTitle={activity.title}
      />
    </>
  );
}
