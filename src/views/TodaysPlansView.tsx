import { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import clsx from 'clsx';
import { ActivityCard } from '../components/ActivityCard';

export function TodaysPlansView() {
  const isAdmin = useStore(selectIsAdmin);
  const { days, activities } = useStore();
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const activeDay = days[activeDayIndex] || days[0];

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-8 sm:mb-12">
            <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="type-label">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <span className="type-label-wide">Oversikt</span>
                    </div>
                    <h1 className="type-display-1 text-royal">
                        Dagens Planer
                    </h1>
                </div>
                {isAdmin && (
                    <span className="type-label-wide text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
                )}
            </div>
        </header>

        {days.length === 0 ? (
            <div className="text-royal/50 type-label py-12">Ingen dager funnet. Legg til program i admin.</div>
        ) : (
            <>
                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    {days.map((day, idx) => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDayIndex(idx)}
                            className={clsx(
                                "px-6 py-2.5 rounded-full type-label whitespace-nowrap transition-all duration-300 border-2",
                                activeDayIndex === idx 
                                    ? "bg-royal text-white border-royal shadow-lg shadow-royal/25 -translate-y-0.5" 
                                    : "bg-white/80 text-royal border-royal/15 hover:border-royal/40 hover:bg-white hover:shadow-md"
                            )}
                        >
                            {day.title}
                        </button>
                    ))}
                </div>

                {/* Day description */}
                {activeDay?.description && (
                    <p className="text-sm text-royal/60 text-readable mb-8 border-l-2 border-royal/20 py-2 pl-4 bg-white/40 rounded-r-lg">
                        {activeDay.description}
                    </p>
                )}

                {/* Timeline */}
                <div className="relative pl-20 sm:pl-24 ml-24 sm:ml-28 space-y-10">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-royal/30"></div>
                    {activeDay?.scheduleItems.map((item, idx) => (
                        <div key={idx} className="relative group" style={{ animationDelay: `${idx * 0.05}s` }}>
                            {/* Time bubble */}
                            <div className="absolute -left-[5.5rem] sm:-left-[6rem] top-0 min-w-[4rem] bg-white border-2 border-royal/20 text-royal type-label-wide font-bold py-1.5 px-2 rounded-lg group-hover:border-royal transition-all duration-300 text-center">
                                {item.time}
                            </div>
                            
                            {/* Dot – ring + core */}
                            <div className="absolute -left-[9px] top-2.5 w-4 h-4 rounded-full bg-royal border-4 border-paper group-hover:scale-125 transition-all duration-300 z-10 ring-2 ring-royal/20 group-hover:ring-royal/40"></div>

                            <div className={clsx(
                                "p-6 border-2 relative overflow-hidden ml-2 rounded-lg transition-all duration-300 animate-fade-in-up",
                                "hover:-translate-y-1 hover:border-royal/30",
                                idx % 2 === 0 
                                    ? "bg-white border-royal/10" 
                                    : "bg-white border-royal/10"
                            )}>
                                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-royal/20 rounded-r"></div>
                                <h3 className="font-display font-bold text-xl text-royal mb-1 pl-4">{item.activity}</h3>
                                {item.location && (
                                    <div className="flex items-center gap-1.5 text-royal/60 mb-2 type-label pl-4">
                                        <MapPin size={12} className="text-royal/40" />
                                        {item.location}
                                    </div>
                                )}
                                {item.notes && (
                                    <p className="text-royal/80 text-sm text-readable pl-4">
                                        {item.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Choice Day – activity options, same as overview */}
                    {activeDay?.isChoiceDay && (
                        <div className="mt-12 pt-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="h-px bg-royal/20 flex-1"></div>
                                <span className="type-label text-royal bg-royal/10 px-3 py-1 rounded-full">
                                    Velg din aktivitet
                                </span>
                                <div className="h-px bg-royal/20 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 ml-2">
                                {activities.map((activity) => (
                                    <ActivityCard key={activity.id} activity={activity} isChoiceDay={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
}
