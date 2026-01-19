import { SharpStar } from '../components/Star';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PhotoDropView() {
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
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Minner</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                Photodrop & Quotes
            </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
                <h2 className="font-display text-2xl text-royal mb-6 uppercase">Last opp bilder</h2>
                <div className="border-2 border-dashed border-royal/20 h-48 flex items-center justify-center text-royal/40 hover:border-royal/40 transition-colors cursor-pointer">
                    <span className="font-mono text-xs uppercase tracking-widest">Klikk for å laste opp</span>
                </div>
            </section>

            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
                <h2 className="font-display text-2xl text-royal mb-6 uppercase">Dagens Quote</h2>
                <blockquote className="italic text-royal/80 text-lg border-l-2 border-royal pl-4 my-8">
                    "Not all those who wander are lost."
                </blockquote>
                <p className="text-right text-royal/60 font-mono text-xs uppercase">- J.R.R. Tolkien</p>
            </section>
        </div>
      </div>
    </div>
  );
}
