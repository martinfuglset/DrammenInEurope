import { SharpStar } from '../components/Star';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeedbackView() {
  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                <SharpStar size={12} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Din mening</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                Feedback
            </h1>
        </header>

        <div className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
            <p className="text-royal font-sans mb-6">Vi setter pris på dine tilbakemeldinger. Fortell oss hva du synes!</p>
            
            <form className="space-y-6">
                <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-royal/60 mb-2">Melding</label>
                    <textarea 
                        className="w-full bg-white border border-royal/20 p-4 focus:outline-none focus:border-royal h-32"
                        placeholder="Skriv din tilbakemelding her..."
                    />
                </div>
                <button className="bg-royal text-white px-8 py-3 font-mono text-xs uppercase tracking-widest hover:bg-royal/90 transition-colors">
                    Send tilbakemelding
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
