import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import type { MinorEventTodo, MinorEventProgramSlot, MinorEventStatus, MinorEventReminder } from '../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  CheckSquare,
  Square,
  Copy,
  Printer,
  MapPin,
  Calendar,
  FileText,
  ListTodo,
  Clapperboard,
  LayoutGrid,
  ChevronRight,
  Target,
  Users,
  Clock,
  X,
  CalendarClock,
  Package,
  CloudRain,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';

const newTodo = (): MinorEventTodo => ({
  id: crypto.randomUUID(),
  text: '',
  done: false,
});

const newProgramSlot = (): MinorEventProgramSlot => ({
  id: crypto.randomUUID(),
  time: '',
  activity: '',
  responsible: '',
});

const EVENT_STATUS_OPTIONS: { value: MinorEventStatus; label: string }[] = [
  { value: 'draft', label: 'Utkast' },
  { value: 'confirmed', label: 'Bekreftet' },
  { value: 'done', label: 'Fullført' },
];

const EVENT_TYPE_OPTIONS = ['Fest', 'Møte', 'Aktivitet', 'Fellesmål', 'Annet'];

const newReminder = (): MinorEventReminder => ({
  id: crypto.randomUUID(),
  text: '',
});

const today = () => new Date().toISOString().slice(0, 10);

