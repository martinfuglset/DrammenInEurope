import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

interface TimelineEvent {
    time: string;
    title: string;
    description?: string;
    location?: string;
    type?: 'food' | 'activity' | 'transport' | 'info';
}

interface DayPlan {
    date: string;
    events: TimelineEvent[];
}

export function TodaysPlansView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  const pageSlug = 'todays-plans';
  const rawContent = infoPages.find(p => p.slug === pageSlug)?.content;
  
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // MOCK DATA DEFAULT
  const defaultPlans: DayPlan[] = [
      {
          date: 'Fredag 20. Juni',
          events: [
              { time: '14:00', title: 'Oppmøte Gardermoen', location: 'Avgangshallen', description: 'Vi møtes ved innsjekkingsautomatene til SAS. Husk pass!', type: 'transport' },
              { time: '16:30', title: 'Flyavgang', location: 'Gate F19', description: 'Flyturen tar ca 3 timer. Det serveres et lett måltid ombord.', type: 'transport' },
              { time: '20:00', title: 'Landing Nice', location: 'Terminal 1', type: 'transport' },
              { time: '21:00', title: 'Buss til Hotellet', location: 'Busstopp 4', description: 'Felles buss for alle. Ca 45 min kjøretur.', type: 'transport' },
              { time: '22:00', title: 'Innsjekk & Velkomst', location: 'Hotel Negresco', description: 'Utdeling av nøkkelkort og velkomstdrink i lobbyen.', type: 'info' },
          ]
      },
      {
          date: 'Lørdag 21. Juni',
          events: [
              { time: '09:00', title: 'Frokost', location: 'Restaurant Le Chantecler', description: 'Stor buffet. Husk å spise godt før en aktiv dag!', type: 'food' },
              { time: '10:30', title: 'Aktivitetsgrupper', location: 'Lobbyen', description: 'Oppmøte for de ulike aktivitetene. Se gruppeoversikt for din gruppe.', type: 'activity' },
              { time: '13:00', title: 'Lunsj på egenhånd', description: 'Utforsk de lokale kafeene.', type: 'food' },
              { time: '19:00', title: 'Felles Middag', location: 'La Petite Maison', description: '3-retters middag. Kleskode: Pent.', type: 'food' }
          ]
      }
  ];

  const [plans, setPlans] = useState<DayPlan[]>(defaultPlans);
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState('');

  useEffect(() => {
      if (rawContent) {
          try {
              const parsed = JSON.parse(rawContent);
              if (Array.isArray(parsed)) {
                  setPlans(parsed);
              }
          } catch (e) {
              console.error("Failed to parse plans", e);
          }
      }
  }, [rawContent]);

  useEffect(() => {
      setEditJson(JSON.stringify(plans, null, 2));
  }, [plans, isEditing]);

  const handleSave = async () => {
      try {
          const parsed = JSON.parse(editJson);
          setPlans(parsed);
          await updateInfoPage(pageSlug, editJson);
          setIsEditing(false);
      } catch (e) {
          alert("Ugyldig JSON format");
      }
  };

  const activeDay = plans[activeDayIndex] || plans[0];

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <SharpStar size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Oversikt</span>
                    </div>
                    <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Dagens Planer
                    </h1>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-royal/10 hover:bg-royal/20 text-royal p-3 rounded-full transition-colors"
                        >
                            {isEditing ? <Save size={20} onClick={handleSave} /> : <Edit2 size={20} />}
                        </button>
                    </div>
                )}
            </div>
        </header>

        {isEditing ? (
            <div className="space-y-4">
                 <div className="bg-royal/5 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-royal text-sm mb-2">Rediger JSON Data</h3>
                    <p className="text-xs text-royal/80">
                        Endre planene ved å redigere JSON-strukturen direkte. Pass på komma og klammer.
                    </p>
                </div>
                <textarea 
                    className="w-full h-[60vh] bg-white border-2 border-royal/20 p-4 focus:border-royal focus:outline-none font-mono text-sm leading-relaxed rounded-lg"
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                />
            </div>
        ) : (
            <>
                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    {plans.map((day, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveDayIndex(idx)}
                            className={clsx(
                                "px-6 py-2 rounded-full font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-all border",
                                activeDayIndex === idx 
                                    ? "bg-royal text-white border-royal" 
                                    : "bg-white text-royal border-royal/10 hover:border-royal/40"
                            )}
                        >
                            {day.date}
                        </button>
                    ))}
                </div>

                {/* Timeline */}
                <div className="relative pl-8 border-l-2 border-royal/10 space-y-12">
                    {activeDay?.events.map((event, idx) => (
                        <div key={idx} className="relative group">
                            {/* Time Bubble */}
                            <div className="absolute -left-[45px] top-0 bg-paper border-2 border-royal/10 text-royal font-mono text-[10px] font-bold py-1 px-2 rounded-md shadow-sm group-hover:border-royal transition-colors">
                                {event.time}
                            </div>
                            
                            {/* Dot on line */}
                            <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-royal border-4 border-paper shadow-sm group-hover:scale-125 transition-transform"></div>

                            {/* Content Card */}
                            <div className="bg-white p-6 rounded-lg border border-royal/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 hover:border-royal/20 relative overflow-hidden">
                                {/* Type indicator strip */}
                                <div className={clsx(
                                    "absolute top-0 left-0 bottom-0 w-1",
                                    event.type === 'food' && "bg-orange-300",
                                    event.type === 'transport' && "bg-blue-300",
                                    event.type === 'activity' && "bg-green-300",
                                    (!event.type || event.type === 'info') && "bg-royal/20"
                                )}></div>

                                <h3 className="font-display font-bold text-xl text-royal mb-1">{event.title}</h3>
                                
                                {event.location && (
                                    <div className="flex items-center gap-1 text-royal/60 mb-3 text-xs font-mono uppercase tracking-wider">
                                        <MapPin size={12} />
                                        {event.location}
                                    </div>
                                )}
                                
                                {event.description && (
                                    <p className="text-royal/80 text-sm leading-relaxed font-sans">
                                        {event.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
}
