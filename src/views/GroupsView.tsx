import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save, Bus, BedDouble, Ticket, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

type Tab = 'bus' | 'room' | 'activities';

interface GroupData {
    title: string;
    members: string[];
}

export function GroupsView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  
  const pageSlug = 'groups';
  const rawContent = infoPages.find(p => p.slug === pageSlug)?.content;
  
  const [content, setContent] = useState({
      bus: '',
      room: '',
      activities: ''
  });

  const [activeTab, setActiveTab] = useState<Tab>('bus');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
      if (rawContent) {
          try {
              const parsed = JSON.parse(rawContent);
              setContent({
                  bus: parsed.bus || '',
                  room: parsed.room || '',
                  activities: parsed.activities || ''
              });
          } catch (e) {
              console.error("Failed to parse groups content", e);
          }
      }
  }, [rawContent]);

  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState(content);

  useEffect(() => {
      setEditState(content);
  }, [content, isEditing]);

  const handleSave = async () => {
      await updateInfoPage(pageSlug, JSON.stringify(editState));
      setContent(editState);
      setIsEditing(false);
  };

  // Helper to parse text into groups
  // Format expectation: Double newline separates groups. First line is title.
  const parseGroups = (text: string): GroupData[] => {
      if (!text) return [];
      return text.split(/\n\s*\n/).map(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length === 0) return null;
          return {
              title: lines[0],
              members: lines.slice(1)
          };
      }).filter(Boolean) as GroupData[];
  };

  const getActiveContent = () => {
      switch (activeTab) {
          case 'bus': return parseGroups(content.bus);
          case 'room': return parseGroups(content.room);
          case 'activities': return parseGroups(content.activities);
      }
  };

  const currentGroups = getActiveContent();
  const filteredGroups = currentGroups.filter(g => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return g.title.toLowerCase().includes(query) || 
             g.members.some(m => m.toLowerCase().includes(query));
  });

  const tabs = [
      { id: 'bus' as const, label: 'Bussinndeling', icon: Bus },
      { id: 'room' as const, label: 'Romfordeling', icon: BedDouble },
      { id: 'activities' as const, label: 'Aktivitetsgrupper', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <SharpStar size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Lister</span>
                    </div>
                    <h1 className="font-display font-extrabold text-4xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Grupper
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

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 border-b border-royal/10 pb-1">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-2 md:pb-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all font-mono text-xs uppercase tracking-widest whitespace-nowrap",
                            activeTab === tab.id 
                                ? "bg-royal text-white shadow-lg translate-y-1" 
                                : "bg-white/50 text-royal/60 hover:bg-white hover:text-royal"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {/* Search Bar */}
            {!isEditing && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-royal/40" size={16} />
                    <input 
                        type="text"
                        placeholder="Søk etter navn eller gruppe..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white/50 border border-royal/10 rounded-full focus:outline-none focus:border-royal/40 text-sm w-full md:w-64"
                    />
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
            {isEditing ? (
                <div className="space-y-4">
                    <div className="bg-royal/5 p-4 rounded-lg mb-4">
                        <h3 className="font-bold text-royal text-sm mb-2">Instruksjoner for redigering</h3>
                        <p className="text-xs text-royal/80 mb-2">
                            Skriv inn grupper separert med en blank linje (to linjeskift).
                            Den første linjen i hver blokk blir overskriften på gruppen.
                            De neste linjene blir medlemmene.
                        </p>
                        <pre className="bg-white/50 p-2 text-[10px] font-mono rounded text-royal/60">
{`Gruppe 1 - Navn på gruppe
Medlem 1
Medlem 2
Medlem 3

Gruppe 2 - Annet navn
Medlem A
Medlem B`}
                        </pre>
                    </div>
                    <textarea 
                        className="w-full h-[60vh] bg-white border-2 border-royal/20 p-6 focus:border-royal focus:outline-none font-mono text-sm leading-relaxed rounded-lg"
                        value={editState[activeTab]}
                        onChange={e => setEditState({...editState, [activeTab]: e.target.value})}
                        placeholder={`Lim inn liste for ${tabs.find(t => t.id === activeTab)?.label} her...`}
                    />
                </div>
            ) : (
                <>
                    {filteredGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-royal/40">
                            <Users size={48} className="mb-4 opacity-50" />
                            <p className="font-mono text-sm uppercase tracking-widest">Ingen grupper funnet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                            {filteredGroups.map((group, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white border border-royal/10 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
                                >
                                    <div className="bg-royal/5 p-4 border-b border-royal/5">
                                        <h3 className="font-display font-bold text-lg text-royal uppercase leading-tight">
                                            {group.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-royal/40 uppercase tracking-widest">
                                            <Users size={10} />
                                            <span>{group.members.length} personer</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <ul className="space-y-2">
                                            {group.members.map((member, mIdx) => (
                                                <li key={mIdx} className="text-sm text-royal/80 border-b border-royal/5 last:border-0 pb-1 last:pb-0 font-sans">
                                                    {member}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
}
