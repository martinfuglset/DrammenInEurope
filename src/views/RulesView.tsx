import { useState, useEffect } from 'react';
import { SharpStar } from '../components/Star';
import { ArrowLeft, Edit2, Save, Shield, AlertTriangle, Heart, Clock, Volume2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

interface Rule {
    id: string;
    title: string;
    description: string;
    icon: 'shield' | 'clock' | 'heart' | 'volume' | 'alert';
    severity: 'low' | 'medium' | 'high';
}

export function RulesView() {
  const { isAdmin, infoPages, updateInfoPage } = useStore();
  const pageSlug = 'rules';
  const rawContent = infoPages.find(p => p.slug === pageSlug)?.content;
  
  const defaultRules: Rule[] = [
      {
          id: '1',
          title: 'Møt presis',
          description: 'Bussen venter ikke! Vi har et stramt program, så vær klar i lobbyen 5 minutter før oppsatt tid.',
          icon: 'clock',
          severity: 'high'
      },
      {
          id: '2',
          title: 'Vis hensyn',
          description: 'Vi er mange på tur. Hold støynivået nede i gangene på hotellet etter kl 23:00. Husk at det bor andre gjester der også.',
          icon: 'heart',
          severity: 'medium'
      },
      {
          id: '3',
          title: 'Sikkerhet først',
          description: 'Gå aldri alene om kvelden. Hold deg til opplyste gater og pass godt på verdisaker.',
          icon: 'shield',
          severity: 'high'
      },
      {
          id: '4',
          title: 'Beskjeder',
          description: 'Følg med på oppslagstavla i appen. Endringer i programmet vil bli postet der fortløpende.',
          icon: 'alert',
          severity: 'low'
      }
  ];

  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState('');

  useEffect(() => {
      if (rawContent) {
          try {
              const parsed = JSON.parse(rawContent);
              if (Array.isArray(parsed)) {
                  setRules(parsed);
              }
          } catch (e) {
              // Fallback for old content which was plain text
              console.log("Could not parse rules as JSON, using default");
          }
      }
  }, [rawContent]);

  useEffect(() => {
      setEditJson(JSON.stringify(rules, null, 2));
  }, [rules, isEditing]);

  const handleSave = async () => {
      try {
          const parsed = JSON.parse(editJson);
          setRules(parsed);
          await updateInfoPage(pageSlug, editJson);
          setIsEditing(false);
      } catch (e) {
          alert("Ugyldig JSON format");
      }
  };

  const getIcon = (iconName: string) => {
      switch(iconName) {
          case 'clock': return Clock;
          case 'heart': return Heart;
          case 'volume': return Volume2;
          case 'alert': return AlertTriangle;
          default: return Shield;
      }
  };

  const getSeverityColor = (severity: string) => {
      switch(severity) {
          case 'high': return 'bg-red-100 text-red-600 border-red-200';
          case 'medium': return 'bg-orange-100 text-orange-600 border-orange-200';
          default: return 'bg-blue-100 text-blue-600 border-blue-200';
      }
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-mono text-xs uppercase tracking-widest">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <SharpStar size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Viktig</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl md:text-6xl text-royal uppercase leading-none tracking-tight">
                        Regler
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
                    <h3 className="font-bold text-royal text-sm mb-2">Rediger Regler JSON</h3>
                    <p className="text-xs text-royal/80">
                        Ikoner: 'shield', 'clock', 'heart', 'volume', 'alert'.<br/>
                        Alvorlighetsgrad: 'high', 'medium', 'low'.
                    </p>
                </div>
                <textarea 
                    className="w-full h-[60vh] bg-white border-2 border-royal/20 p-4 focus:border-royal focus:outline-none font-mono text-sm leading-relaxed rounded-lg"
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                />
            </div>
        ) : (
            <div className="space-y-4">
                <p className="text-royal/60 mb-8 font-sans text-lg max-w-xl">
                    For at alle skal få en fantastisk tur, har vi noen enkle "House Rules" vi ber alle følge.
                </p>

                {rules.map((rule, idx) => {
                    const Icon = getIcon(rule.icon);
                    const isExpanded = expandedId === rule.id;
                    const severityClass = getSeverityColor(rule.severity);

                    return (
                        <div 
                            key={rule.id}
                            onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                            className={clsx(
                                "bg-white border transition-all duration-300 cursor-pointer overflow-hidden group relative",
                                isExpanded ? "border-royal shadow-md" : "border-royal/10 hover:border-royal/30 shadow-sm"
                            )}
                        >
                            {/* Card Header */}
                            <div className="p-6 flex items-center gap-6">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-transform duration-500",
                                    severityClass,
                                    isExpanded && "rotate-[360deg] scale-110"
                                )}>
                                    <Icon size={24} strokeWidth={2} />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-mono text-xs text-royal/40 uppercase tracking-widest">Regel #{idx + 1}</span>
                                        {rule.severity === 'high' && (
                                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Viktig
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-display font-bold text-xl text-royal uppercase">{rule.title}</h3>
                                </div>

                                <div className={clsx(
                                    "text-royal/20 transition-transform duration-300",
                                    isExpanded && "rotate-180 text-royal"
                                )}>
                                    <ChevronDown size={24} />
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <div className={clsx(
                                "bg-royal/5 px-6 overflow-hidden transition-all duration-300 ease-in-out",
                                isExpanded ? "max-h-48 py-6 opacity-100" : "max-h-0 py-0 opacity-0"
                            )}>
                                <div className="flex gap-4">
                                    <div className="w-12 shrink-0 flex justify-center">
                                        <div className="w-px h-full bg-royal/10"></div>
                                    </div>
                                    <p className="text-royal/80 font-sans text-lg leading-relaxed">
                                        {rule.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
