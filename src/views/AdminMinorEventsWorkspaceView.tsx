import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Calendar,
  MapPin,
  CheckSquare,
  Square,
  Clock3,
  ListTodo,
  Bell,
  Package,
  CloudRain,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore, selectIsAdmin } from '../store';
import type { MinorEvent, MinorEventTodo, MinorEventProgramSlot, MinorEventReminder, MinorEventStatus } from '../types';

const EVENT_STATUS_OPTIONS: { value: MinorEventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'done', label: 'Done' },
];

const EVENT_TYPE_OPTIONS = ['Fest', 'Mote', 'Aktivitet', 'Fellesmal', 'Annet'];

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

const newReminder = (): MinorEventReminder => ({
  id: crypto.randomUUID(),
  text: '',
});

function isIsoDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function safeDateLabel(value?: string) {
  if (!isIsoDate(value)) return 'No date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function sortMinorEvents(items: MinorEvent[]) {
  return [...items].sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    if ((a.eventDate ?? '') !== (b.eventDate ?? '')) return (a.eventDate ?? '').localeCompare(b.eventDate ?? '');
    return (a.title ?? '').localeCompare(b.title ?? '');
  });
}

function focusInputSoon(elementId: string) {
  window.setTimeout(() => {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (!element) return;
    element.focus();
    element.select?.();
  }, 0);
}

