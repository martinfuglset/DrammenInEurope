import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, Bus, BedDouble, Ticket, Search, Users, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import clsx from 'clsx';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragEndEvent,
} from '@dnd-kit/core';

type Tab = 'bus' | 'room' | 'activities';

interface GroupData {
    title: string;
    members: string[];
}

export function GroupsView() {
  const isAdmin = useStore(selectIsAdmin);
  const { infoPages, updateInfoPage, activities, signups, users } = useStore();
  
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

  const serializeGroups = (groups: GroupData[]): string => {
      return groups.map(g => [g.title, ...g.members].join('\n')).join('\n\n');
  };

  function DraggableMember({
    id,
    member,
    groupIdx,
    memberIdx,
  }: {
    id: string;
    member: string;
    groupIdx: number;
    memberIdx: number;
  }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id,
      data: { groupIdx, memberIdx, member },
    });
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={clsx(
          'flex items-center gap-2 text-sm text-royal/80 text-readable border border-royal/10 rounded px-3 py-2 bg-white cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-40'
        )}
      >
        <GripVertical size={14} className="text-royal/40 shrink-0 pointer-events-none" />
        <span className="truncate pointer-events-none font-sans">{member}</span>
      </div>
    );
  }

  function DroppableGroup({
    group,
    groupIdx,
  }: {
    group: GroupData;
    groupIdx: number;
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `group-${groupIdx}`,
      data: { groupIdx },
    });
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          'bg-white border-2 shadow-sm flex flex-col min-h-[120px] transition-colors',
          isOver ? 'border-royal bg-royal/5' : 'border-royal/20'
        )}
      >
        <div className="bg-royal/5 p-4">
          <h3 className="font-display font-bold text-lg text-royal uppercase leading-tight">
            {group.title}
          </h3>
          <div className="mt-1 flex items-center gap-1 type-label-wide text-royal/40">
            <Users size={10} />
            <span>{group.members.length} personer</span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2">
          {group.members.length === 0 && (
            <p className="text-sm text-royal/30 italic text-readable py-2">Slipp medlemmer her</p>
          )}
          {group.members.map((member, mIdx) => (
            <DraggableMember
              key={`${groupIdx}-${mIdx}`}
              id={`group-${groupIdx}-member-${mIdx}`}
              member={member}
              groupIdx={groupIdx}
              memberIdx={mIdx}
            />
          ))}
        </div>
      </div>
    );
  }

  function GroupDragEditor({
    groups,
    onGroupsChange,
  }: {
    groups: GroupData[];
    onGroupsChange: (groups: GroupData[]) => void;
  }) {
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const match = activeId.match(/^group-(\d+)-member-(\d+)$/);
      const overGroupMatch = overId.match(/^group-(\d+)$/);
      const overMemberMatch = overId.match(/^group-(\d+)-member-/);
      const toGroupIdx = overGroupMatch
        ? parseInt(overGroupMatch[1], 10)
        : overMemberMatch
          ? parseInt(overMemberMatch[1], 10)
          : -1;
      if (!match || toGroupIdx < 0) return;
      const fromGroupIdx = parseInt(match[1], 10);
      const fromMemberIdx = parseInt(match[2], 10);
      if (fromGroupIdx === toGroupIdx) return;
      const newGroups = groups.map((g) => ({ ...g, members: [...g.members] }));
      const [member] = newGroups[fromGroupIdx].members.splice(fromMemberIdx, 1);
      newGroups[toGroupIdx].members.push(member);
      onGroupsChange(newGroups);
    };

    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} autoScroll={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
          {groups.map((group, groupIdx) => (
            <DroppableGroup
              key={groupIdx}
              group={group}
              groupIdx={groupIdx}
            />
          ))}
        </div>
      </DndContext>
    );
  }

  const deriveActivityGroups = (): GroupData[] => {
      return activities.map((activity) => {
          const memberIds = signups
              .filter((s) => s.activityId === activity.id && s.status !== 'cancelled')
              .map((s) => s.userId);
          const memberNames = memberIds
              .map((id) => users.find((u) => u.id === id)?.fullName)
              .filter((name): name is string => Boolean(name));
          return { title: activity.title, members: memberNames };
      });
  };

  const getActiveContent = (): GroupData[] => {
      switch (activeTab) {
          case 'bus': return parseGroups(content.bus);
          case 'room': return parseGroups(content.room);
          case 'activities': return deriveActivityGroups();
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
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-6 sm:mb-8">
            <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span className="type-label">Tilbake</span>
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                        <span className="type-label-wide">Lister</span>
                    </div>
                    <h1 className="type-display-1 text-royal">
                        Grupper
                    </h1>
                </div>
                {isAdmin && activeTab !== 'activities' && (
                    <div className="flex items-center gap-4">
                        <span className="type-label-wide text-royal/40 bg-royal/5 px-2 py-1 rounded">Admin Mode</span>
                        <button 
                            onClick={() => {
                                if (isEditing) {
                                    handleSave();
                                } else {
                                    setIsEditing(true);
                                }
                            }}
                            className="bg-royal/10 hover:bg-royal/20 text-royal p-3 rounded-full transition-colors"
                        >
                            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                        </button>
                    </div>
                )}
            </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 pb-1">
            <div className="flex flex-1 gap-2 overflow-x-auto overflow-y-hidden pb-2 md:pb-0 no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 transition-all type-label whitespace-nowrap",
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
            {(activeTab === 'activities' || !isEditing) && (
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
            {isEditing && activeTab !== 'activities' ? (
                <div className="space-y-4">
                    <div className="bg-royal/5 p-4 mb-4">
                        <h3 className="font-bold text-royal text-sm mb-2">Dra medlemmer mellom grupper</h3>
                        <p className="text-xs text-royal/80 text-readable">
                            Dra et navn fra én gruppe og slipp det i en annen for å flytte.
                        </p>
                    </div>
                    <GroupDragEditor
                        groups={parseGroups(editState[activeTab])}
                        onGroupsChange={(groups) => setEditState({ ...editState, [activeTab]: serializeGroups(groups) })}
                    />
                    <details className="mt-4">
                        <summary className="type-label text-royal/60 cursor-pointer hover:text-royal">
                            Avansert: Rediger som tekst
                        </summary>
                        <textarea 
                            className="mt-2 w-full h-48 bg-white border-2 border-royal/20 p-4 focus:border-royal focus:outline-none type-body type-long"
                            value={editState[activeTab]}
                            onChange={e => setEditState({...editState, [activeTab]: e.target.value})}
                            placeholder={`Lim inn liste for ${tabs.find(t => t.id === activeTab)?.label} her...`}
                        />
                    </details>
                </div>
            ) : (
                <>
                    {activeTab === 'activities' && (
                        <p className="type-label text-royal/50 mb-4">
                            Basert på påmeldinger til valgfrie aktiviteter
                        </p>
                    )}
                    {filteredGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-royal/40">
                            <Users size={48} className="mb-4 opacity-50" />
                            <p className="type-body type-label">Ingen grupper funnet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                            {filteredGroups.map((group, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white border border-royal/10 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
                                >
                                    <div className="bg-royal/5 p-4">
                                        <h3 className="font-display font-bold text-lg text-royal uppercase leading-tight">
                                            {group.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-1 type-label-wide text-royal/40">
                                            <Users size={10} />
                                            <span>{group.members.length} personer</span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <ul className="space-y-2">
                                            {group.members.map((member, mIdx) => (
                                                <li key={mIdx} className="text-sm text-royal/80 text-readable pb-1 last:pb-0 font-sans">
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
