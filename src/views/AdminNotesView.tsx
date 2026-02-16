import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  FileText,
  ListTodo,
  CheckSquare,
  Square,
} from 'lucide-react';

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
    removeAdminList,
  } = useStore();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<{ listId: string; itemId: string } | null>(null);

  if (!isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase"
        >
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <h2 className="font-display font-bold text-2xl text-royal uppercase mb-2">Notater og lister</h2>
      <p className="text-royal/60 text-sm mb-8 max-w-2xl">
        Privat notatblokk for admins. Bruk notater for fri tekst, og lister for sjekklister.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Notes section */}
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
            {adminNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              if (!isEditing) {
                return (
                  <div
                    key={note.id}
                    className="bg-white border border-royal/10 p-4 group flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold text-royal">{note.title || 'Uten tittel'}</h4>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingNoteId(note.id)}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Rediger"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Slette dette notatet?')) removeAdminNote(note.id);
                          }}
                          className="p-1.5 text-royal/40 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Slett"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-sm text-royal/80 whitespace-pre-wrap text-readable">{note.content}</p>
                    )}
                  </div>
                );
              }
              return (
                <div key={note.id} className="bg-white border-2 border-royal p-4 space-y-3 relative">
                  <button
                    onClick={() => setEditingNoteId(null)}
                    className="absolute top-2 right-2 p-1.5 text-green-600 hover:bg-green-50 rounded"
                    title="Lukk"
                  >
                    <Edit2 size={14} />
                  </button>
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
                    <textarea
                      defaultValue={note.content}
                      onBlur={(e) => updateAdminNote(note.id, { content: e.target.value })}
                      className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </div>
              );
            })}
            {adminNotes.length === 0 && (
              <p className="text-royal/50 text-sm">Ingen notater. Klikk Ny for å legge til.</p>
            )}
          </div>
        </div>

        {/* Lists section */}
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
            {adminLists.map((list) => {
              const isEditing = editingListId === list.id;
              const doneCount = list.items.filter((i) => i.done).length;
              const totalCount = list.items.length;

              if (!isEditing) {
                return (
                  <div key={list.id} className="bg-white border border-royal/10 p-4 group flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold text-royal">{list.title || 'Uten tittel'}</h4>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingListId(list.id)}
                          className="p-1.5 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                          title="Rediger"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Slette denne listen?')) removeAdminList(list.id);
                          }}
                          className="p-1.5 text-royal/40 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Slett"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {totalCount > 0 && (
                      <p className="text-xs text-royal/50">
                        {doneCount}/{totalCount} fullført
                      </p>
                    )}
                    <ul className="space-y-1">
                      {list.items.slice(0, 5).map((item) => (
                        <li
                          key={item.id}
                          className={item.done ? 'line-through text-royal/50 text-sm' : 'text-sm text-royal/80'}
                        >
                          {item.done ? <CheckSquare size={12} className="inline mr-2" /> : <Square size={12} className="inline mr-2" />}
                          {item.text || '(tom)'}
                        </li>
                      ))}
                      {list.items.length > 5 && (
                        <li className="text-royal/40 text-xs">+{list.items.length - 5} flere</li>
                      )}
                    </ul>
                    {list.items.length === 0 && (
                      <p className="text-royal/40 text-sm">Tom liste</p>
                    )}
                  </div>
                );
              }

              return (
                <div key={list.id} className="bg-white border-2 border-royal p-4 space-y-3 relative">
                  <button
                    onClick={() => setEditingListId(null)}
                    className="absolute top-2 right-2 p-1.5 text-green-600 hover:bg-green-50 rounded"
                    title="Lukk"
                  >
                    <Edit2 size={14} />
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-royal/40">Punkter</span>
                      <button
                        onClick={() => addAdminListItem(list.id)}
                        className="text-xs font-mono text-royal/60 hover:text-royal"
                      >
                        + Legg til
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {list.items.map((item) => {
                        const isEditingItem = editingItemId?.listId === list.id && editingItemId?.itemId === item.id;
                        return (
                          <li key={item.id} className="flex items-center gap-2">
                            <button
                              onClick={() => updateAdminListItem(list.id, item.id, { done: !item.done })}
                              className="shrink-0 text-royal/60 hover:text-royal"
                            >
                              {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                            {isEditingItem ? (
                              <input
                                autoFocus
                                defaultValue={item.text}
                                onBlur={(e) => {
                                  updateAdminListItem(list.id, item.id, { text: e.target.value });
                                  setEditingItemId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateAdminListItem(list.id, item.id, { text: (e.target as HTMLInputElement).value });
                                    setEditingItemId(null);
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
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
            {adminLists.length === 0 && (
              <p className="text-royal/50 text-sm">Ingen lister. Klikk Ny for å legge til.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
