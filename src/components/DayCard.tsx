import { useState } from 'react';
import type { TripDay } from '../types';
import { useStore } from '../store';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { ActivityCard } from './ActivityCard';

export function DayCard({ day }: { day: TripDay }) {
  const [isOpen, setIsOpen] = useState(false);
  const { activities } = useStore();

  return (
    <div className="bg-paper border-2 border-royal/10 hover:border-royal/30 transition-colors shadow-sm overflow-hidden">
      
      {/* Header / Accordion Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-stretch text-left group"
      >
        {/* Date Box */}
        <div className="bg-royal/5 w-20 sm:w-24 md:w-32 flex flex-col items-center justify-center border-r border-royal/10 group-hover:bg-royal/10 transition-colors p-3 sm:p-4 shrink-0">
          <span className="font-display font-bold text-3xl text-royal">
            {new Date(day.date).getDate()}
          </span>
          <span className="type-label text-royal/60">
            {new Date(day.date).toLocaleDateString('no-NO', { month: 'short' })}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center min-w-0">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-royal uppercase tracking-tight group-hover:text-royal-light transition-colors wrap-break-word">
              {day.title}
            </h2>
            <div className="text-royal/40 group-hover:text-royal transition-colors">
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </div>
          </div>
          <p className="text-sm text-royal/60 text-readable mt-1 max-w-xl">
            {day.description}
          </p>
        </div>
      </button>

      {/* Content Area */}
        <div className={clsx(
        "transition-[max-height] duration-500 ease-in-out overflow-hidden bg-white/50",
        isOpen ? "max-h-[2000px]" : "max-h-0"
      )}>
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          
          {/* Regular Schedule (Timeline) */}
          <div className="space-y-0 relative border-l-2 border-royal/10 ml-2 sm:ml-3 md:ml-4 pl-6 sm:pl-8 md:pl-10 py-2">
            {day.scheduleItems.map((item, idx) => (
              <div key={idx} className="relative pb-8 last:pb-0">
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-paper border-2 border-royal z-10"></div>
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
                  <span className="text-sm font-bold text-royal text-readable w-16 shrink-0">{item.time}</span>
                  <div className="flex-1">
                    <span className="font-medium text-royal text-lg block md:inline">{item.activity}</span>
                    {item.location && (
                      <span className="flex items-center gap-1 text-royal/50 type-label mt-1 md:mt-0 md:ml-4">
                        <MapPin size={10} /> {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Choice Section */}
          {day.isChoiceDay && (
            <div className="mt-8 pt-8">
              <div className="mb-6 flex items-center gap-3">
                 <div className="h-px bg-royal/20 flex-1"></div>
                 <span className="type-label text-royal bg-royal/10 px-3 py-1 rounded-full">
                   Velg din aktivitet
                 </span>
                 <div className="h-px bg-royal/20 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {activities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} isChoiceDay={true} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
