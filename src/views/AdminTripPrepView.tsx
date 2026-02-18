import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, Plus, ArrowLeft, Trash2, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore, selectIsAdmin } from '../store';
import type { PreTripEvent, MinorEvent, MinorEventRecurrencePattern } from '../types';

const FALLBACK_TRIP_DATE_ISO = '2026-10-07';
const EVENT_TYPE_OPTIONS = ['Mote', 'Lansering', 'Frist', 'Workshop', 'Praktisk', 'Annet'];
const EVENT_TYPE_THEME: Record<
  string,
  { chip: string; calendarEvent: string; timelineDot: string; timelineCard: string }
> = {
  Mote: {
    chip: 'bg-sky-100 text-sky-800 border-sky-200',
    calendarEvent: 'bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200',
    timelineDot: 'bg-sky-500',
    timelineCard: 'border-sky-200 hover:border-sky-300',
  },
  Lansering: {
    chip: 'bg-violet-100 text-violet-800 border-violet-200',
    calendarEvent: 'bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-200',
    timelineDot: 'bg-violet-500',
    timelineCard: 'border-violet-200 hover:border-violet-300',
  },
  Frist: {
    chip: 'bg-rose-100 text-rose-800 border-rose-200',
    calendarEvent: 'bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200',
    timelineDot: 'bg-rose-500',
    timelineCard: 'border-rose-200 hover:border-rose-300',
  },
  Workshop: {
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    calendarEvent: 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200',
    timelineDot: 'bg-amber-500',
    timelineCard: 'border-amber-200 hover:border-amber-300',
  },
  Praktisk: {
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    calendarEvent: 'bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200',
    timelineDot: 'bg-emerald-500',
    timelineCard: 'border-emerald-200 hover:border-emerald-300',
  },
  Annet: {
    chip: 'bg-slate-100 text-slate-800 border-slate-200',
    calendarEvent: 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200',
    timelineDot: 'bg-slate-500',
    timelineCard: 'border-slate-200 hover:border-slate-300',
  },
};

type ViewMode = 'calendar' | 'timeline';
type TimelineSortMode = 'date' | 'category';
type TimelineEvent = {
  occurrenceId: string;
  sourceEventId: string;
  occurrenceDate: string;
  event: PreTripEvent;
};

function toLocalIsoDate(input: Date) {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const day = String(input.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfMonth(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), 1);
}