export function AdminMinorEventsWorkspaceView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    minorEvents,
    days,
    users,
    addMinorEvent,
    updateMinorEvent,
    removeMinorEvent,
    reorderMinorEventProgram,
  } = useStore();

  // Keep this workspace focused on events happening during the trip.
  const tripStartIso = useMemo(() => {
    const dates = days.map((d) => d.date).filter((d): d is string => isIsoDate(d)).sort((a, b) => a.localeCompare(b));
    return dates[0] ?? '';
  }, [days]);

  const workspaceEvents = useMemo(
    () => sortMinorEvents(minorEvents.filter((event) => !event.eventDate || !tripStartIso || event.eventDate >= tripStartIso)),
    [minorEvents, tripStartIso]
  );

  const [selectedId, setSelectedId] = useState<string | null>(workspaceEvents[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workspaceEvents;
    return workspaceEvents.filter((event) => {
      const haystack = [
        event.title,
        event.eventType,
        event.location,
        event.goal,
        event.notes,
        event.eventDate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [workspaceEvents, searchQuery]);

  useEffect(() => {
    if (!selectedId && filteredEvents.length > 0) {
      setSelectedId(filteredEvents[0].id);
      return;
    }
    if (selectedId && !workspaceEvents.some((e) => e.id === selectedId)) {
      setSelectedId(workspaceEvents[0]?.id ?? null);
    }
  }, [selectedId, filteredEvents, workspaceEvents]);

  const selected = workspaceEvents.find((event) => event.id === selectedId) ?? null;

  const patchSelected = useCallback(
    (data: Partial<MinorEvent>) => {
      if (!selected) return;
      updateMinorEvent(selected.id, data);
    },
    [selected, updateMinorEvent]
  );

  const createEvent = useCallback(async () => {
    await addMinorEvent();
    const latest = sortMinorEvents(
      useStore
        .getState()
        .minorEvents.filter((event) => !event.eventDate || !tripStartIso || event.eventDate >= tripStartIso)
    ).at(-1);
    if (latest) setSelectedId(latest.id);
  }, [addMinorEvent, tripStartIso]);

  const todos = selected?.todos ?? [];
  const reminders = selected?.reminders ?? [];
  const equipment = selected?.equipmentList ?? [];
  const program = selected?.program ?? [];

  const addTodo = (afterTodoId?: string) => {
    if (!selected) return;
    const todo = newTodo();
    const next = [...todos];
    if (afterTodoId) {
      const index = next.findIndex((t) => t.id === afterTodoId);
      if (index >= 0) next.splice(index + 1, 0, todo);
      else next.push(todo);
    } else {
      next.push(todo);
    }
    patchSelected({ todos: next });
    return todo.id;
  };
  const updateTodo = (todoId: string, data: Partial<MinorEventTodo>) => {
    if (!selected) return;
    patchSelected({ todos: todos.map((t) => (t.id === todoId ? { ...t, ...data } : t)) });
  };
  const removeTodo = (todoId: string) => {
    if (!selected) return;
    patchSelected({ todos: todos.filter((t) => t.id !== todoId) });
  };

  const addReminder = (afterReminderId?: string) => {
    if (!selected) return;
    const reminder = newReminder();
    const next = [...reminders];
    if (afterReminderId) {
      const index = next.findIndex((r) => r.id === afterReminderId);
      if (index >= 0) next.splice(index + 1, 0, reminder);
      else next.push(reminder);
    } else {
      next.push(reminder);
    }
    patchSelected({ reminders: next });
    return reminder.id;
  };
  const updateReminder = (id: string, data: Partial<MinorEventReminder>) => {
    if (!selected) return;
    patchSelected({ reminders: reminders.map((r) => (r.id === id ? { ...r, ...data } : r)) });
  };
  const removeReminder = (id: string) => {
    if (!selected) return;
    patchSelected({ reminders: reminders.filter((r) => r.id !== id) });
  };

  const addEquipment = (afterIndex?: number) => {
    if (!selected) return;
    const next = [...equipment];
    const insertAt = afterIndex != null ? Math.min(afterIndex + 1, next.length) : next.length;
    next.splice(insertAt, 0, '');
    patchSelected({ equipmentList: next });
    return insertAt;
  };
  const updateEquipment = (index: number, value: string) => {
    if (!selected) return;
    const next = [...equipment];
    next[index] = value;
    patchSelected({ equipmentList: next });
  };
  const removeEquipment = (index: number) => {
    if (!selected) return;
    patchSelected({ equipmentList: equipment.filter((_, i) => i !== index) });
  };

  const addProgramSlot = (afterSlotId?: string) => {
    if (!selected) return;
    const slot = newProgramSlot();
    const next = [...program];
    if (afterSlotId) {
      const index = next.findIndex((s) => s.id === afterSlotId);
      if (index >= 0) next.splice(index + 1, 0, slot);
      else next.push(slot);
    } else {
      next.push(slot);
    }
    patchSelected({ program: next });
    return slot.id;
  };
  const updateProgramSlot = (slotId: string, data: Partial<MinorEventProgramSlot>) => {
    if (!selected) return;
    patchSelected({ program: program.map((slot) => (slot.id === slotId ? { ...slot, ...data } : slot)) });
  };
  const removeProgramSlot = (slotId: string) => {
    if (!selected) return;
    patchSelected({ program: program.filter((slot) => slot.id !== slotId) });
  };
  const moveProgramSlot = (index: number, direction: -1 | 1) => {
    if (!selected) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= program.length) return;
    reorderMinorEventProgram(selected.id, index, nextIndex);
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:p-6 md:p-10 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <button
          type="button"
          onClick={createEvent}
          className="inline-flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
        >
          <Plus size={14} /> New event page
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="bg-white border border-royal/10 rounded-xl p-4 h-fit space-y-3">
          <div>
            <h2 className="font-display font-bold text-lg text-royal uppercase">Småarrangementer</h2>
            <p className="text-xs text-royal/50 mt-1">
              Planning workspace for during-trip events.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-royal/35" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full border border-royal/20 focus:border-royal bg-white pl-9 pr-3 py-2 text-sm rounded-lg"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredEvents.map((event) => {
              const selectedCard = selectedId === event.id;
              const doneTodos = event.todos.filter((t) => t.done).length;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedId(event.id)}
                  className={clsx(
                    'w-full text-left border rounded-lg p-3 transition-all',
                    selectedCard
                      ? 'border-royal bg-royal/[0.03]'
                      : 'border-royal/10 hover:border-royal/30 hover:bg-royal/[0.02]'
                  )}
                >
                  <p className="font-display font-bold text-royal truncate">{event.title || 'Untitled event'}</p>
                  <div className="mt-1 text-[11px] font-mono uppercase text-royal/45 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>{safeDateLabel(event.eventDate)}</span>
                    {event.eventType && <span>{event.eventType}</span>}
                    <span>
                      {doneTodos}/{event.todos.length} tasks
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredEvents.length === 0 && (
              <div className="border border-dashed border-royal/20 rounded-lg p-6 text-center">
                <p className="text-sm text-royal/60">No matching pages.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-4">
          {!selected ? (
            <div className="bg-white border border-royal/10 rounded-xl p-10 text-center">
              <Sparkles size={28} className="mx-auto text-royal/35 mb-3" />
              <p className="font-display font-bold text-royal uppercase mb-1">Start your planning space</p>
              <p className="text-sm text-royal/60 mb-4">
                Create a page and add notes, tasks, reminders and a running program.
              </p>
              <button
                type="button"
                onClick={createEvent}
                className="inline-flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
              >
                <Plus size={14} /> New event page
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white border border-royal/10 rounded-xl p-6 space-y-4">
                <input
                  defaultValue={selected.title}
                  onBlur={(e) => patchSelected({ title: e.target.value })}
                  className="w-full bg-transparent text-3xl font-display font-bold text-royal border-b border-transparent focus:border-royal/20 pb-1"
                  placeholder="Untitled event"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/45 flex items-center gap-1">
                      <Calendar size={10} /> Date
                    </label>
                    <input
                      type="date"
                      value={selected.eventDate ?? ''}
                      onChange={(e) => patchSelected({ eventDate: e.target.value || undefined })}
                      className="w-full border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/45">Status</label>
                    <select
                      value={selected.status ?? 'draft'}
                      onChange={(e) => patchSelected({ status: e.target.value as MinorEventStatus })}
                      className="w-full border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm"
                    >
                      {EVENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/45">Type</label>
                    <select
                      value={selected.eventType ?? ''}
                      onChange={(e) => patchSelected({ eventType: e.target.value || undefined })}
                      className="w-full border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Choose type</option>
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/45 flex items-center gap-1">
                      <MapPin size={10} /> Location
                    </label>
                    <input
                      value={selected.location ?? ''}
                      onChange={(e) => patchSelected({ location: e.target.value || undefined })}
                      className="w-full border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <textarea
                  defaultValue={selected.goal ?? ''}
                  onBlur={(e) => patchSelected({ goal: e.target.value || undefined })}
                  className="w-full min-h-[70px] border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm resize-y"
                  placeholder="What does success look like for this event?"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addTodo();
                      if (newId) focusInputSoon(`minor-workspace-todo-${newId}`);
                    }}
                    className="text-xs font-mono uppercase border border-royal/20 hover:border-royal/40 px-2.5 py-1.5 rounded-md text-royal"
                  >
                    + Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addProgramSlot();
                      if (newId) focusInputSoon(`minor-workspace-program-activity-${newId}`);
                    }}
                    className="text-xs font-mono uppercase border border-royal/20 hover:border-royal/40 px-2.5 py-1.5 rounded-md text-royal"
                  >
                    + Program item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addReminder();
                      if (newId) focusInputSoon(`minor-workspace-reminder-text-${newId}`);
                    }}
                    className="text-xs font-mono uppercase border border-royal/20 hover:border-royal/40 px-2.5 py-1.5 rounded-md text-royal"
                  >
                    + Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const insertedIndex = addEquipment();
                      if (insertedIndex != null) focusInputSoon(`minor-workspace-equipment-${insertedIndex}`);
                    }}
                    className="text-xs font-mono uppercase border border-royal/20 hover:border-royal/40 px-2.5 py-1.5 rounded-md text-royal"
                  >
                    + Equipment
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                <div className="bg-white border border-royal/10 rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2">
                    <ListTodo size={16} /> Checklist
                  </h3>
                  <ul className="space-y-2">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-center gap-2 group">
                        <button type="button" onClick={() => updateTodo(todo.id, { done: !todo.done })} className="text-royal/55 hover:text-royal">
                          {todo.done ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <input
                          id={`minor-workspace-todo-${todo.id}`}
                          value={todo.text}
                          onChange={(e) => updateTodo(todo.id, { text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const newId = addTodo(todo.id);
                            if (newId) focusInputSoon(`minor-workspace-todo-${newId}`);
                          }}
                          className={clsx(
                            'flex-1 border-b border-royal/15 focus:border-royal bg-transparent text-sm py-1',
                            todo.done && 'line-through text-royal/50'
                          )}
                          placeholder="Write task..."
                        />
                        <button type="button" onClick={() => removeTodo(todo.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addTodo();
                      if (newId) focusInputSoon(`minor-workspace-todo-${newId}`);
                    }}
                    className="text-xs font-mono uppercase text-royal/50 hover:text-royal flex items-center gap-1"
                  >
                    <Plus size={12} /> Add task
                  </button>
                </div>

                <div className="bg-white border border-royal/10 rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2">
                    <Clock3 size={16} /> Program flow
                  </h3>
                  <ul className="space-y-2">
                    {program.map((slot, index) => (
                      <li key={slot.id} className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,160px)_auto] gap-2 items-center">
                        <input
                          id={`minor-workspace-program-time-${slot.id}`}
                          value={slot.time}
                          onChange={(e) => updateProgramSlot(slot.id, { time: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const newId = addProgramSlot(slot.id);
                            if (newId) focusInputSoon(`minor-workspace-program-time-${newId}`);
                          }}
                          className="border border-royal/20 focus:border-royal rounded-md px-2 py-1 text-sm font-mono"
                          placeholder="18:00"
                        />
                        <input
                          id={`minor-workspace-program-activity-${slot.id}`}
                          value={slot.activity}
                          onChange={(e) => updateProgramSlot(slot.id, { activity: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const newId = addProgramSlot(slot.id);
                            if (newId) focusInputSoon(`minor-workspace-program-activity-${newId}`);
                          }}
                          className="border border-royal/20 focus:border-royal rounded-md px-2 py-1 text-sm"
                          placeholder="Activity"
                        />
                        <input
                          id={`minor-workspace-program-responsible-${slot.id}`}
                          value={slot.responsible}
                          onChange={(e) => updateProgramSlot(slot.id, { responsible: e.target.value, responsibleUserId: undefined })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const newId = addProgramSlot(slot.id);
                            if (newId) focusInputSoon(`minor-workspace-program-responsible-${newId}`);
                          }}
                          className="border border-royal/20 focus:border-royal rounded-md px-2 py-1 text-sm"
                          placeholder="Responsible"
                          list={`minor-workspace-users-${slot.id}`}
                        />
                        <datalist id={`minor-workspace-users-${slot.id}`}>
                          {users.map((user) => (
                            <option key={user.id} value={user.fullName} />
                          ))}
                        </datalist>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveProgramSlot(index, -1)}
                            className="text-royal/40 hover:text-royal disabled:opacity-30"
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProgramSlot(index, 1)}
                            className="text-royal/40 hover:text-royal disabled:opacity-30"
                            disabled={index === program.length - 1}
                            title="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button type="button" onClick={() => removeProgramSlot(slot.id)} className="text-red-300 hover:text-red-500" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addProgramSlot();
                      if (newId) focusInputSoon(`minor-workspace-program-activity-${newId}`);
                    }}
                    className="text-xs font-mono uppercase text-royal/50 hover:text-royal flex items-center gap-1"
                  >
                    <Plus size={12} /> Add program item
                  </button>
                </div>

                <div className="bg-white border border-royal/10 rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2">
                    <Bell size={16} /> Reminders
                  </h3>
                  <ul className="space-y-2">
                    {reminders.map((reminder) => (
                      <li key={reminder.id} className="grid grid-cols-[130px_minmax(0,1fr)_auto] gap-2 items-center group">
                        <input
                          type="date"
                          value={reminder.reminderDate ?? ''}
                          onChange={(e) => updateReminder(reminder.id, { reminderDate: e.target.value || undefined })}
                          className="border border-royal/20 focus:border-royal rounded-md px-2 py-1 text-xs font-mono"
                        />
                        <input
                          value={reminder.text}
                          onChange={(e) => updateReminder(reminder.id, { text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const newId = addReminder(reminder.id);
                            if (newId) focusInputSoon(`minor-workspace-reminder-text-${newId}`);
                          }}
                          id={`minor-workspace-reminder-text-${reminder.id}`}
                          className="border-b border-royal/15 focus:border-royal bg-transparent text-sm py-1"
                          placeholder="Write reminder..."
                        />
                        <button type="button" onClick={() => removeReminder(reminder.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = addReminder();
                      if (newId) focusInputSoon(`minor-workspace-reminder-text-${newId}`);
                    }}
                    className="text-xs font-mono uppercase text-royal/50 hover:text-royal flex items-center gap-1"
                  >
                    <Plus size={12} /> Add reminder
                  </button>
                </div>

                <div className="bg-white border border-royal/10 rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-royal uppercase flex items-center gap-2">
                    <Package size={16} /> Equipment and Plan B
                  </h3>
                  <ul className="space-y-2">
                    {equipment.map((item, index) => (
                      <li key={`equipment-${index}`} className="flex items-center gap-2 group">
                        <input
                          id={`minor-workspace-equipment-${index}`}
                          value={item}
                          onChange={(e) => updateEquipment(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' || e.shiftKey) return;
                            e.preventDefault();
                            const insertedIndex = addEquipment(index);
                            if (insertedIndex != null) focusInputSoon(`minor-workspace-equipment-${insertedIndex}`);
                          }}
                          className="flex-1 border-b border-royal/15 focus:border-royal bg-transparent text-sm py-1"
                          placeholder="Equipment or material..."
                        />
                        <button type="button" onClick={() => removeEquipment(index)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      const insertedIndex = addEquipment();
                      if (insertedIndex != null) focusInputSoon(`minor-workspace-equipment-${insertedIndex}`);
                    }}
                    className="text-xs font-mono uppercase text-royal/50 hover:text-royal flex items-center gap-1"
                  >
                    <Plus size={12} /> Add equipment
                  </button>

                  <div className="pt-2">
                    <label className="text-[10px] font-mono uppercase text-royal/45 flex items-center gap-1 mb-1">
                      <CloudRain size={10} /> Plan B
                    </label>
                    <textarea
                      defaultValue={selected.rainPlan ?? ''}
                      onBlur={(e) => patchSelected({ rainPlan: e.target.value || undefined })}
                      className="w-full min-h-[78px] border border-royal/20 focus:border-royal rounded-lg px-3 py-2 text-sm resize-y"
                      placeholder="Alternative plan if weather or constraints change."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-xl p-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Delete this event page?')) return;
                    removeMinorEvent(selected.id);
                    setSelectedId(null);
                  }}
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-mono text-xs uppercase"
                >
                  <Trash2 size={14} /> Delete event page
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

