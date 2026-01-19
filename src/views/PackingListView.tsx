import { SharpStar } from '../components/Star';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PackingListView() {
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
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Forberedelser</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                Pakkeliste
            </h1>
        </header>

        <div className="bg-white/50 backdrop-blur-sm border border-royal/10 p-8">
            <ul className="list-disc list-inside space-y-2 text-royal font-sans">
                <li>Pass / ID-kort</li>
                <li>Reiseforsikring</li>
                <li>Komfortable sko</li>
                <li>Klær etter vær</li>
                <li>Toalettsaker</li>
                <li>Lader til mobil/kamera</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
