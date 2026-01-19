import { SharpStar } from '../components/Star';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GroupsView() {
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
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Lister</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                Grupper
            </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-6">
                <h2 className="font-display text-2xl text-royal mb-4 uppercase">Bussinndeling</h2>
                <p className="text-royal/60">Kommer snart...</p>
            </section>
            
            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-6">
                <h2 className="font-display text-2xl text-royal mb-4 uppercase">Romfordeling</h2>
                <p className="text-royal/60">Kommer snart...</p>
            </section>

            <section className="bg-white/50 backdrop-blur-sm border border-royal/10 p-6 md:col-span-2">
                <h2 className="font-display text-2xl text-royal mb-4 uppercase">Aktivitetsgrupper</h2>
                <p className="text-royal/60">Kommer snart...</p>
            </section>
        </div>
      </div>
    </div>
  );
}