export function AdminMinorEventsView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    minorEvents,
    users,
    addMinorEvent,
    updateMinorEvent,
    removeMinorEvent,
    reorderMinorEventProgram,
  } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(minorEvents[0]?.id ?? null);
  const [draggedProgramIndex, setDraggedProgramIndex] = useState<number | null>(null);

  const selected = minorEvents.find((e) => e.id === selectedId);

  const handleAddTodo = useCallback(() => {
    if (!selected) return;
    const todo = newTodo();
    const todos = [...selected.todos, todo];
    updateMinorEvent(selected.id, { todos });
  }, [selected, updateMinorEvent]);

  const handleTodoChange = useCallback(
    (todoId: string, text: string) => {
      if (!selected) return;
      const todos = selected.todos.map((t) => (t.id === todoId ? { ...t, text } : t));
      updateMinorEvent(selected.id, { todos });
    },
    [selected, updateMinorEvent]
  );

  const handleTodoToggle = useCallback(
    (todoId: string) => {
      if (!selected) return;
      const todos = selected.todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t));
      updateMinorEvent(selected.id, { todos });
    },
    [selected, updateMinorEvent]
  );

  const handleRemoveTodo = useCallback(
    (todoId: string) => {
      if (!selected) return;
      const todos = selected.todos.filter((t) => t.id !== todoId);
      updateMinorEvent(selected.id, { todos });
    },
    [selected, updateMinorEvent]
  );

  const equipmentList = selected?.equipmentList ?? [];
  const handleAddEquipment = useCallback(() => {
    if (!selected) return;
    updateMinorEvent(selected.id, { equipmentList: [...equipmentList, ''] });
  }, [selected, equipmentList, updateMinorEvent]);
  const handleEquipmentChange = useCallback(
    (index: number, value: string) => {
      if (!selected) return;
      const next = [...equipmentList];
      next[index] = value;
      updateMinorEvent(selected.id, { equipmentList: next });
    },
    [selected, equipmentList, updateMinorEvent]
  );
  const handleRemoveEquipment = useCallback(
    (index: number) => {
      if (!selected) return;
      updateMinorEvent(selected.id, { equipmentList: equipmentList.filter((_, i) => i !== index) });
    },
    [selected, equipmentList, updateMinorEvent]
  );

  const remindersList = selected?.reminders ?? [];
  const handleAddReminder = useCallback(() => {
    if (!selected) return;
    updateMinorEvent(selected.id, { reminders: [...remindersList, newReminder()] });
  }, [selected, remindersList, updateMinorEvent]);
  const handleReminderChange = useCallback(
    (id: string, field: 'text' | 'reminderDate', value: string) => {
      if (!selected) return;
      const next = remindersList.map((r) => (r.id === id ? { ...r, [field]: value || undefined } : r));
      updateMinorEvent(selected.id, { reminders: next });
    },
    [selected, remindersList, updateMinorEvent]
  );
  const handleRemoveReminder = useCallback(
    (id: string) => {
      if (!selected) return;
      updateMinorEvent(selected.id, { reminders: remindersList.filter((r) => r.id !== id) });
    },
    [selected, remindersList, updateMinorEvent]
  );

  const handleAddProgramSlot = useCallback(() => {
    if (!selected) return;
    const program = [...selected.program, newProgramSlot()];
    updateMinorEvent(selected.id, { program });
  }, [selected, updateMinorEvent]);

  const handleProgramSlotChange = useCallback(
    (slotId: string, field: 'time' | 'activity' | 'responsible', value: string) => {
      if (!selected) return;
      const program = selected.program.map((s) =>
        s.id === slotId ? { ...s, [field]: value, responsibleUserId: field === 'responsible' ? undefined : s.responsibleUserId } : s
      );
      updateMinorEvent(selected.id, { program });
    },
    [selected, updateMinorEvent]
  );

  const handleSetProgramSlotResponsible = useCallback(
    (slotId: string, userId: string | null, displayName: string) => {
      if (!selected) return;
      const program = selected.program.map((s) =>
        s.id === slotId ? { ...s, responsible: displayName, responsibleUserId: userId ?? undefined } : s
      );
      updateMinorEvent(selected.id, { program });
    },
    [selected, updateMinorEvent]
  );

  const handleRemoveProgramSlot = useCallback(
    (slotId: string) => {
      if (!selected) return;
      const program = selected.program.filter((s) => s.id !== slotId);
      updateMinorEvent(selected.id, { program });
    },
    [selected, updateMinorEvent]
  );

  const copyProgramToClipboard = useCallback(() => {
    if (!selected) return;
    const lines = selected.program.map(
      (s) => `${s.time || '–'}\t${s.activity || '–'}\t${s.responsible || '–'}`
    );
    const header = 'Tid\tAktivitet\tAnsvarlig\n';
    navigator.clipboard.writeText(header + lines.join('\n'));
    alert('Programmet er kopiert til utklippstavlen.');
  }, [selected]);

  const printProgram = useCallback(() => {
    if (!selected) return;
    const printContent = `
      <h2 style="font-family: sans-serif;">${selected.title}</h2>
      ${selected.eventDate ? `<p><strong>Dato:</strong> ${selected.eventDate}</p>` : ''}
      ${selected.location ? `<p><strong>Sted:</strong> ${selected.location}</p>` : ''}
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
        <thead><tr><th>Tid</th><th>Aktivitet</th><th>Ansvarlig</th></tr></thead>
        <tbody>
          ${selected.program.map((s) => `<tr><td>${s.time || '–'}</td><td>${s.activity || '–'}</td><td>${s.responsible || '–'}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>' + selected.title + '</title></head><body>' + printContent + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  }, [selected]);

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
        <button
          onClick={async () => {
            await addMinorEvent();
            const list = useStore.getState().minorEvents;
            if (list.length) setSelectedId(list[list.length - 1].id);
          }}
          className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors"
        >
          <Plus size={14} /> Nytt arrangement
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-royal uppercase">
          Småarrangementer (f.eks. fest med ungdommen)
        </h2>
        <p className="text-royal/60 text-sm max-w-2xl">
          Planlegg notater, oppgaver og program med tid og ansvarlig for hvert arrangement.
        </p>

        {minorEvents.length > 0 && (
          <div className="bg-white border border-royal/10 p-6 shadow-sm">
            <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2 mb-4">
              <LayoutGrid size={18} /> Oversikt over alle arrangementer
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-royal/20">
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4">Tittel</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4">Dato</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4">Sted</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 max-w-[140px]">Mål</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 w-16">Antall</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 w-24">Frist forber.</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 w-20">Status</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 w-24">Oppgaver</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 pr-4 w-20">Program</th>
                    <th className="text-left font-mono uppercase text-royal/50 py-2 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {minorEvents.map((ev) => {
                    const doneCount = ev.todos.filter((t) => t.done).length;
                    const todoCount = ev.todos.length;
                    const programCount = ev.program.length;
                    const statusLabel = EVENT_STATUS_OPTIONS.find((o) => o.value === ev.status)?.label ?? '–';
                    return (
                      <tr
                        key={ev.id}
                        className={clsx(
                          'border-b border-royal/5 hover:bg-royal/5 transition-colors',
                          selectedId === ev.id && 'bg-royal/10'
                        )}
                      >
                        <td className="py-3 pr-4 font-medium text-royal">{ev.title || 'Uten tittel'}</td>
                        <td className="py-3 pr-4 font-mono text-royal/70">{ev.eventDate || '–'}</td>
                        <td className="py-3 pr-4 text-royal/70">{ev.location || '–'}</td>
                        <td className="py-3 pr-4 text-royal/70 max-w-[140px] truncate" title={ev.goal || ''}>{ev.goal || '–'}</td>
                        <td className="py-3 pr-4 text-royal/70">{ev.expectedAttendees ?? '–'}</td>
                        <td className="py-3 pr-4 font-mono text-royal/70 text-xs">{ev.preparationDeadline || '–'}</td>
                        <td className="py-3 pr-4 text-royal/70">{statusLabel}</td>
                        <td className="py-3 pr-4">
                          <span className={todoCount === 0 ? 'text-royal/40' : doneCount === todoCount ? 'text-green-600' : 'text-royal/70'}>
                            {todoCount === 0 ? '0' : `${doneCount}/${todoCount}`}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-royal/70">{programCount} punkt</td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedId(ev.id)}
                            className="flex items-center gap-1 text-royal/60 hover:text-royal font-mono text-xs uppercase"
                          >
                            Gå til <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {minorEvents.length === 0 ? (
          <div className="bg-white border border-royal/10 p-8 text-center text-royal/60">
            <p className="mb-4">Ingen arrangementer ennå. Klikk «Nytt arrangement» for å starte.</p>
            <button
              onClick={async () => {
                await addMinorEvent();
                const list = useStore.getState().minorEvents;
                if (list.length) setSelectedId(list[0].id);
              }}
              className="inline-flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
            >
              <Plus size={14} /> Legg til første arrangement
            </button>
          </div>
        ) : (
          <>
            {/* Event selector */}
            <div className="flex flex-wrap gap-2">
              {minorEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedId(ev.id)}
                  className={clsx(
                    'px-4 py-2 text-sm font-mono uppercase border transition-all',
                    selectedId === ev.id
                      ? 'bg-royal text-white border-royal'
                      : 'bg-white border-royal/20 text-royal hover:border-royal/50'
                  )}
                >
                  {ev.title || 'Uten tittel'}
                </button>
              ))}
            </div>

            {selected && (
              <div key={selected.id} className="space-y-8">
                {/* Header: title, date, location */}
                <div className="bg-white border border-royal/10 p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => {
                        if (confirm('Slette dette arrangementet?')) {
                          removeMinorEvent(selected.id);
                          const rest = minorEvents.filter((e) => e.id !== selected.id);
                          setSelectedId(rest[0]?.id ?? null);
                        }
                      }}
                      className="ml-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Slett arrangement"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-royal/40">Tittel</label>
                      <input
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-xl text-royal"
                        defaultValue={selected.title}
                        onBlur={(e) => updateMinorEvent(selected.id, { title: e.target.value })}
                        placeholder="F.eks. Fest med ungdommen"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1">
                        <Calendar size={10} /> Dato
                      </label>
                      <input
                        type="date"
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                        value={selected.eventDate ?? ''}
                        onChange={(e) => updateMinorEvent(selected.id, { eventDate: e.target.value || undefined })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1">
                      <MapPin size={10} /> Sted
                    </label>
                    <input
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                      value={selected.location ?? ''}
                      onChange={(e) => updateMinorEvent(selected.id, { location: e.target.value || undefined })}
                      placeholder="Valgfritt sted"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1">
                      <Target size={10} /> Mål med arrangementet
                    </label>
                    <textarea
                      className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm min-h-[60px] resize-y"
                      defaultValue={selected.goal ?? ''}
                      onBlur={(e) => updateMinorEvent(selected.id, { goal: e.target.value || undefined })}
                      placeholder="Hva er målet med arrangementet?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1">
                      <Users size={10} /> Forventet antall
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                      value={selected.expectedAttendees ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateMinorEvent(selected.id, { expectedAttendees: v === '' ? undefined : parseInt(v, 10) });
                      }}
                      placeholder="Antall"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1">
                      <Clock size={10} /> Varighet
                    </label>
                    <input
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                      value={selected.duration ?? ''}
                      onChange={(e) => updateMinorEvent(selected.id, { duration: e.target.value || undefined })}
                      placeholder="F.eks. 2 timer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Status</label>
                    <select
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                      value={selected.status ?? 'draft'}
                      onChange={(e) => updateMinorEvent(selected.id, { status: (e.target.value as MinorEventStatus) || 'draft' })}
                    >
                      {EVENT_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Type</label>
                    <select
                      className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                      value={selected.eventType ?? ''}
                      onChange={(e) => updateMinorEvent(selected.id, { eventType: e.target.value || undefined })}
                    >
                      <option value="">Velg type</option>
                      {EVENT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white border border-royal/10 p-6 shadow-sm">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2 mb-3">
                    <FileText size={18} /> Notater
                  </h3>
                  <textarea
                    className="w-full min-h-[120px] border border-royal/20 focus:border-royal bg-transparent text-sm p-3 rounded-sm resize-y"
                    defaultValue={selected.notes ?? ''}
                    onBlur={(e) => updateMinorEvent(selected.id, { notes: e.target.value })}
                    placeholder="Fritekstnotater, idéer…"
                  />
                </div>

                {/* Program */}
                <div className="bg-white border border-royal/10 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2">
                      <Clapperboard size={18} /> Program (tid og ansvarlig)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyProgramToClipboard}
                        className="flex items-center gap-1 text-xs font-mono uppercase text-royal/60 hover:text-royal"
                      >
                        <Copy size={12} /> Kopier
                      </button>
                      <button
                        onClick={printProgram}
                        className="flex items-center gap-1 text-xs font-mono uppercase text-royal/60 hover:text-royal"
                      >
                        <Printer size={12} /> Skriv ut
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-royal/20">
                          <th className="text-left font-mono uppercase text-royal/50 py-2 w-20">Tid</th>
                          <th className="text-left font-mono uppercase text-royal/50 py-2">Aktivitet</th>
                          <th className="text-left font-mono uppercase text-royal/50 py-2 min-w-[140px]">Ansvarlig</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {selected.program.map((slot, idx) => (
                          <tr
                            key={slot.id}
                            className={clsx(
                              'border-b border-royal/5 group',
                              draggedProgramIndex === idx && 'opacity-50'
                            )}
                            draggable
                            onDragStart={() => setDraggedProgramIndex(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedProgramIndex == null) return;
                              reorderMinorEventProgram(selected.id, draggedProgramIndex, idx);
                              setDraggedProgramIndex(null);
                            }}
                            onDragEnd={() => setDraggedProgramIndex(null)}
                          >
                            <td className="py-2 align-top">
                              <div className="flex items-center gap-1">
                                <span className="cursor-move text-royal/20 hover:text-royal/60">
                                  <GripVertical size={14} />
                                </span>
                                <input
                                  className="w-16 border-b border-royal/10 focus:border-royal bg-transparent font-mono text-xs"
                                  value={slot.time}
                                  onChange={(e) => handleProgramSlotChange(slot.id, 'time', e.target.value)}
                                  onBlur={(e) => handleProgramSlotChange(slot.id, 'time', e.target.value)}
                                  placeholder="18:00"
                                />
                              </div>
                            </td>
                            <td className="py-2">
                              <input
                                className="w-full border-b border-royal/10 focus:border-royal bg-transparent"
                                value={slot.activity}
                                onChange={(e) => handleProgramSlotChange(slot.id, 'activity', e.target.value)}
                                onBlur={(e) => handleProgramSlotChange(slot.id, 'activity', e.target.value)}
                                placeholder="Aktivitet"
                              />
                            </td>
                            <td className="py-2 align-top">
                              <div className="flex flex-wrap items-center gap-1.5 min-w-[160px]">
                                {slot.responsible ? (
                                  <span className="inline-flex items-center gap-1 bg-royal/10 text-royal px-2 py-0.5 rounded text-xs">
                                    {slot.responsible}
                                    <button
                                      type="button"
                                      onClick={() => handleSetProgramSlotResponsible(slot.id, null, '')}
                                      className="hover:bg-royal/20 rounded"
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                ) : null}
                                <select
                                  className="border border-royal/20 focus:border-royal bg-transparent text-xs py-1 rounded flex-1 min-w-0 max-w-[120px]"
                                  value=""
                                  onChange={(e) => {
                                    const id = e.target.value;
                                    if (id) {
                                      const u = users.find((us) => us.id === id);
                                      if (u) handleSetProgramSlotResponsible(slot.id, u.id, u.fullName);
                                    }
                                    e.target.value = '';
                                  }}
                                >
                                  <option value="">Velg deltaker</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.fullName}</option>
                                  ))}
                                </select>
                                <input
                                  className="border-b border-royal/10 focus:border-royal bg-transparent text-xs py-1 w-24 flex-1 min-w-0"
                                  value={slot.responsibleUserId ? '' : slot.responsible}
                                  onChange={(e) => handleProgramSlotChange(slot.id, 'responsible', e.target.value)}
                                  onBlur={(e) => handleProgramSlotChange(slot.id, 'responsible', e.target.value)}
                                  placeholder="eller fritekst"
                                />
                              </div>
                            </td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveProgramSlot(slot.id)}
                                className="p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={handleAddProgramSlot}
                    className="mt-3 text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1"
                  >
                    <Plus size={12} /> Legg til programpunkt
                  </button>
                </div>

                {/* Planning: prep deadline, equipment list, rain plan, reminders list, oppgaver */}
                <div className="bg-white border border-royal/10 p-6 shadow-sm">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2 mb-4">
                    Planlegging og forberedelser
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1 mb-1">
                        <CalendarClock size={10} /> Frist for forberedelser
                      </label>
                      <input
                        type="date"
                        className="w-full max-w-xs border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                        value={selected.preparationDeadline ?? ''}
                        onChange={(e) => updateMinorEvent(selected.id, { preparationDeadline: e.target.value || undefined })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1 mb-2">
                        <Package size={10} /> Utstyr / materiell
                      </label>
                      <ul className="space-y-2">
                        {equipmentList.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 group">
                            <input
                              className="flex-1 border-b border-royal/10 focus:border-royal bg-transparent text-sm py-1"
                              value={item}
                              onChange={(e) => handleEquipmentChange(index, e.target.value)}
                              onBlur={(e) => handleEquipmentChange(index, e.target.value)}
                              placeholder="F.eks. grill, serviser, is"
                            />
                            <button type="button" onClick={() => handleRemoveEquipment(index)} className="p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={handleAddEquipment} className="mt-2 text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1">
                        <Plus size={12} /> Legg til punkt
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1 mb-1">
                        <CloudRain size={10} /> Plan B / ved dårlig vær
                      </label>
                      <textarea
                        className="w-full min-h-[60px] border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm resize-y"
                        defaultValue={selected.rainPlan ?? ''}
                        onBlur={(e) => updateMinorEvent(selected.id, { rainPlan: e.target.value || undefined })}
                        placeholder="Alternativ plan hvis vær eller annet står i veien"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-royal/40 flex items-center gap-1 mb-2">
                        <Bell size={10} /> Påminnelser (med dato)
                      </label>
                      <p className="text-royal/60 text-xs mb-2">Legg til påminnelse og velg dato – du får oversikt over hva som faller på hver dag.</p>
                      <ul className="space-y-2">
                        {remindersList.map((rem) => {
                          const isDue = rem.reminderDate && rem.reminderDate <= today();
                          return (
                            <li key={rem.id} className={clsx('flex flex-wrap items-center gap-2 group', isDue && 'bg-amber-50 border border-amber-200 rounded px-2 py-1')}>
                              <input
                                type="date"
                                className="w-36 border border-royal/20 focus:border-royal bg-transparent font-mono text-xs"
                                value={rem.reminderDate ?? ''}
                                onChange={(e) => handleReminderChange(rem.id, 'reminderDate', e.target.value)}
                                title="Dato for påminnelse"
                              />
                              <input
                                className="flex-1 min-w-[160px] border-b border-royal/10 focus:border-royal bg-transparent text-sm py-1"
                                value={rem.text}
                                onChange={(e) => handleReminderChange(rem.id, 'text', e.target.value)}
                                onBlur={(e) => handleReminderChange(rem.id, 'text', e.target.value)}
                                placeholder="F.eks. Send påminnelse til alle"
                              />
                              {isDue && <span className="text-xs text-amber-700 font-mono">I dag / passert</span>}
                              <button type="button" onClick={() => handleRemoveReminder(rem.id)} className="p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                <Trash2 size={14} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <button type="button" onClick={handleAddReminder} className="mt-2 text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1">
                        <Plus size={12} /> Legg til påminnelse
                      </button>
                    </div>

                    <div className="pt-2 border-t border-royal/10">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="font-display font-bold text-royal uppercase text-sm flex items-center gap-2">
                          <ListTodo size={16} /> Oppgaver
                        </span>
                        <span className="text-xs font-mono text-royal/50">
                          {selected.todos.filter((t) => t.done).length}/{selected.todos.length} fullført
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {selected.todos.map((todo) => (
                          <li key={todo.id} className="flex items-center gap-2 group">
                            <button type="button" onClick={() => handleTodoToggle(todo.id)} className="p-1 text-royal/50 hover:text-royal shrink-0">
                              {todo.done ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                            <input
                              className={clsx('flex-1 border-b border-royal/10 focus:border-royal bg-transparent text-sm py-1', todo.done && 'line-through text-royal/50')}
                              value={todo.text}
                              onChange={(e) => handleTodoChange(todo.id, e.target.value)}
                              onBlur={(e) => handleTodoChange(todo.id, e.target.value)}
                              placeholder="Ny oppgave…"
                            />
                            <button type="button" onClick={() => handleRemoveTodo(todo.id)} className="p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={handleAddTodo} className="mt-2 text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1">
                        <Plus size={12} /> Legg til oppgave
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
