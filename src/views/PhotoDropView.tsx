import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Upload, Quote, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';

export function PhotoDropView() {
  const isAdmin = useStore(selectIsAdmin);
  const { quotes, photos, addQuote, uploadPhoto, users } = useStore();
  
  // Quote State
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Photo State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newQuoteText.trim() || !newQuoteAuthor.trim()) return;

      setIsSubmittingQuote(true);
      await addQuote(newQuoteText, newQuoteAuthor);
      setIsSubmittingQuote(false);
      setIsAddingQuote(false);
      setNewQuoteText('');
      setNewQuoteAuthor('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsUploading(true);
          try {
              await uploadPhoto(file);
          } catch (error) {
              console.error(error);
          }
          setIsUploading(false);
      }
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-8 sm:mb-12">
            <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="type-label">Tilbake</span>
            </Link>
            <div>
                <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                    <span className="type-label-wide">Minner</span>
                </div>
                <h1 className="type-display-1 text-royal">
                    Photodrop & Quotes
                </h1>
            </div>
        </header>

        {/* QUOTES SECTION */}
        <section className="mb-16">
            <div className="flex justify-between items-end mb-6 pb-4">
                <h2 className="type-display-2 text-royal flex items-center gap-3">
                    <Quote className="text-royal/40" size={24} />
                    Sitater fra turen
                </h2>
                <button 
                    onClick={() => setIsAddingQuote(!isAddingQuote)}
                    className="flex items-center gap-2 bg-royal text-white px-4 py-2 type-label hover:bg-royal/90 transition-colors rounded-full"
                >
                    {isAddingQuote ? <X size={14} /> : <Plus size={14} />}
                    {isAddingQuote ? 'Lukk' : 'Legg til Sitat'}
                </button>
            </div>

            {isAddingQuote && (
                <div className="bg-white p-6 border border-royal/10 shadow-lg mb-8 animate-in slide-in-from-top-4 duration-200">
                    <form onSubmit={handleQuoteSubmit} className="space-y-4">
                        <div>
                            <label className="block type-label text-royal/60 mb-2">Sitat</label>
                            <textarea 
                                className="w-full bg-paper border-b-2 border-royal/10 focus:border-royal p-3 focus:outline-none text-royal italic text-lg resize-none"
                                rows={3}
                                placeholder='"Det var ikke meg..."'
                                value={newQuoteText}
                                onChange={(e) => setNewQuoteText(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                             <label className="block type-label text-royal/60 mb-2">Hvem sa det?</label>
                             <input 
                                className="w-full bg-paper border-b-2 border-royal/10 focus:border-royal p-2 focus:outline-none text-royal"
                                placeholder="Navn..."
                                value={newQuoteAuthor}
                                onChange={(e) => setNewQuoteAuthor(e.target.value)}
                             />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={isSubmittingQuote || !newQuoteText || !newQuoteAuthor}
                                className="bg-royal text-white px-6 py-2 type-label hover:bg-royal/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingQuote ? 'Lagrer...' : 'Publiser'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotes.map((quote) => (
                    <div key={quote.id} className="bg-white p-6 border border-royal/10 shadow-sm hover:shadow-md transition-shadow relative group">
                        <Quote className="absolute top-4 right-4 text-royal/5 w-12 h-12 rotate-180" />
                        <blockquote className="italic text-xl text-royal mb-4 relative z-10 leading-relaxed">
                            "{quote.text}"
                        </blockquote>
                        <div className="flex justify-between items-end pt-4">
                            <span className="font-display font-bold text-royal uppercase text-sm type-label">— {quote.author}</span>
                            <span className="type-label-wide text-royal/40">
                                {new Date(quote.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
                {quotes.length === 0 && !isAddingQuote && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-royal/10">
                        <p className="text-royal/40 type-body type-label">Ingen sitater ennå.</p>
                        <p className="text-royal/30 text-xs mt-2">Vær den første til å legge til et gullkorn!</p>
                    </div>
                )}
            </div>
        </section>

        {/* PHOTOS SECTION */}
        <section>
            <div className="flex justify-between items-end mb-6 pb-4">
                 <h2 className="type-display-2 text-royal flex items-center gap-3">
                    <Camera className="text-royal/40" size={24} />
                    Photodrop
                </h2>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-royal text-white px-4 py-2 type-label hover:bg-royal/90 transition-colors rounded-full disabled:opacity-50"
                >
                    {isUploading ? <span className="animate-spin">⏳</span> : <Upload size={14} />}
                    {isUploading ? 'Laster opp...' : 'Last opp bilde'}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment" // Enables camera on mobile
                    onChange={handleFileSelect}
                />
            </div>

            <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {/* Upload Placeholder if empty */}
                 {photos.length === 0 && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="break-inside-avoid bg-royal/5 aspect-square flex flex-col items-center justify-center text-royal/40 cursor-pointer hover:bg-royal/10 transition-colors border-2 border-dashed border-royal/10 p-4 text-center"
                    >
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="type-label">Legg til første bilde</span>
                    </div>
                )}

                {photos.map((photo) => {
                     const uploader = users.find(u => u.id === photo.uploadedBy);
                     return (
                        <div key={photo.id} className="break-inside-avoid mb-4 group relative overflow-hidden bg-gray-100">
                            <img 
                                src={photo.url} 
                                alt={photo.caption || 'Trip photo'} 
                                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-white type-label-wide opacity-80">
                                    📸 {uploader?.displayName || 'Anonym'}
                                </p>
                            </div>
                        </div>
                     );
                })}
            </div>
        </section>

      </div>
    </div>
  );
}
