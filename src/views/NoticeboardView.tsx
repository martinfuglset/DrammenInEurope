import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, Inbox } from 'lucide-react';
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
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-8 sm:mb-12">
            <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="type-label">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="type-display-1 text-royal">
                        Oppslagstavle
                    </h1>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-4">
                        <span className="type-label-wide text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
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

        {/* Clean card */}
        <div className="relative max-w-2xl mx-auto mt-8">
            <div className="bg-white p-8 md:p-12 rounded-lg border border-royal/10 shadow-lg shadow-royal/5 min-h-[400px] transition-all animate-fade-in-up">
                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-royal/10">
                    <div className="type-label text-royal/40">
                        {new Date().toLocaleDateString('no-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {isEditing ? (
                    <textarea 
                        className="w-full h-96 bg-transparent border-2 border-royal/10 p-4 rounded focus:border-royal focus:outline-none text-royal leading-relaxed resize-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Skriv beskjeder her..."
                    />
                ) : (
                    <div className="prose prose-royal prose-lg max-w-none text-royal leading-relaxed whitespace-pre-wrap">
                        {pageContent || (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-royal/40">
                                <Inbox size={40} strokeWidth={1.2} className="text-royal/20" />
                                <span className="text-readable">Ingen beskjeder festet på tavla ennå.</span>
                            </div>
                        )}
                    </div>
                )}
                
                {!isEditing && pageContent && (
                    <div className="mt-12 pt-6 border-t border-royal/5 flex justify-end">
                        <span className="type-label text-royal/40">
                            – Reiseledelsen
                        </span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
