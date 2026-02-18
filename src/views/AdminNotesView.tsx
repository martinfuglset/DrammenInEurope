import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import { NoteEditor, NoteContent } from '../components/NoteEditor';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  FileText,
  ListTodo,
  CheckSquare,
  Square,
  GripVertical,
  Copy,
  Search,
  Maximize2,
  X,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight,
  List,
  Check,
} from 'lucide-react';

function formatDate(iso: string | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeTime(iso: string | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'akkurat nå';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min siden`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} t siden`;
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

export function AdminNotesView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    adminNotes,
    adminLists,
    addAdminNote,
    updateAdminNote,
    removeAdminNote,
    addAdminList,
    updateAdminList,
    updateAdminListItem,
    addAdminListItem,
    removeAdminListItem,
    moveAdminListItem,
    reorderAdminListItems,
    duplicateAdminList,
    removeAdminList,
  } = useStore();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<{ listId: string; itemId: string } | null>(null);
  const [dragState, setDragState] = useState<{ listId: string; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ listId: string; index: number } | null>(null);
  const [quickAddValue, setQuickAddValue] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedId, setFocusedId] = useState<{ type: 'note' | 'list'; id: string } | null>(null);
  const [editingInFocused, setEditingInFocused] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const [expandedListIds, setExpandedListIds] = useState<Set<string>>(new Set());
  const [showAllItemsForList, setShowAllItemsForList] = useState<Set<string>>(new Set());

  const toggleNoteExpand = (id: string) => setExpandedNoteIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleListExpand = (id: string) => setExpandedListIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleShowAllItems = (id: string) => setShowAllItemsForList((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleListItemDone = (listId: string, itemId: string, done: boolean) => {
    updateAdminListItem(listId, itemId, { done: !done });
  };

  const matchesSearch = (title: string, content?: string, items?: { text: string }[]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (title.toLowerCase().includes(q)) return true;
    if (content?.toLowerCase().includes(q)) return true;
    if (items?.some((i) => i.text.toLowerCase().includes(q))) return true;
    return false;
  };

  const filteredNotes = useMemo(
    () => adminNotes.filter((n) => matchesSearch(n.title, n.content)),
    [adminNotes, searchQuery]
  );
  const filteredLists = useMemo(
    () => adminLists.filter((l) => matchesSearch(l.title, undefined, l.items)),
    [adminLists, searchQuery]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingInFocused) {
          setEditingInFocused(false);
        } else if (focusedId) {
          setFocusedId(null);
        } else {
          setEditingNoteId(null);
          setEditingListId(null);
          setEditingItemId(null);
          setDropTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingInFocused, focusedId]);

  const handleDropOnList = (targetListId: string, targetIndex?: number) => {
    if (!dragState) return;
    const list = adminLists.find((l) => l.id === targetListId);
    if (!list) return;
    if (dragState.listId === targetListId) {
      if (targetIndex != null) {
        const fromIdx = list.items.findIndex((i) => i.id === dragState.itemId);
        if (fromIdx >= 0) {
          const toIdx = fromIdx < targetIndex ? targetIndex - 1 : targetIndex;
          if (fromIdx !== toIdx) reorderAdminListItems(targetListId, fromIdx, toIdx);
        }
      }
    } else {
      moveAdminListItem(dragState.listId, targetListId, dragState.itemId);
    }
    setDragState(null);
    setDropTarget(null);
  };

  if (!isAdmin) return null;

  /* ======== FOCUSED (BIG) VIEW ======== */
  if (focusedId) {
    const focusedNote = focusedId.type === 'note' ? adminNotes.find((n) => n.id === focusedId.id) : null;
    const focusedList = focusedId.type === 'list' ? adminLists.find((l) => l.id === focusedId.id) : null;
    return (
      <div className="max-w-4xl mx-auto px-4 sm:p-6 md:p-12 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setFocusedId(null); setEditingInFocused(false); }}
            className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase"
          >
            <ArrowLeft size={16} /> Tilbake til notater
          </button>
          <button
            onClick={() => { setFocusedId(null); setEditingInFocused(false); }}
            className="p-2 text-royal/60 hover:text-royal hover:bg-royal/5 rounded"
            title="Lukk (Escape)"
          >
            <X size={20} />
          </button>
        </div>
        <div className="bg-white border border-royal/10 p-8">
          {focusedNote && (
            <>
              {editingInFocused ? (
                <input
                  defaultValue={focusedNote.title}
                  onBlur={(e) => updateAdminNote(focusedNote.id, { title: e.target.value })}
                  className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-2xl text-royal uppercase py-1 mb-2"
                  placeholder="Tittel"
                />
              ) : (
                <h2 className="font-display font-bold text-2xl text-royal uppercase mb-2">{focusedNote.title || 'Uten tittel'}</h2>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-0 font-content text-xs text-royal/50 mb-4">
                {focusedNote.createdAt && <span>Lagt til {formatDate(focusedNote.createdAt)}</span>}
                {focusedNote.createdByName && <span>Skrevet av {focusedNote.createdByName}</span>}
                {focusedNote.updatedAt && <span>Sist endret {formatRelativeTime(focusedNote.updatedAt)}</span>}
              </div>
              {editingInFocused ? (
                <NoteEditor
                  content={focusedNote.content}
                  onSave={(html) => updateAdminNote(focusedNote.id, { content: html })}
                />
              ) : (
                <NoteContent content={focusedNote.content} />
              )}
              <div className="mt-6 flex gap-3">
                {editingInFocused ? (
                  <button
                    onClick={() => setEditingInFocused(false)}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-mono text-xs uppercase"
                  >
                    <Check size={14} /> Ferdig
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingInFocused(true)}
                    className="flex items-center gap-2 text-royal/60 hover:text-royal font-mono text-xs uppercase"
                  >
                    <Edit2 size={14} /> Rediger
                  </button>
                )}
              </div>
            </>
          )}
          {focusedList && (
            <>
              <h2 className="font-display font-bold text-2xl text-royal uppercase mb-2">{focusedList.title || 'Uten tittel'}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0 font-content text-xs text-royal/50 mb-4">
                {focusedList.createdAt && <span>Lagt til {formatDate(focusedList.createdAt)}</span>}
                {focusedList.createdByName && <span>Opprettet av {focusedList.createdByName}</span>}
                {focusedList.updatedAt && <span>Sist endret {formatRelativeTime(focusedList.updatedAt)}</span>}
              </div>
              <ul className="space-y-2 font-content">
                {focusedList.items.map((item) => (
                  <li key={item.id} className={`flex items-center gap-2 ${item.done ? 'line-through text-royal/50' : 'text-royal/80'}`}>
                    <button
                      type="button"
                      onClick={() => toggleListItemDone(focusedList.id, item.id, item.done)}
                      className="shrink-0 text-royal/60 hover:text-royal"
                      title={item.done ? 'Marker som ikke fullført' : 'Marker som fullført'}
                    >
                      {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    {item.text || '(tom)'}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setFocusedId(null);
                  setEditingListId(focusedList.id);
                }}
                className="mt-6 flex items-center gap-2 text-royal/60 hover:text-royal font-mono text-xs uppercase"
              >
                <Edit2 size={14} /> Rediger
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ======== MAIN GRID VIEW ======== */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-royal uppercase mb-1">Notater og lister</h2>
          <p className="font-content text-royal/60 text-sm max-w-2xl">
            Privat notatblokk for admins. Bruk verktøylinjen for formatering, tabeller og lister.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-royal/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i notater og lister..."
            className="w-full pl-9 pr-3 py-2 border border-royal/20 focus:border-royal bg-white text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ===== NOTES ===== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-royal uppercase flex items-center gap-2">
              <FileText size={20} /> Notater
            </h3>
            <button
              onClick={() => addAdminNote()}
              className="flex items-center gap-2 bg-royal text-white px-3 py-1.5 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
            >
              <Plus size={14} /> Ny
            </button>
          </div>
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              if (!isEditing) {
                const isExpanded = expandedNoteIds.has(note.id);
                return (
                  <div
                    key={note.id}
                    className="bg-white border border-royal/10 hover:border-royal/20 transition-colors"
                  >
                    <button
                      onClick={() => toggleNoteExpand(note.id)}
                      className="w-full p-4 flex items-start gap-2 text-left group"
                    >
                      <span className="shrink-0 mt-0.5 text-royal/50">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <span className="shrink-0 mt-0.5 text-royal/50">
                        {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-royal">{note.title || 'Uten tittel'}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1 font-content text-xs text-royal/50">
                          {note.createdAt && <span>Lagt til {formatDate(note.createdAt)}</span>}
                          {note.createdByName && <span>av {note.createdByName}</span>}
                          {note.updatedAt && <span>· Sist endret {formatRelativeTime(note.updatedAt)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setFocusedId({ type: 'note', id: note.id })}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Fullbredde"
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button
                          onClick={() => setEditingNoteId(note.id)}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Rediger"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Slette dette notatet?')) removeAdminNote(note.id); }}
                          className="p-1.5 text-royal/40 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Slett"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-14 border-t border-royal/5">
                        <div className="pt-3">
                          <NoteContent content={note.content} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={note.id} className="bg-white border-2 border-royal p-4 space-y-3 relative">
                  <div className="flex gap-1 absolute top-2 right-2">
                    <button onClick={() => setEditingNoteId(null)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Ferdig (Escape)">
                      <Check size={14} />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Tittel</label>
                    <input
                      defaultValue={note.title}
                      onBlur={(e) => updateAdminNote(note.id, { title: e.target.value })}
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-royal py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Innhold</label>
                    <NoteEditor
                      content={note.content}
                      onSave={(html) => updateAdminNote(note.id, { content: html })}
                    />
                  </div>
                </div>
              );
            })}
            {filteredNotes.length === 0 && (
              <div className="bg-white border border-dashed border-royal/20 p-8 text-center">
                <FileText size={32} className="mx-auto mb-3 text-royal/30" />
                <p className="text-royal/60 font-display font-bold uppercase text-sm mb-1">
                  {searchQuery ? 'Ingen treff' : 'Ingen notater ennå'}
                </p>
                <p className="text-royal/40 text-xs mb-4 font-content">
                  {searchQuery ? 'Prøv et annet søkeord' : 'Legg til notater for ideer, møtereferater og mer'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => addAdminNote()}
                    className="inline-flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
                  >
                    <Plus size={14} /> Nytt notat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== LISTS ===== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-royal uppercase flex items-center gap-2">
              <ListTodo size={20} /> Lister
            </h3>
            <button
              onClick={() => addAdminList()}
              className="flex items-center gap-2 bg-royal text-white px-3 py-1.5 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
            >
              <Plus size={14} /> Ny
            </button>
          </div>
          <div className="space-y-3">
            {filteredLists.map((list) => {
              const isEditing = editingListId === list.id;
              const doneCount = list.items.filter((i) => i.done).length;
              const totalCount = list.items.length;
              const isEmpty = totalCount === 0;

              if (!isEditing) {
                const isExpanded = expandedListIds.has(list.id);
                const showAll = showAllItemsForList.has(list.id);
                const visibleItems = showAll ? list.items : list.items.slice(0, 5);
                const hasMore = list.items.length > 5 && !showAll;
                return (
                  <div
                    key={list.id}
                    className={`bg-white border transition-all ${
                      dragState && dragState.listId !== list.id ? 'border-royal/30 border-dashed bg-royal/5' : 'border-royal/10 hover:border-royal/20'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragState && dragState.listId !== list.id) setDropTarget({ listId: list.id, index: 0 });
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnList(list.id, 0);
                    }}
                  >
                    <button
                      onClick={() => toggleListExpand(list.id)}
                      className="w-full p-4 flex items-start gap-2 text-left group"
                    >
                      <span className="shrink-0 mt-0.5 text-royal/50">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <span className="shrink-0 mt-0.5 text-royal/50">
                        {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-royal truncate">{list.title || 'Uten tittel'}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1 font-content text-xs text-royal/50">
                          {list.createdAt && <span>Lagt til {formatDate(list.createdAt)}</span>}
                          {list.createdByName && <span>av {list.createdByName}</span>}
                          {totalCount > 0 && <span>{doneCount}/{totalCount} fullført</span>}
                          {list.updatedAt && <span>· Sist endret {formatRelativeTime(list.updatedAt)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setFocusedId({ type: 'list', id: list.id })}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Fullbredde"
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button
                          onClick={() => duplicateAdminList(list.id)}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Dupliser"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setEditingListId(list.id)}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Rediger"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Slette denne listen?')) removeAdminList(list.id); }}
                          className="p-1.5 text-royal/40 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Slett"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-14 border-t border-royal/5">
                        <div className="pt-3 font-content">
                          {isEmpty ? (
                            <p className="text-royal/40 text-sm">Tom liste – klikk Rediger for å legge til punkter</p>
                          ) : (
                            <>
                              <ul className="space-y-1.5">
                                {visibleItems.map((item) => (
                                  <li key={item.id} className={`flex items-center gap-2 text-sm ${item.done ? 'line-through text-royal/50' : 'text-royal/80'}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleListItemDone(list.id, item.id, item.done);
                                      }}
                                      className="shrink-0 text-royal/60 hover:text-royal"
                                      title={item.done ? 'Marker som ikke fullført' : 'Marker som fullført'}
                                    >
                                      {item.done ? <CheckSquare size={14} className="shrink-0" /> : <Square size={14} className="shrink-0" />}
                                    </button>
                                    {item.text || '(tom)'}
                                  </li>
                                ))}
                              </ul>
                              {hasMore && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleShowAllItems(list.id); }}
                                  className="mt-2 flex items-center gap-1.5 text-royal/60 hover:text-royal font-content text-sm"
                                >
                                  <List size={14} /> Vis alle ({list.items.length} punkter)
                                </button>
                              )}
                              {showAll && list.items.length > 5 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleShowAllItems(list.id); }}
                                  className="mt-2 flex items-center gap-1.5 text-royal/60 hover:text-royal font-content text-sm"
                                >
                                  Vis færre
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={list.id}
                  className="bg-white border-2 border-royal p-4 space-y-3 relative"
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragState && dragState.listId !== list.id) setDropTarget({ listId: list.id, index: list.items.length });
                    else if (dragState?.listId === list.id) setDropTarget({ listId: list.id, index: list.items.length });
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const idx = dropTarget?.listId === list.id ? dropTarget.index : list.items.length;
                    handleDropOnList(list.id, idx);
                  }}
                >
                  <button
                    onClick={() => setEditingListId(null)}
                    className="absolute top-2 right-2 p-1.5 text-green-600 hover:bg-green-50 rounded"
                    title="Ferdig (Escape)"
                  >
                    <Check size={14} />
                  </button>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Listetittel</label>
                    <input
                      defaultValue={list.title}
                      onBlur={(e) => updateAdminList(list.id, { title: e.target.value })}
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-royal py-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-royal/40">Punkter (dra for å endre rekkefølge eller flytte til annen liste)</span>
                    <ul className="space-y-2 min-h-[2rem]">
                      {list.items.map((item, idx) => {
                        const isEditingItem = editingItemId?.listId === list.id && editingItemId?.itemId === item.id;
                        const isDragging = dragState?.listId === list.id && dragState?.itemId === item.id;
                        const isDropBefore = dropTarget?.listId === list.id && dropTarget?.index === idx;
                        return (
                          <li
                            key={item.id}
                            className={`relative ${isDropBefore ? 'pt-4' : ''}`}
                          >
                            {isDropBefore && dragState && (
                              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-royal/50 rounded" />
                            )}
                            <div
                              draggable
                              onDragStart={(e) => {
                                setDragState({ listId: list.id, itemId: item.id });
                                e.dataTransfer.setData('application/x-admin-list-item', JSON.stringify({ listId: list.id, itemId: item.id }));
                                e.dataTransfer.effectAllowed = 'move';
                                (e.target as HTMLElement).style.opacity = '0.5';
                              }}
                              onDragEnd={(e) => {
                                (e.target as HTMLElement).style.opacity = '1';
                                setDragState(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDropTarget({ listId: list.id, index: idx });
                              }}
                              className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
                            >
                              <span className="cursor-grab active:cursor-grabbing text-royal/30 shrink-0" title="Dra for å rekkefølge eller flytte">
                                <GripVertical size={14} />
                              </span>
                              <button
                                onClick={() => updateAdminListItem(list.id, item.id, { done: !item.done })}
                                className="shrink-0 text-royal/60 hover:text-royal"
                              >
                                {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>
                              {isEditingItem ? (
                                <input
                                  autoFocus={item.text === ''}
                                  defaultValue={item.text}
                                  onBlur={(e) => {
                                    updateAdminListItem(list.id, item.id, { text: e.target.value });
                                    setEditingItemId(null);
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Escape') setEditingItemId(null);
                                    else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (e.target as HTMLInputElement).value.trim();
                                      updateAdminListItem(list.id, item.id, { text: val });
                                      const newId = await addAdminListItem(list.id, item.id);
                                      if (newId) setEditingItemId({ listId: list.id, itemId: newId });
                                    }
                                  }}
                                  className="flex-1 border-b border-royal/20 focus:border-royal bg-transparent text-sm py-0.5"
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingItemId({ listId: list.id, itemId: item.id })}
                                  className={`flex-1 text-sm cursor-text ${item.done ? 'line-through text-royal/50' : 'text-royal/80'}`}
                                >
                                  {item.text || '(klikk for å redigere)'}
                                </span>
                              )}
                              <button
                                onClick={() => removeAdminListItem(list.id, item.id)}
                                className="p-1 text-royal/30 hover:text-red-500 shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-royal/10">
                      <input
                        type="text"
                        value={quickAddValue[list.id] ?? ''}
                        onChange={(e) => setQuickAddValue((v) => ({ ...v, [list.id]: e.target.value }))}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (quickAddValue[list.id] ?? '').trim();
                            const newId = await addAdminListItem(list.id);
                            if (newId) {
                              if (val) updateAdminListItem(list.id, newId, { text: val });
                              else setEditingItemId({ listId: list.id, itemId: newId });
                              setQuickAddValue((v) => ({ ...v, [list.id]: '' }));
                            }
                          }
                        }}
                        placeholder="Skriv og trykk Enter for nytt punkt"
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm py-1 placeholder:text-royal/40"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredLists.length === 0 && (
              <div className="bg-white border border-dashed border-royal/20 p-8 text-center">
                <ListTodo size={32} className="mx-auto mb-3 text-royal/30" />
                <p className="text-royal/60 font-display font-bold uppercase text-sm mb-1">
                  {searchQuery ? 'Ingen treff' : 'Ingen lister ennå'}
                </p>
                <p className="text-royal/40 text-xs mb-4 font-content">
                  {searchQuery ? 'Prøv et annet søkeord' : 'Opprett sjekklister for å holde oversikt'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => addAdminList()}
                    className="inline-flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
                  >
                    <Plus size={14} /> Ny liste
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