function formatDateLabel(iso?: string) {
  if (!iso) return 'Uten dato';
  const d = parseIsoDate(iso);
  if (!d) return 'Uten dato';
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonthLabel(input: Date) {
  return input.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' });
}

function dayKey(input: Date) {
  return toLocalIsoDate(input);
}

function addDays(input: Date, days: number) {
  const d = new Date(input);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(input: Date, months: number) {
  const d = new Date(input);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getEventType(eventType?: string) {
  if (!eventType || !EVENT_TYPE_THEME[eventType]) return 'Annet';
  return eventType;
}

function getEventTheme(eventType?: string) {
  return EVENT_TYPE_THEME[getEventType(eventType)];
}

function getCategoryRank(eventType?: string) {
  const normalized = getEventType(eventType);
  const idx = EVENT_TYPE_OPTIONS.indexOf(normalized);
  return idx >= 0 ? idx : EVENT_TYPE_OPTIONS.length;
}

function nextOccurrenceDate(
  dateIso: string,
  pattern: MinorEventRecurrencePattern,
  interval: number
) {
  const parsed = parseIsoDate(dateIso);
  if (!parsed) return null;
  const safeInterval = Math.max(1, interval || 1);
  if (pattern === 'daily') return toLocalIsoDate(addDays(parsed, safeInterval));
  if (pattern === 'weekly') return toLocalIsoDate(addDays(parsed, safeInterval * 7));
  return toLocalIsoDate(addMonths(parsed, safeInterval));
}

function expandOccurrencesForEvent(
  event: PreTripEvent,
  rangeStartIso: string,
  rangeEndIso: string
): TimelineEvent[] {
  if (!event.eventDate) return [];
  if (!event.isRecurring) {
    if (event.eventDate < rangeStartIso || event.eventDate > rangeEndIso) return [];
    return [
      {
        occurrenceId: `${event.id}__${event.eventDate}`,
        sourceEventId: event.id,
        occurrenceDate: event.eventDate,
        event,
      },
    ];
  }

  const pattern = event.recurrencePattern ?? 'weekly';
  const interval = Math.max(1, event.recurrenceInterval ?? 1);
  const untilIso = event.recurrenceUntil && event.recurrenceUntil < rangeEndIso
    ? event.recurrenceUntil
    : rangeEndIso;

  const expanded: TimelineEvent[] = [];
  let cursor = event.eventDate;
  let safety = 0;
  while (cursor <= untilIso && safety < 1000) {
    if (cursor >= rangeStartIso) {
      expanded.push({
        occurrenceId: `${event.id}__${cursor}`,
        sourceEventId: event.id,
        occurrenceDate: cursor,
        event,
      });
    }
    const next = nextOccurrenceDate(cursor, pattern, interval);
    if (!next || next <= cursor) break;
    cursor = next;
    safety += 1;
  }
  return expanded;
}

export function AdminTripPrepView() {
  const isAdmin = useStore(selectIsAdmin);
  const { preTripEvents, minorEvents, days, addPreTripEvent, updatePreTripEvent, removePreTripEvent, updateMinorEvent, removeMinorEvent } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState(toLocalIsoDate(new Date()));
  const [quickType, setQuickType] = useState(EVENT_TYPE_OPTIONS[0]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [timelineSortMode, setTimelineSortMode] = useState<TimelineSortMode>('date');
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(0);

  const todayDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const planningStartDate = useMemo(() => new Date(todayDate.getFullYear(), 0, 1), [todayDate]);

  const tripDate = useMemo(() => {
    const candidateDates = days
      .map((day) => parseIsoDate(day.date))
      .filter((v): v is Date => !!v)
      .sort((a, b) => a.getTime() - b.getTime());

    const fallback = parseIsoDate(FALLBACK_TRIP_DATE_ISO) ?? todayDate;
    const picked = candidateDates[0] ?? fallback;
    return picked < todayDate ? todayDate : picked;
  }, [days, todayDate]);

  const rangeStartIso = toLocalIsoDate(planningStartDate);
  const rangeEndIso = toLocalIsoDate(tripDate);
  const usingLegacyMinorEvents = preTripEvents.length === 0 && minorEvents.length > 0;
  const sourceEvents: Array<PreTripEvent | MinorEvent> = usingLegacyMinorEvents ? minorEvents : preTripEvents;

  const allOccurrencesInRange = useMemo(
    () =>
      sourceEvents
        .flatMap((event) => expandOccurrencesForEvent(event, rangeStartIso, rangeEndIso))
        .sort((a, b) => {
          if (a.occurrenceDate !== b.occurrenceDate) return a.occurrenceDate.localeCompare(b.occurrenceDate);
          return (a.event.title || '').localeCompare(b.event.title || '');
        }),
    [sourceEvents, rangeStartIso, rangeEndIso]
  );

  const eventsInRange = useMemo(
    () =>
      allOccurrencesInRange.filter((item) =>
        selectedCategory === 'all' ? true : getEventType(item.event.eventType) === selectedCategory
      ),
    [allOccurrencesInRange, selectedCategory]
  );

  const undatedEvents = useMemo(() => sourceEvents.filter((event) => !event.eventDate), [sourceEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof eventsInRange>();
    for (const event of eventsInRange) {
      const key = event.occurrenceDate;
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, event]);
    }
    return map;
  }, [eventsInRange]);

  const monthStarts = useMemo(() => {
    const months: Date[] = [];
    const current = startOfMonth(planningStartDate);
    const last = startOfMonth(tripDate);
    while (current <= last) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [planningStartDate, tripDate]);
  const maxCalendarMonthIndex = Math.max(0, monthStarts.length - 1);
  const safeCalendarMonthIndex = Math.min(calendarMonthIndex, maxCalendarMonthIndex);
  const activeCalendarMonth = monthStarts[safeCalendarMonthIndex];

  useEffect(() => {
    if (calendarMonthIndex > maxCalendarMonthIndex) setCalendarMonthIndex(maxCalendarMonthIndex);
  }, [calendarMonthIndex, maxCalendarMonthIndex]);

  const selectedEvent = sourceEvents.find((event) => event.id === selectedEventId) ?? null;
  const selectedEventSource: 'preTrip' | 'minor' | null = selectedEvent
    ? preTripEvents.some((e) => e.id === selectedEvent.id)
      ? 'preTrip'
      : 'minor'
    : null;
  const timelineDateGroups = useMemo(() => {
    const groups = new Map<string, typeof eventsInRange>();
    for (const event of eventsInRange) {
      const key = event.occurrenceDate;
      const current = groups.get(key) ?? [];
      groups.set(key, [...current, event]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [eventsInRange]);
  const timelineCategoryGroups = useMemo(() => {
    const groups = new Map<string, typeof eventsInRange>();
    for (const event of eventsInRange) {
      const key = getEventType(event.event.eventType);
      const current = groups.get(key) ?? [];
      groups.set(key, [...current, event]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => getCategoryRank(a) - getCategoryRank(b))
      .map(([category, list]) => [
        category,
        [...list].sort((a, b) => {
          if (a.occurrenceDate !== b.occurrenceDate) return a.occurrenceDate.localeCompare(b.occurrenceDate);
          return (a.event.title || '').localeCompare(b.event.title || '');
        }),
      ] as const);
  }, [eventsInRange]);

  const addPrepEvent = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    await addPreTripEvent();
    const created = useStore.getState().preTripEvents.at(-1);
    if (!created) return;
    await updatePreTripEvent(created.id, {
      title,
      eventDate: quickDate || undefined,
      eventType: quickType || undefined,
    });
    setQuickTitle('');
    setSelectedEventId(created.id);
  };

  useEffect(() => {
    if (!selectedEventId && sourceEvents.length > 0) {
      setSelectedEventId(sourceEvents[0].id);
    }
  }, [selectedEventId, sourceEvents]);

  const saveSelectedEvent = (data: Partial<PreTripEvent>) => {
    if (!selectedEvent || !selectedEventSource) return;
    if (selectedEventSource === 'preTrip') {
      updatePreTripEvent(selectedEvent.id, data);
    } else {
      updateMinorEvent(selectedEvent.id, data as Partial<MinorEvent>);
    }
  };

  const deleteSelectedEvent = () => {
    if (!selectedEvent || !selectedEventSource) return;
    if (!confirm('Slette denne hendelsen?')) return;
    if (selectedEventSource === 'preTrip') {
      removePreTripEvent(selectedEvent.id);
    } else {
      removeMinorEvent(selectedEvent.id);
    }
    setSelectedEventId(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="bg-white border border-royal/10 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Frem mot turen</h2>
          <p className="text-sm text-royal/60 mt-1">
            Planleggingsvindu: fra {formatDateLabel(rangeStartIso)} til turstart ({formatDateLabel(rangeEndIso)}).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Hva skal skje? (f.eks. adm.mote)"
            className="lg:col-span-2 w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={quickDate}
            max={rangeEndIso}
            onChange={(e) => setQuickDate(e.target.value)}
            className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2">
            <select
              value={quickType}
              onChange={(e) => setQuickType(e.target.value)}
              className="flex-1 border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
            >
              {EVENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addPrepEvent}
              className="shrink-0 flex items-center gap-2 bg-royal text-white px-3 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark"
            >
              <Plus size={14} /> Legg til
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 text-xs font-mono uppercase border ${
              viewMode === 'calendar' ? 'bg-royal text-white border-royal' : 'bg-white text-royal border-royal/20'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> Kalender
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-2 text-xs font-mono uppercase border ${
              viewMode === 'timeline' ? 'bg-royal text-white border-royal' : 'bg-white text-royal border-royal/20'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} /> Tidslinje
            </span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_OPTIONS.map((type) => {
            const theme = getEventTheme(type);
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase border ${theme.chip}`}
              >
                <span className={`h-2 w-2 rounded-full ${theme.timelineDot}`} />
                {type}
              </span>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase text-royal/50">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
            >
              <option value="all">Alle kategorier</option>
              {EVENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase text-royal/50">Sorter tidslinje</label>
            <select
              value={timelineSortMode}
              onChange={(e) => setTimelineSortMode(e.target.value as TimelineSortMode)}
              className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
            >
              <option value="date">Etter dato</option>
              <option value="category">Etter kategori</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {viewMode === 'calendar' ? (
            activeCalendarMonth ? (
              (() => {
              const monthStart = activeCalendarMonth;
              const year = monthStart.getFullYear();
              const month = monthStart.getMonth();
              const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: Array<Date | null> = [];

              for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
              for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

              return (
                <div key={dayKey(monthStart)} className="bg-white border border-royal/10 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCalendarMonthIndex((i) => Math.max(0, i - 1))}
                      disabled={safeCalendarMonthIndex <= 0}
                      className="inline-flex items-center justify-center h-8 w-8 border border-royal/20 text-royal hover:bg-royal/5 disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label="Forrige måned"
                      title="Forrige måned"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <h3 className="font-display font-bold text-lg text-royal uppercase">{formatMonthLabel(monthStart)}</h3>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthIndex((i) => Math.min(maxCalendarMonthIndex, i + 1))}
                      disabled={safeCalendarMonthIndex >= maxCalendarMonthIndex}
                      className="inline-flex items-center justify-center h-8 w-8 border border-royal/20 text-royal hover:bg-royal/5 disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label="Neste måned"
                      title="Neste måned"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] font-mono uppercase text-royal/50 mb-1">
                    {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'].map((name) => (
                      <div key={name} className="px-1 py-1">
                        {name}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((cell, idx) => {
                      if (!cell) return <div key={`empty-${idx}`} className="min-h-24 bg-transparent" />;
                      const iso = dayKey(cell);
                      const inRange = iso >= rangeStartIso && iso <= rangeEndIso;
                      const dayEvents = eventsByDate.get(iso) ?? [];
                      return (
                        <div
                          key={iso}
                          className={`min-h-24 border p-1.5 ${
                            inRange ? 'border-royal/10 bg-white' : 'border-royal/5 bg-royal/[0.02] opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-royal/60">{cell.getDate()}</span>
                            {dayEvents.length > 0 && (
                              <span className="text-[10px] font-mono text-royal/50">{dayEvents.length}</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {[...dayEvents]
                              .sort((a, b) => {
                                const categoryDiff = getCategoryRank(a.event.eventType) - getCategoryRank(b.event.eventType);
                                if (categoryDiff !== 0) return categoryDiff;
                                return (a.event.title || '').localeCompare(b.event.title || '');
                              })
                              .slice(0, 3)
                              .map((event) => {
                              const theme = getEventTheme(event.event.eventType);
                              const text = event.event.title || 'Uten tittel';
                              return (
                                <button
                                  key={event.occurrenceId}
                                  type="button"
                                  onClick={() => setSelectedEventId(event.sourceEventId)}
                                  title={`${text} (${getEventType(event.event.eventType)})`}
                                  className={`w-full text-left text-[10px] px-1.5 py-1 border truncate ${theme.calendarEvent}`}
                                >
                                  {text}
                                  {event.event.isRecurring ? ' (R)' : ''}
                                </button>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] text-royal/50 font-mono">+{dayEvents.length - 3} flere</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })()
            ) : null
          ) : (
            <div className="bg-white border border-royal/10 p-5 shadow-sm">
              <h3 className="font-display font-bold text-lg text-royal uppercase mb-4">Tidslinje frem mot turen</h3>
              {eventsInRange.length === 0 ? (
                <p className="text-sm text-royal/60">Ingen datofestede hendelser i perioden ennå.</p>
              ) : (
                <div className="relative pl-10">
                  <div className="absolute left-3 top-1 bottom-1 w-px bg-royal/20" />
                  <div className="space-y-6">
                    {timelineSortMode === 'date' &&
                      timelineDateGroups.map(([date, events]) => (
                        <div key={date} className="relative">
                          <div className="absolute -left-10 top-1.5 h-6 w-6 rounded-full bg-royal text-white flex items-center justify-center">
                            <Flag size={12} />
                          </div>
                          <p className="font-mono text-xs uppercase text-royal/50 mb-2">{formatDateLabel(date)}</p>
                          <div className="space-y-2">
                            {events.map((event) => {
                              const theme = getEventTheme(event.event.eventType);
                              return (
                                <button
                                  key={event.occurrenceId}
                                  type="button"
                                  onClick={() => setSelectedEventId(event.sourceEventId)}
                                  className={`w-full text-left border p-3 border-l-4 ${theme.timelineCard}`}
                                >
                                  <div className="min-w-0">
                                    <p className="font-display font-bold text-royal">
                                      {event.event.title || 'Uten tittel'}
                                      {event.event.isRecurring ? ' (R)' : ''}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase border ${theme.chip}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${theme.timelineDot}`} />
                                        {getEventType(event.event.eventType)}
                                      </span>
                                      <span className="text-xs text-royal/50">{formatDateLabel(event.occurrenceDate)}</span>
                                      {event.event.location && <span className="text-xs text-royal/60">{event.event.location}</span>}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    {timelineSortMode === 'category' &&
                      timelineCategoryGroups.map(([category, events]) => {
                        const theme = getEventTheme(category);
                        return (
                          <div key={category} className="relative">
                            <div className={`absolute -left-10 top-1.5 h-6 w-6 rounded-full text-white flex items-center justify-center ${theme.timelineDot}`}>
                              <Flag size={12} />
                            </div>
                            <p className="font-mono text-xs uppercase text-royal/50 mb-2">{category}</p>
                            <div className="space-y-2">
                              {events.map((event) => (
                                <button
                                  key={event.occurrenceId}
                                  type="button"
                                  onClick={() => setSelectedEventId(event.sourceEventId)}
                                  className={`w-full text-left border p-3 border-l-4 ${theme.timelineCard}`}
                                >
                                  <div className="min-w-0">
                                    <p className="font-display font-bold text-royal">
                                      {event.event.title || 'Uten tittel'}
                                      {event.event.isRecurring ? ' (R)' : ''}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase border ${theme.chip}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${theme.timelineDot}`} />
                                        {category}
                                      </span>
                                      <span className="text-xs text-royal/50">{formatDateLabel(event.occurrenceDate)}</span>
                                      {event.event.location && <span className="text-xs text-royal/60">{event.event.location}</span>}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {undatedEvents.length > 0 && (
            <div className="bg-white border border-royal/10 p-5 shadow-sm">
              <h3 className="font-display font-bold text-lg text-royal uppercase mb-3">Uten dato</h3>
              <div className="space-y-2">
                {undatedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className="w-full text-left border border-royal/10 hover:border-royal/30 p-3"
                  >
                    <p className="font-display font-bold text-royal">{event.title || 'Uten tittel'}</p>
                    <p className="text-xs font-mono text-royal/50">{event.eventType || 'Annet'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-royal/10 p-5 shadow-sm h-fit">
          <h3 className="font-display font-bold text-lg text-royal uppercase mb-4">Valgt hendelse</h3>
          {!selectedEvent ? (
            <p className="text-sm text-royal/60">Velg en hendelse fra kalenderen eller tidslinjen for å redigere.</p>
          ) : (
            <div className="space-y-3" key={selectedEvent.id}>
              <div>
                <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Tittel</label>
                <input
                  value={selectedEvent.title}
                  onChange={(e) => saveSelectedEvent({ title: e.target.value })}
                  className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Dato</label>
                <input
                  type="date"
                  max={rangeEndIso}
                  value={selectedEvent.eventDate ?? ''}
                  onChange={(e) =>
                    saveSelectedEvent({
                      eventDate: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Type</label>
                <select
                  value={selectedEvent.eventType ?? ''}
                  onChange={(e) => saveSelectedEvent({ eventType: e.target.value || undefined })}
                  className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
                >
                  <option value="">Velg type</option>
                  {EVENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border border-royal/10 p-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono uppercase text-royal/80">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedEvent.isRecurring)}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      saveSelectedEvent({
                        isRecurring: enabled,
                        recurrencePattern: enabled ? (selectedEvent.recurrencePattern ?? 'weekly') : selectedEvent.recurrencePattern,
                        recurrenceInterval: enabled ? (selectedEvent.recurrenceInterval ?? 1) : selectedEvent.recurrenceInterval,
                        recurrenceUntil: enabled ? (selectedEvent.recurrenceUntil ?? rangeEndIso) : selectedEvent.recurrenceUntil,
                      });
                    }}
                    className="accent-royal"
                  />
                  Repeterende hendelse
                </label>
                {selectedEvent.isRecurring && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={selectedEvent.recurrencePattern ?? 'weekly'}
                      onChange={(e) =>
                        saveSelectedEvent({
                          recurrencePattern: e.target.value as MinorEventRecurrencePattern,
                        })
                      }
                      className="border border-royal/20 focus:border-royal bg-white px-2 py-2 text-sm"
                    >
                      <option value="daily">Hver dag</option>
                      <option value="weekly">Hver uke</option>
                      <option value="monthly">Hver mnd</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={selectedEvent.recurrenceInterval ?? 1}
                      onChange={(e) =>
                        saveSelectedEvent({
                          recurrenceInterval: Math.max(1, Number.parseInt(e.target.value || '1', 10)),
                        })
                      }
                      className="border border-royal/20 focus:border-royal bg-white px-2 py-2 text-sm font-mono"
                      title="Intervall"
                    />
                    <input
                      type="date"
                      value={selectedEvent.recurrenceUntil ?? rangeEndIso}
                      min={selectedEvent.eventDate ?? rangeStartIso}
                      max={rangeEndIso}
                      onChange={(e) =>
                        saveSelectedEvent({
                          recurrenceUntil: e.target.value || rangeEndIso,
                        })
                      }
                      className="border border-royal/20 focus:border-royal bg-white px-2 py-2 text-sm font-mono"
                      title="Repeter til"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Sted</label>
                <input
                  value={selectedEvent.location ?? ''}
                  onChange={(e) => saveSelectedEvent({ location: e.target.value || undefined })}
                  className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm"
                  placeholder="Valgfritt"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-royal/40 block mb-1">Notater</label>
                <textarea
                  value={selectedEvent.notes ?? ''}
                  onChange={(e) => saveSelectedEvent({ notes: e.target.value })}
                  className="w-full border border-royal/20 focus:border-royal bg-white px-3 py-2 text-sm min-h-24"
                  placeholder="Kort notat om forberedelser"
                />
              </div>
              <button
                type="button"
                onClick={deleteSelectedEvent}
                className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 text-xs font-mono uppercase"
              >
                <Trash2 size={14} /> Slett hendelse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
