import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

export function NoticeboardView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  const pageSlug = 'noticeboard';
  const pageContent = infoPages.find(p => p.slug === pageSlug)?.content || '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(pageContent);

  useEffect(() => {
      setEditContent(pageContent);
  }, [pageContent]);

  const handleSave = async () => {
      await updateInfoPage(pageSlug, editContent);
      setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
       {/* Corkboard texture overlay effect (optional, simulated with pattern) */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(#2E2E5E 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
       }}></div>

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
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Info</span>
                    </div>
                    <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Oppslagstavle
                    </h1>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-royal/10 hover:bg-royal/20 text-royal p-3 rounded-full transition-colors z-20"
                        >
                            {isEditing ? <Save size={20} onClick={handleSave} /> : <Edit2 size={20} />}
                        </button>
                    </div>
                )}
            </div>
        </header>

        {/* The "Notice" Paper */}
        <div className="relative max-w-2xl mx-auto mt-8">
            {/* Top "Pin" */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-red-500 drop-shadow-md">
                <div className="relative">
                    <Pin size={32} className="fill-current rotate-45" strokeWidth={1.5} />
                    <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full blur-[1px]"></div>
                </div>
            </div>

            {/* Decorative Tape */}
            <div className="absolute -top-3 -right-8 w-24 h-8 bg-royal/10 rotate-[15deg] backdrop-blur-sm shadow-sm z-10 hidden md:block"></div>
            <div className="absolute -bottom-3 -left-8 w-24 h-8 bg-royal/10 rotate-[-10deg] backdrop-blur-sm shadow-sm z-10 hidden md:block"></div>

            <div className={clsx(
                "relative bg-[#fffdf5] p-8 md:p-12 shadow-xl border border-royal/5 min-h-[400px] transition-transform",
                !isEditing && "rotate-1"
            )}>
                {/* Paper texture/watermark */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-50 pointer-events-none"></div>
                
                {/* Stamps */}
                <div className="absolute top-8 right-8 pointer-events-none opacity-20 rotate-12 mix-blend-multiply">
                     <div className="border-4 border-royal rounded-full w-24 h-24 flex items-center justify-center">
                        <div className="text-center">
                            <div className="font-mono text-[8px] uppercase tracking-widest">Axactor</div>
                            <SharpStar className="mx-auto my-1" size={16} />
                            <div className="font-display font-bold text-xl uppercase">UTUR</div>
                            <div className="font-mono text-[8px] uppercase tracking-widest">2026</div>
                        </div>
                     </div>
                </div>

                <div className="absolute bottom-12 left-8 pointer-events-none opacity-10 -rotate-6 mix-blend-multiply hidden sm:block">
                     <div className="border-2 border-royal w-32 h-16 flex items-center justify-center">
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-royal">Approved</span>
                     </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 border-b-2 border-royal/10 pb-4">
                        <div className="font-mono text-xs text-royal/40 uppercase tracking-widest">
                            {new Date().toLocaleDateString('no-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="h-px flex-1 bg-royal/10"></div>
                        <SharpStar size={8} className="text-royal/20" />
                    </div>

                    {isEditing ? (
                        <textarea 
                            className="w-full h-96 bg-transparent border-2 border-royal/10 p-4 focus:border-royal focus:outline-none font-sans text-royal leading-relaxed resize-none"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Skriv beskjeder her..."
                        />
                    ) : (
                        <div className="prose prose-royal prose-lg max-w-none font-sans text-royal leading-relaxed whitespace-pre-wrap">
                            {pageContent || (
                                <span className="text-royal/40 italic flex flex-col items-center justify-center py-20 gap-4">
                                    <span className="not-italic text-3xl">📭</span>
                                    Ingen beskjeder festet på tavla ennå.
                                </span>
                            )}
                        </div>
                    )}
                    
                    {!isEditing && pageContent && (
                        <div className="mt-12 flex justify-center opacity-40">
                            <span className="font-handwriting text-2xl text-royal rotate-[-5deg]">
                                - Reiseledelsen
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
