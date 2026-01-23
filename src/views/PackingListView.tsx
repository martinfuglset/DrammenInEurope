import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save, CheckSquare, Square, Luggage, Sun, Camera, Shirt, BriefcaseMedical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

interface PackingCategory {
    id: string;
    title: string;
    icon: 'luggage' | 'sun' | 'camera' | 'shirt' | 'medical';
    items: { id: string; label: string; checked?: boolean }[];
}

export function PackingListView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  const pageSlug = 'packing-list';
  const rawContent = infoPages.find(p => p.slug === pageSlug)?.content;
  
  // DEFAULT MOCK DATA
  const defaultCategories: PackingCategory[] = [
      {
          id: 'essentials',
          title: 'Viktigst',
          icon: 'luggage',
          items: [
              { id: 'pass', label: 'Pass / ID-kort' },
              { id: 'tickets', label: 'Flybilletter & Reisedokumenter' },
              { id: 'wallet', label: 'Lommebok (Euro & Kort)' },
              { id: 'insurance', label: 'Reiseforsikringsbevis' }
          ]
      },
      {
          id: 'clothes',
          title: 'Klær & Sko',
          icon: 'shirt',
          items: [
              { id: 'shoes', label: 'Gode sko til byvandring' },
              { id: 'dinner', label: 'Pent antrekk til middag' },
              { id: 'swim', label: 'Badetøy & Badehåndkle' },
              { id: 'jacket', label: 'Lett jakke til kvelden' },
              { id: 'underwear', label: 'Undertøy & Sokker' }
          ]
      },
      {
          id: 'toiletries',
          title: 'Toalettsaker',
          icon: 'medical',
          items: [
              { id: 'sunscreen', label: 'Solkrem & Solbriller' },
              { id: 'meds', label: 'Personlige medisiner' },
              { id: 'toothbrush', label: 'Tannbørste & Tannkrem' },
              { id: 'shampoo', label: 'Sjampo & Såpe (reisestørrelse)' }
          ]
      },
      {
          id: 'tech',
          title: 'Dingser',
          icon: 'camera',
          items: [
              { id: 'charger', label: 'Lader til mobil' },
              { id: 'powerbank', label: 'Powerbank' },
              { id: 'headphones', label: 'Hodetelefoner' },
              { id: 'adapter', label: 'Reiseadapter (hvis nødvendig)' }
          ]
      }
  ];

  const [categories, setCategories] = useState<PackingCategory[]>(defaultCategories);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Load local storage for checked state
  useEffect(() => {
      const savedChecks = localStorage.getItem('packing-checks');
      if (savedChecks) {
          setCheckedItems(JSON.parse(savedChecks));
      }
  }, []);

  const toggleCheck = (itemId: string) => {
      const newState = { ...checkedItems, [itemId]: !checkedItems[itemId] };
      setCheckedItems(newState);
      localStorage.setItem('packing-checks', JSON.stringify(newState));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState('');

  useEffect(() => {
      if (rawContent) {
          try {
              const parsed = JSON.parse(rawContent);
              if (Array.isArray(parsed)) {
                  setCategories(parsed);
              }
          } catch (e) {
              console.error("Failed to parse packing list", e);
          }
      }
  }, [rawContent]);

  useEffect(() => {
      setEditJson(JSON.stringify(categories, null, 2));
  }, [categories, isEditing]);

  const handleSave = async () => {
      try {
          const parsed = JSON.parse(editJson);
          setCategories(parsed);
          await updateInfoPage(pageSlug, editJson);
          setIsEditing(false);
      } catch (e) {
          alert("Ugyldig JSON format");
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'luggage': return Luggage;
          case 'sun': return Sun;
          case 'camera': return Camera;
          case 'shirt': return Shirt;
          case 'medical': return BriefcaseMedical;
          default: return Luggage;
      }
  };

  // Calculate progress
  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((totalChecked / totalItems) * 100) || 0;

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <SharpStar size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Forberedelser</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Pakkeliste
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
                        Endre kategoriene ved å redigere JSON-strukturen.
                        Gyldige ikoner: 'luggage', 'sun', 'camera', 'shirt', 'medical'.
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
                {/* Progress Bar */}
                <div className="bg-white p-6 mb-12 border border-royal/10 shadow-sm relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-8 opacity-5 text-royal transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
                        <Luggage size={120} strokeWidth={1} />
                     </div>
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="font-mono text-xs uppercase tracking-widest text-royal/60">Din progresjon</span>
                        <span className="font-display font-bold text-2xl text-royal">{progress}%</span>
                    </div>
                    <div className="h-2 bg-royal/10 rounded-full overflow-hidden relative z-10">
                        <div 
                            className="h-full bg-royal transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map((category) => {
                        const Icon = getIcon(category.icon);
                        return (
                            <div key={category.id} className="bg-white p-8 border border-royal/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="flex items-center gap-4 mb-6 border-b border-royal/5 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-royal/5 flex items-center justify-center text-royal">
                                        <Icon size={20} />
                                    </div>
                                    <h2 className="font-display font-bold text-xl text-royal uppercase">{category.title}</h2>
                                </div>
                                
                                <ul className="space-y-3">
                                    {category.items.map((item) => {
                                        const isChecked = checkedItems[item.id];
                                        return (
                                            <li 
                                                key={item.id} 
                                                className={clsx(
                                                    "flex items-start gap-3 cursor-pointer group select-none",
                                                    isChecked ? "opacity-40" : "opacity-100"
                                                )}
                                                onClick={() => toggleCheck(item.id)}
                                            >
                                                <div className={clsx(
                                                    "mt-0.5 transition-colors",
                                                    isChecked ? "text-royal" : "text-royal/20 group-hover:text-royal/40"
                                                )}>
                                                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </div>
                                                <span className={clsx(
                                                    "text-sm font-sans text-royal transition-all decoration-1 underline-offset-2",
                                                    isChecked && "line-through decoration-royal/40"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
                
                {progress === 100 && (
                    <div className="mt-12 text-center animate-bounce">
                        <span className="inline-block px-4 py-2 bg-royal text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-lg">
                            Klar for avreise! ✈️
                        </span>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}
