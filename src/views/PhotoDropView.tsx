import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

export function PhotoDropView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  const pageSlug = 'photodrop-quote';
  
  const pageContent = infoPages.find(p => p.slug === pageSlug)?.content || '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [quote, setQuote] = useState(pageContent);

  useEffect(() => {
      setQuote(pageContent);
  }, [pageContent]);

  const handleSave = async () => {
      await updateInfoPage(pageSlug, quote);
      setIsEditing(false);
  };
  
  const defaultQuote = `"Not all those who wander are lost." - J.R.R. Tolkien`;

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <SharpStar size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Minner</span>
                    </div>
                    <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Photodrop & Quotes
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

        <div className="grid gap-8 md:grid-cols-2">
            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
                <h2 className="font-display text-2xl text-royal mb-6 uppercase">Last opp bilder</h2>
                <div className="border-2 border-dashed border-royal/20 h-48 flex items-center justify-center text-royal/40 hover:border-royal/40 transition-colors cursor-pointer bg-white/30">
                    <span className="font-mono text-xs uppercase tracking-widest">Klikk for å laste opp</span>
                </div>
            </section>

            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
                <h2 className="font-display text-2xl text-royal mb-6 uppercase">Dagens Quote</h2>
                
                {isEditing ? (
                     <textarea 
                        className="w-full h-32 bg-white/50 border border-royal/20 p-4 focus:border-royal focus:outline-none font-sans text-lg"
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Skriv dagens sitat..."
                    />
                ) : (
                    <blockquote className="italic text-royal/80 text-lg border-l-2 border-royal pl-4 my-8 whitespace-pre-wrap">
                        {quote || defaultQuote}
                    </blockquote>
                )}
            </section>
        </div>
      </div>
    </div>
  );
}
