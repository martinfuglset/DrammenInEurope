import { useState, useMemo } from 'react';
import { ArrowLeft, Circle, ThumbsUp, ThumbsDown, MessageSquare, UserCircle, Download, CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import clsx from 'clsx';

const RatingInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="mb-6">
        <label className="block type-label text-royal/60 mb-2">{label}</label>
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
                <button
                    key={level}
                    type="button"
                    onClick={() => onChange(level)}
                    className="focus:outline-none transition-transform hover:scale-110"
                >
                    <Circle
                        size={32}
                        className={clsx(
                            "transition-colors",
                            level <= value ? "fill-royal text-royal" : "text-royal/20"
                        )}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    </div>
);

export function FeedbackView() {
  const isAdmin = useStore(selectIsAdmin);
  const { submitFeedback, feedbacks, users, exportAdminData } = useStore();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Determine view mode: Admin Stats only if user is admin AND ?mode=admin is present
  const showAdminView = isAdmin && searchParams.get('mode') === 'admin';

  // Form State
  const [ratings, setRatings] = useState({
      overall: 0,
      hotel: 0,
      activities: 0,
      food: 0
  });
  
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
      // Check if there is ANY content to submit (ratings OR text)
      const hasRatings = Object.values(ratings).some(r => r > 0);
      const hasText = message.trim() || highlights.trim() || improvements.trim();

      if (!hasRatings && !hasText) return;
      
      setIsSubmitting(true);
      await submitFeedback(message, ratings, highlights, improvements);
      setIsSubmitting(false);
      setSubmitted(true);
      
      // Reset
      setRatings({ overall: 0, hotel: 0, activities: 0, food: 0 });
      setHighlights('');
      setImprovements('');
      setMessage('');
  };

  // Calculate Averages Robustly
  const averages = useMemo(() => {
      if (feedbacks.length === 0) {
          return { overall: '-', hotel: '-', activities: '-', food: '-' };
      }

      const calculateAvg = (key: keyof typeof ratings) => {
          // Only count feedbacks that actually have a rating > 0 for this category
          const validFeedbacks = feedbacks.filter(fb => fb.ratings && fb.ratings[key] > 0);
          if (validFeedbacks.length === 0) return '-';
          
          const sum = validFeedbacks.reduce((acc, fb) => acc + (fb.ratings?.[key] || 0), 0);
          return (sum / validFeedbacks.length).toFixed(1);
      };

      return {
          overall: calculateAvg('overall'),
          hotel: calculateAvg('hotel'),
          activities: calculateAvg('activities'),
          food: calculateAvg('food'),
      };
  }, [feedbacks]);

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-8 sm:mb-12">
            <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="type-label">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <span className="type-label-wide">Din mening</span>
                    </div>
                    <h1 className="type-display-1 text-royal">
                        Feedback
                    </h1>
                </div>
                {showAdminView && (
                    <div className="flex items-center gap-4">
                        <span className="type-label-wide text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
                        <button
                            onClick={() => exportAdminData('feedbacks')}
                            className="flex items-center gap-2 text-royal/60 hover:text-royal type-label-wide"
                        >
                            <Download size={12} /> Eksporter feedback
                        </button>
                    </div>
                )}
            </div>
        </header>

        {showAdminView ? (
            // ADMIN VIEW
            <div className="space-y-8">
                {/* STATISTICS SECTION */}
                <div className="bg-white border border-royal/10 p-6 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="type-display-2 text-royal text-xl">Gjennomsnittlig Rating</h2>
                        <span className="type-label text-royal/40">Basert på {feedbacks.length} svar</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-royal/5">
                            <div className="text-[10px] uppercase tracking-widest text-royal/60">Total</div>
                            <div className="font-display text-3xl text-royal font-bold flex justify-center items-center gap-1">
                                {averages.overall}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-royal/5">
                            <div className="text-[10px] uppercase tracking-widest text-royal/60">Hotell</div>
                            <div className="font-display text-3xl text-royal font-bold flex justify-center items-center gap-1">
                                {averages.hotel}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-royal/5">
                            <div className="text-[10px] uppercase tracking-widest text-royal/60">Aktiviteter</div>
                            <div className="font-display text-3xl text-royal font-bold flex justify-center items-center gap-1">
                                {averages.activities}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-royal/5">
                            <div className="text-[10px] uppercase tracking-widest text-royal/60">Mat</div>
                            <div className="font-display text-3xl text-royal font-bold flex justify-center items-center gap-1">
                                {averages.food}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TEXT FEEDBACK SECTION (Re-introduced for qualitative insights) */}
                <div className="bg-white/50 backdrop-blur-sm border border-royal/10 p-6">
                    <h2 className="type-display-2 text-royal text-xl mb-6">Siste Kommentarer</h2>
                    {feedbacks.length === 0 ? (
                        <p className="text-royal/60 italic">Ingen kommentarer mottatt ennå.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {feedbacks.map(fb => {
                                const user = users.find(u => u.id === fb.userId);
                                const hasText = fb.highlights || fb.improvements || fb.message;
                                if (!hasText) return null;

                                return (
                                    <div key={fb.id} className="bg-white p-6 border border-royal/10 shadow-sm relative">
                                        <div className="flex items-center gap-2 mb-4 text-royal/60 type-label pb-2">
                                            <UserCircle size={14} />
                                            <span className="font-bold font-sans">{user?.fullName || 'Anonym'}</span>
                                            <span className="opacity-50">• {new Date(fb.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        <div className="space-y-4">
                                            {fb.highlights && (
                                                <div>
                                                    <h4 className="type-label-wide text-green-600 mb-1 flex items-center gap-2"><ThumbsUp size={12}/> Høydepunkt</h4>
                                                    <p className="text-royal text-sm">{fb.highlights}</p>
                                                </div>
                                            )}
                                            {fb.improvements && (
                                                <div>
                                                    <h4 className="type-label-wide text-red-500 mb-1 flex items-center gap-2"><ThumbsDown size={12}/> Forbedring</h4>
                                                    <p className="text-royal text-sm">{fb.improvements}</p>
                                                </div>
                                            )}
                                            {fb.message && (
                                                <div>
                                                    <h4 className="type-label-wide text-royal/60 mb-1 flex items-center gap-2"><MessageSquare size={12}/> Annet</h4>
                                                    <p className="text-royal text-sm whitespace-pre-wrap">{fb.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // PARTICIPANT VIEW
            <div className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8 min-h-[400px]">
                {submitted ? (
                    <div className="text-center py-12">
                        <div className="mb-6 inline-block p-4 rounded-full bg-green-50 border border-green-100">
                            <CheckCircle size={48} className="text-green-600 mx-auto" />
                        </div>
                        <h2 className="type-display-2 text-royal mb-2">Takk for din feedback!</h2>
                        <p className="text-royal/60 mb-8">Vi setter stor pris på din tilbakemelding.</p>
                        <button 
                            onClick={() => setSubmitted(false)}
                            className="type-label text-royal underline hover:text-royal/60"
                        >
                            Send en til
                        </button>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="type-display-2 text-royal mb-6">Din opplevelse</h2>
                            <p className="text-royal/60 mb-8 text-sm">Vi setter pris på dine tilbakemeldinger.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 mb-12">
                                <RatingInput label="Totalopplevelse" value={ratings.overall} onChange={v => setRatings({...ratings, overall: v})} />
                                <RatingInput label="Hotellet" value={ratings.hotel} onChange={v => setRatings({...ratings, hotel: v})} />
                                <RatingInput label="Aktiviteter" value={ratings.activities} onChange={v => setRatings({...ratings, activities: v})} />
                                <RatingInput label="Mat & Drikke" value={ratings.food} onChange={v => setRatings({...ratings, food: v})} />
                            </div>

                            <div className="space-y-6 mb-12">
                                <div>
                                    <label className="flex type-label text-royal/60 mb-2 items-center gap-2">
                                        <ThumbsUp size={14} className="text-green-600"/> Hva var høydepunktet?
                                    </label>
                                    <input 
                                        className="w-full bg-white border-b-2 border-royal/10 focus:border-royal p-3 focus:outline-none text-royal text-sm"
                                        placeholder="Det beste med turen var..."
                                        value={highlights}
                                        onChange={e => setHighlights(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="flex type-label text-royal/60 mb-2 items-center gap-2">
                                        <ThumbsDown size={14} className="text-red-500"/> Hva kunne vært bedre?
                                    </label>
                                    <input 
                                        className="w-full bg-white border-b-2 border-royal/10 focus:border-royal p-3 focus:outline-none text-royal text-sm"
                                        placeholder="Vi burde ha..."
                                        value={improvements}
                                        onChange={e => setImprovements(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block type-label text-royal/60 mb-2">Andre kommentarer</label>
                                    <textarea 
                                        className="w-full bg-white border border-royal/20 p-4 focus:outline-none focus:border-royal h-32 text-royal text-sm"
                                        placeholder="Skriv fritt..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-royal text-white px-8 py-3 type-label hover:bg-royal/90 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Sender...' : 'Send Feedback'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
