import { useState, useRef } from 'react';
import { useStore } from '../store';
import type { TripDay, ActivityOption, Signup } from '../types';
import { Lock, Unlock, LogOut, Trash2, Plus, Edit2, Save, Clock, MapPin, Bus, GripVertical, Bell, Users, Calendar, ClipboardList, Book, MessageCircle, Camera, ArrowUpRight, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

export function AdminView() {
  const { 
    isAdmin, loginAdmin, activities, signups, users, days, feedbacks,
    adminRemoveUser, adminToggleDayLock,
    updateDay, updateScheduleItem, addScheduleItem, removeScheduleItem,
    updateActivity, addActivity, removeActivity,
    addDay, removeDay, updateSignupStatus,
    reorderDays, reorderActivities, reorderScheduleItems,
    addUser, removeUser, updateUser, importParticipants, removeAllUsers,
    exportAdminData, exportAllData
  } = useStore();
  
  const [password, setPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [error, setError] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<{dayId: string, idx: number} | null>(null);

  const normalizedSearch = participantSearch.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) return true;
    const haystack = [
      user.fullName,
      user.displayName,
      user.email,
      user.phone,
      user.birthDate,
      String(user.age ?? '')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const contentPages = [
    { title: 'Oppslagstavle', icon: Bell, path: '/noticeboard' },
    { title: 'Grupper', icon: Users, path: '/groups' },
    { title: 'Dagens Planer', icon: Calendar, path: '/todays-plans' },
    { title: 'Pakkeliste', icon: ClipboardList, path: '/packing-list' },
    { title: 'Regler', icon: Book, path: '/rules' },
    { title: 'Feedback', icon: MessageCircle, path: '/feedback?mode=admin', badge: feedbacks.length > 0 ? feedbacks.length : undefined },
    { title: 'Photodrop', icon: Camera, path: '/photodrop' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAdmin(password)) {
      setError(true);
    }
  };

  const parseBirthDate = (value: unknown) => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${parsed.y}-${month}-${day}`;
      }
      return undefined;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parts = trimmed.split(/[.\-/]/).map((part) => part.trim());
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const [year, month, day] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        const [day, month, year] = parts;
        if (year.length === 4) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    return undefined;
  };

  const calculateAge = (birthDate?: string, fallbackAge?: number) => {
    if (!birthDate) return fallbackAge ?? '';
    const [year, month, day] = birthDate.split('-').map((part) => Number(part));
    if (!year || !month || !day) return fallbackAge ?? '';
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasHadBirthday) age -= 1;
    return age;
  };

  const formatNameFromImport = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return '';
    if (!trimmed.includes(',')) return trimmed;
    const [surname, firstNames] = trimmed.split(',').map((part) => part.trim());
    if (!surname) return firstNames;
    if (!firstNames) return surname;
    return `${firstNames} ${surname}`;
  };

  const normalizeHeader = (header: string) =>
    header
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const getColumnIndex = (headers: string[], options: string[]) => {
    const normalized = headers.map(normalizeHeader);
    for (const option of options) {
      const idx = normalized.indexOf(normalizeHeader(option));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const getIndexOrFallback = (headers: string[], options: string[], fallbackIndex: number) => {
    const idx = getColumnIndex(headers, options);
    return idx === -1 ? fallbackIndex : idx;
  };

  const parseDelimitedText = (text: string, delimiter: string) => {
    const rows: Array<Array<string>> = [];
    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && nextChar === '"') {
          current += '"';
          i += 1;
          continue;
        }

        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }

        if (char === delimiter && !inQuotes) {
          row.push(current);
          current = '';
          continue;
        }

        current += char;
      }

      row.push(current);
      rows.push(row);
    }

    return rows;
  };

  const handleImportFile = async (file: File) => {
    setImportError(null);
    let rows: Array<Array<unknown>> = [];

    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || '';
      const delimiter = firstLine.includes(';') ? ';' : ',';
      rows = parseDelimitedText(text, delimiter);
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as Array<Array<unknown>>;
    }

    if (!rows.length) {
      setImportError('Filen er tom.');
      return;
    }

    const headers = rows[0].map((value, index) => {
      const raw = String(value || '');
      const cleaned = index === 0 ? raw.replace(/^\uFEFF/, '') : raw;
      return cleaned.trim();
    });
    const nameIndex = getIndexOrFallback(headers, ['Navn', 'Name'], 0);
    const ageIndex = getIndexOrFallback(headers, ['Alder', 'Age'], 1);
    const birthDateIndex = getColumnIndex(headers, [
      'Fødselsdato',
      'Foedselsdato',
      'Fodselsdato',
      'F�dselsdato',
      'Fdselsdato',
      'Birthdate',
      'DateOfBirth',
      'Dob'
    ]);
    const phoneIndex = getIndexOrFallback(headers, ['Mobiltelefon', 'Telefon', 'Phone', 'Mobile'], 3);
    const emailIndex = getIndexOrFallback(headers, ['Epostadresse', 'E-postadresse', 'Epost', 'Email', 'E-mail'], 4);

    const participants = rows.slice(1).map((row) => {
      const hasAnyData = row.some((value) => String(value || '').trim() !== '');
      if (!hasAnyData) return null;

      const rawName = String(row[nameIndex] || '').trim();
      const fullName = formatNameFromImport(rawName);
      if (!fullName) return null;

      const birthDate = birthDateIndex !== -1 ? parseBirthDate(row[birthDateIndex]) : undefined;
      const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim() || undefined : undefined;
      const phone = phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() || undefined : undefined;
      const ageValue = ageIndex !== -1 ? Number(String(row[ageIndex] || '').trim()) : undefined;
      const age = Number.isFinite(ageValue) ? ageValue : undefined;
      return {
        fullName,
        displayName: fullName,
        email,
        phone,
        birthDate: birthDate || undefined,
        age
      };
    }).filter((participant): participant is NonNullable<typeof participant> => Boolean(participant));

    if (participants.length === 0) {
      setImportError('Fant ingen deltakere å importere.');
      return;
    }

    await importParticipants(participants);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border-2 border-royal p-8 shadow-xl">
          <div className="flex justify-center mb-6 text-royal">
            <Lock size={48} strokeWidth={1.5} />
          </div>
          <h1 className="font-display font-bold text-2xl text-center text-royal uppercase mb-2">
            Admin Tilgang
          </h1>
          <p className="font-mono text-xs text-center text-royal/60 mb-8 uppercase tracking-widest">
            Kun for reiseledere
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passord..."
                className="w-full bg-paper border-b-2 border-royal/20 focus:border-royal outline-none py-2 px-1 font-mono text-royal text-center"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs text-center font-mono uppercase">Feil passord</p>
            )}
            <button 
              type="submit"
              className="w-full bg-royal text-white font-mono uppercase text-xs font-bold py-3 hover:bg-royal-dark transition-colors"
            >
              Logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // EDITABLE COMPONENTS
  // ---------------------------------------------------------------------------

  const EditableDay = ({ day, index }: { day: TripDay, index: number }) => {
    const isEditing = editingDayId === day.id;

    if (!isEditing) {
      return (
        <div 
            className={clsx(
                "bg-white border border-royal/10 p-6 shadow-sm group relative",
                draggedDayId === day.id ? "opacity-50" : "opacity-100"
            )}
            draggable
            onDragStart={(e) => {
                setDraggedDayId(day.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
                e.preventDefault(); // Necessary for drop
            }}
            onDrop={(e) => {
                e.preventDefault();
                if (!draggedDayId || draggedDayId === day.id) return;
                const fromIndex = days.findIndex(d => d.id === draggedDayId);
                const toIndex = index;
                reorderDays(fromIndex, toIndex);
                setDraggedDayId(null);
            }}
            onDragEnd={() => setDraggedDayId(null)}
        >
            <div className="absolute top-2 left-2 cursor-move text-royal/20 hover:text-royal/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} />
            </div>
            
            <div className="flex justify-between items-start mb-4 pl-6">
                <div>
                    <h3 className="font-display font-bold text-xl text-royal uppercase">{day.title}</h3>
                    <p className="font-mono text-xs text-royal/60">{day.date} • {day.isChoiceDay ? 'Valgfri Dag' : 'Felles Dag'}</p>
                    <p className="text-sm text-royal/80 mt-2">{day.description}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => adminToggleDayLock(day.id)}
                        className={clsx(
                            "p-2 rounded hover:bg-royal/5",
                            day.isLocked ? "text-red-500" : "text-royal/40"
                        )}
                        title={day.isLocked ? "Lås opp" : "Lås"}
                    >
                        {day.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button 
                        onClick={() => setEditingDayId(day.id)}
                        className="p-2 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 border-l-2 border-royal/10 pl-4">
                {day.scheduleItems.map((item, i) => (
                    <div key={i} className="flex gap-4 text-sm">
                        <span className="font-mono font-bold text-royal/60 w-12">{item.time}</span>
                        <div className="flex-1">
                            <span className="font-bold text-royal">{item.activity}</span>
                            {item.location && <span className="text-royal/50 ml-2 font-mono text-xs uppercase"><MapPin size={10} className="inline mr-1"/>{item.location}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
    }

    // EDIT MODE
    return (
      <div className="bg-white border-2 border-royal p-6 shadow-md relative">
        <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setEditingDayId(null)} className="p-2 text-green-600 hover:bg-green-50 rounded bg-green-50/50">
                <Save size={20} />
            </button>
        </div>

        <div className="space-y-4 mb-6 pr-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Tittel</label>
                    <input 
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-lg text-royal"
                        defaultValue={day.title}
                        onBlur={e => updateDay(day.id, { title: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Dato</label>
                    <input 
                        type="date"
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                        defaultValue={day.date}
                        onBlur={e => updateDay(day.id, { date: e.target.value })}
                    />
                </div>
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-royal/40">Beskrivelse</label>
                <textarea 
                    className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm"
                    rows={2}
                    defaultValue={day.description}
                    onBlur={e => updateDay(day.id, { description: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-2">
                <input 
                    type="checkbox"
                    id={`choice-${day.id}`}
                    checked={day.isChoiceDay}
                    onChange={e => updateDay(day.id, { isChoiceDay: e.target.checked })}
                    className="accent-royal"
                />
                <label htmlFor={`choice-${day.id}`} className="text-xs font-mono uppercase text-royal/80">
                    Er dette en valgfri aktivitetsdag?
                </label>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-royal/40 block mb-2">Tidsplan (Dra for å endre rekkefølge)</label>
            {day.scheduleItems.map((item, idx) => (
                <div 
                    key={idx} 
                    className={clsx(
                        "flex gap-2 items-start group relative pl-6",
                        draggedItemId?.dayId === day.id && draggedItemId.idx === idx ? "opacity-50" : "opacity-100"
                    )}
                    draggable
                    onDragStart={(e) => {
                        setDraggedItemId({ dayId: day.id, idx });
                        e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (!draggedItemId || draggedItemId.dayId !== day.id || draggedItemId.idx === idx) return;
                        reorderScheduleItems(day.id, draggedItemId.idx, idx);
                        setDraggedItemId(null);
                    }}
                    onDragEnd={() => setDraggedItemId(null)}
                >
                    <div className="absolute left-0 top-2 cursor-move text-royal/20 hover:text-royal/60">
                        <GripVertical size={14} />
                    </div>
                    <input 
                        className="w-16 border-b border-royal/10 focus:border-royal bg-transparent font-mono text-xs py-1"
                        defaultValue={item.time}
                        onBlur={e => updateScheduleItem(day.id, idx, { time: e.target.value })}
                        placeholder="00:00"
                    />
                    <div className="flex-1 space-y-1">
                        <input 
                            className="w-full border-b border-royal/10 focus:border-royal bg-transparent font-bold text-sm py-1"
                            defaultValue={item.activity}
                            onBlur={e => updateScheduleItem(day.id, idx, { activity: e.target.value })}
                            placeholder="Aktivitet..."
                        />
                         <input 
                            className="w-full border-b border-royal/10 focus:border-royal bg-transparent font-mono text-[10px] text-royal/60 py-1"
                            defaultValue={item.location || ''}
                            onBlur={e => updateScheduleItem(day.id, idx, { location: e.target.value })}
                            placeholder="Sted (valgfritt)"
                        />
                    </div>
                    <button 
                        onClick={() => removeScheduleItem(day.id, idx)}
                        className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button 
                onClick={() => addScheduleItem(day.id)}
                className="text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1 mt-2"
            >
                <Plus size={12} /> Legg til punkt
            </button>
        </div>
      </div>
    );
  };

  const EditableActivity = ({ activity, index }: { activity: ActivityOption, index: number }) => {
    const isEditing = editingActivityId === activity.id;
    const signupsForActivity = signups.filter(s => s.activityId === activity.id);

    if (!isEditing) {
        return (
            <div 
                className={clsx(
                    "bg-white border border-royal/10 p-6 shadow-sm relative group",
                    draggedActivityId === activity.id ? "opacity-50" : "opacity-100"
                )}
                draggable
                onDragStart={(e) => {
                    setDraggedActivityId(activity.id);
                    e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedActivityId || draggedActivityId === activity.id) return;
                    const fromIndex = activities.findIndex(a => a.id === draggedActivityId);
                    const toIndex = index;
                    reorderActivities(fromIndex, toIndex);
                    setDraggedActivityId(null);
                }}
                onDragEnd={() => setDraggedActivityId(null)}
            >
                <div className="absolute top-2 left-2 cursor-move text-royal/20 hover:text-royal/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <GripVertical size={16} />
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                        onClick={() => setEditingActivityId(activity.id)}
                        className="p-2 text-royal/40 hover:text-royal hover:bg-royal/5 rounded"
                    >
                        <Edit2 size={16} />
                    </button>
                    {/* Only show delete if no signups? Or warn? For simplicity just allow delete but maybe icon is scary */}
                    <button 
                         onClick={() => {
                            if (confirm('Er du sikker? Dette vil slette aktiviteten og alle påmeldinger.')) {
                                removeActivity(activity.id);
                            }
                         }}
                        className="p-2 text-royal/20 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="mb-4 pr-12">
                    <h3 className="font-display font-bold text-lg text-royal uppercase">{activity.title}</h3>
                    <div className="flex gap-4 text-xs font-mono text-royal/60 mt-1 uppercase">
                         <span className="flex items-center gap-1"><Clock size={12}/> {activity.timeStart}-{activity.timeEnd}</span>
                         <span className="flex items-center gap-1"><MapPin size={12}/> {activity.location}</span>
                         <span className="flex items-center gap-1"><Bus size={12}/> {activity.transport}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="text-sm">
                        <span className="font-bold text-royal">{signupsForActivity.length}</span>
                        <span className="text-royal/60"> / {activity.capacityMax} påmeldte</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-royal p-6 shadow-md relative">
             <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setEditingActivityId(null)} className="p-2 text-green-600 hover:bg-green-50 rounded bg-green-50/50">
                    <Save size={20} />
                </button>
            </div>

            <div className="space-y-4 pr-12">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Tittel</label>
                    <input 
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-lg text-royal"
                        defaultValue={activity.title}
                        onBlur={e => updateActivity(activity.id, { title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-royal/40">Start</label>
                        <input 
                            type="time"
                            className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                            defaultValue={activity.timeStart}
                            onBlur={e => updateActivity(activity.id, { timeStart: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-royal/40">Slutt</label>
                        <input 
                            type="time"
                            className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                            defaultValue={activity.timeEnd}
                            onBlur={e => updateActivity(activity.id, { timeEnd: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-royal/40">Sted</label>
                        <input 
                            className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                            defaultValue={activity.location}
                            onBlur={e => updateActivity(activity.id, { location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-royal/40">Kapasitet</label>
                        <input 
                            type="number"
                            className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm"
                            defaultValue={activity.capacityMax}
                            onBlur={e => updateActivity(activity.id, { capacityMax: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                     <label className="text-[10px] font-mono uppercase text-royal/40">Transport</label>
                     <input 
                        className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm"
                        defaultValue={activity.transport}
                        onBlur={e => updateActivity(activity.id, { transport: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-royal/40">Beskrivelse</label>
                    <textarea 
                        className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm"
                        rows={2}
                        defaultValue={activity.description}
                        onBlur={e => updateActivity(activity.id, { description: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
  };

  // DASHBOARD LAYOUT
  return (
    <div className="min-h-screen bg-paper selection:bg-royal selection:text-white pb-32">
      {/* Admin Header */}
      <div className="bg-royal text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-white text-royal font-bold font-mono px-2 py-1 text-xs rounded-sm">ADMIN</div>
          <h1 className="font-display font-bold text-xl uppercase tracking-tight hidden md:block">Tur Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
            <Link to="/" className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase">
                <ArrowUpRight size={16} /> Til Appen
            </Link>
            <button 
            onClick={() => window.location.reload()} 
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
            >
            <LogOut size={16} /> Logg ut
            </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-royal/10 shadow-sm">
            <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Totalt Påmeldte</h3>
            <p className="font-display font-bold text-4xl text-royal">{signups.length}</p>
          </div>
          <div className="bg-white p-6 border border-royal/10 shadow-sm">
             <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Deltakere</h3>
             <p className="font-display font-bold text-4xl text-royal">{users.length}</p>
          </div>
          <div className="bg-white p-6 border border-royal/10 shadow-sm">
             <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Aktiviteter</h3>
             <p className="font-display font-bold text-4xl text-royal">{activities.length}</p>
          </div>
        </div>

        {/* SECTION: EKSPORT */}
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-royal pb-2">
                <h2 className="font-display font-bold text-2xl text-royal uppercase">
                    Eksport
                </h2>
                <button
                    onClick={exportAllData}
                    className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors"
                >
                    <Download size={14} /> Last ned alt (JSON)
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                    onClick={() => exportAdminData('users')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Deltakere (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('days')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Program (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('activities')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Aktiviteter (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('signups')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Påmeldinger (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('infoPages')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Innholdssider (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('feedbacks')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Feedback (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('quotes')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Quotes (CSV)
                </button>
                <button
                    onClick={() => exportAdminData('photos')}
                    className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
                >
                    Photodrop (CSV)
                </button>
            </div>
        </div>

        {/* SECTION: INFO SIDE REDIGERING */}
        <div className="space-y-6">
             <div className="flex justify-between items-end border-b-2 border-royal pb-2">
                <h2 className="font-display font-bold text-2xl text-royal uppercase">
                    Administrer Innhold
                </h2>
            </div>
            <p className="text-royal/60 text-sm max-w-2xl">
                Klikk på en side for å gå til den og redigere innholdet. Se etter blyant-ikonet øverst til høyre på hver side.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contentPages.map((page) => (
                    <Link 
                        key={page.path}
                        to={page.path}
                        className="bg-white p-4 border border-royal/10 hover:border-royal/40 hover:shadow-md transition-all group flex flex-col items-center justify-center text-center gap-2 h-32 relative"
                    >
                        {page.badge && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                {page.badge}
                            </span>
                        )}
                        <page.icon className="text-royal/40 group-hover:text-royal transition-colors" size={24} />
                        <span className="font-mono text-xs uppercase tracking-widest text-royal">{page.title}</span>
                    </Link>
                ))}
            </div>
        </div>

        {/* SECTION: DELTAKERE */}
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-royal pb-2">
                <h2 className="font-display font-bold text-2xl text-royal uppercase">
                    Administrer Deltakere
                </h2>
                <div className="flex gap-2 items-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                handleImportFile(file);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 border border-royal/20 text-royal px-4 py-2 text-xs font-mono uppercase font-bold hover:border-royal/60 transition-colors"
                    >
                        <Upload size={14} /> Importer
                    </button>
                    <button
                        onClick={() => {
                            if (users.length === 0) return;
                            if (confirm('Er du sikker på at du vil slette alle deltakere?')) {
                                removeAllUsers();
                            }
                        }}
                        className="flex items-center gap-2 border border-red-300 text-red-500 px-4 py-2 text-xs font-mono uppercase font-bold hover:border-red-500 hover:text-red-600 transition-colors"
                    >
                        Slett alle
                    </button>
                     <input 
                        className="w-48 border-b border-royal/20 bg-transparent text-sm py-1 focus:border-royal outline-none"
                        placeholder="Navn på ny deltaker..."
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newUserName.trim()) {
                                addUser(newUserName);
                                setNewUserName('');
                            }
                        }}
                    />
                    <button 
                        disabled={!newUserName.trim()}
                        onClick={() => {
                            addUser(newUserName);
                            setNewUserName('');
                        }}
                        className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors disabled:opacity-50"
                    >
                        <Plus size={14} /> Legg til
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {importError && (
                <div className="text-red-500 text-xs font-mono uppercase">
                    {importError}
                </div>
                )}
                <input
                    className="w-full md:w-72 border-b border-royal/20 bg-transparent text-sm py-1 focus:border-royal outline-none"
                    placeholder="Søk etter deltaker..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                />
            </div>
            <div className="bg-white border border-royal/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-royal/5 font-mono text-[10px] uppercase text-royal/60 sticky top-0 z-10">
                            <tr>
                                <th className="py-3 pl-6">Navn</th>
                                <th className="py-3">E-post</th>
                                <th className="py-3">Telefon</th>
                                <th className="py-3">Fødselsdato</th>
                                <th className="py-3">Alder</th>
                                <th className="py-3">Rolle</th>
                                <th className="py-3 text-right pr-6">Handling</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-royal/5 group">
                                    <td className="py-3 pl-6 font-medium text-royal">
                                        {user.fullName}
                                    </td>
                                    <td className="py-3 text-royal/80">
                                        <input
                                            className="bg-transparent border-b border-transparent focus:border-royal outline-none w-full"
                                            defaultValue={user.email || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (user.email || '')) {
                                                    updateUser(user.id, { email: e.target.value });
                                                }
                                            }}
                                            placeholder="E-post"
                                            type="email"
                                        />
                                    </td>
                                    <td className="py-3 text-royal/80">
                                        <input
                                            className="bg-transparent border-b border-transparent focus:border-royal outline-none w-full"
                                            defaultValue={user.phone || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (user.phone || '')) {
                                                    updateUser(user.id, { phone: e.target.value });
                                                }
                                            }}
                                            placeholder="Telefon"
                                            type="tel"
                                        />
                                    </td>
                                    <td className="py-3 text-royal/80">
                                        <input
                                            className="bg-transparent border-b border-transparent focus:border-royal outline-none w-32"
                                            defaultValue={user.birthDate || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (user.birthDate || '')) {
                                                    updateUser(user.id, { birthDate: e.target.value || undefined });
                                                }
                                            }}
                                            placeholder="YYYY-MM-DD"
                                            type="date"
                                        />
                                    </td>
                                    <td className="py-3 text-royal/80 font-mono text-xs">
                                        {calculateAge(user.birthDate, user.age)}
                                    </td>
                                    <td className="py-3 font-mono text-xs text-royal/60 uppercase">
                                        {user.role}
                                    </td>
                                    <td className="py-3 text-right pr-6">
                                        <button 
                                            onClick={() => {
                                                if(confirm(`Er du sikker på at du vil slette ${user.fullName}?`)) {
                                                    removeUser(user.id);
                                                }
                                            }}
                                            className="text-royal/20 hover:text-red-500 transition-colors p-1"
                                            title="Slett deltaker"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-royal/40 italic">
                                        Ingen deltakere funnet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* SECTION: PROGRAM REDIGERING */}
        <div className="space-y-6">
             <div className="flex justify-between items-end border-b-2 border-royal pb-2">
                <h2 className="font-display font-bold text-2xl text-royal uppercase">
                    Rediger Program
                </h2>
                <button 
                    onClick={addDay}
                    className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors"
                >
                    <Plus size={14} /> Ny Dag
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {days.map((day, index) => (
                    <div key={day.id} className="relative group">
                        <EditableDay day={day} index={index} />
                        {!editingDayId && (
                            <button
                                onClick={() => {
                                    if(confirm('Sikker på at du vil slette denne dagen?')) {
                                        removeDay(day.id);
                                    }
                                }}
                                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Slett dag"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* SECTION: AKTIVITETER */}
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-royal pb-2">
                <h2 className="font-display font-bold text-2xl text-royal uppercase">
                    Administrer Aktiviteter
                </h2>
                <button 
                    onClick={addActivity}
                    className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors"
                >
                    <Plus size={14} /> Ny Aktivitet
                </button>
            </div>
            
            <p className="text-royal/60 text-sm max-w-2xl">
                Disse aktivitetene vises på dager markert som "Valgfri Dag". Husk å sette kapasitet.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity, index) => (
                    <EditableActivity key={activity.id} activity={activity} index={index} />
                ))}
            </div>
        </div>

        {/* SECTION: PÅMELDINGSLISTER (KEEPING EXISTING TABLE VIEW) */}
        <div className="space-y-6 pt-12 border-t border-royal/10">
          <h2 className="font-display font-bold text-2xl text-royal uppercase border-b-2 border-royal pb-2">
            Påmeldingslister
          </h2>

          <div className="grid grid-cols-1 gap-8">
            {activities.map(activity => {
              const activitySignups = signups.filter(s => s.activityId === activity.id);
              const isFull = activitySignups.length >= activity.capacityMax;

              return (
                <div key={activity.id} className="bg-white border border-royal/10 p-6 shadow-sm">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-royal/10 pb-4">
                    <div>
                      <h3 className="font-display font-bold text-xl text-royal uppercase">{activity.title}</h3>
                      <p className="font-mono text-xs text-royal/60 mt-1 uppercase">
                        {activity.timeStart} - {activity.timeEnd} • {activity.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={clsx(
                          "font-mono text-sm font-bold block",
                          isFull ? "text-red-500" : "text-green-600"
                        )}>
                          {activitySignups.length} / {activity.capacityMax}
                        </span>
                        <span className="text-[10px] uppercase text-royal/40 font-mono">Kapasitet</span>
                      </div>
                      <div className={clsx("w-3 h-3 rounded-full", isFull ? "bg-red-500" : "bg-green-500")}></div>
                    </div>
                  </div>

                  {/* List */}
                  {activitySignups.length === 0 ? (
                    <p className="text-sm text-royal/40 italic">Ingen påmeldte.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="font-mono text-[10px] uppercase text-royal/40 border-b border-royal/5">
                          <tr>
                            <th className="pb-2 pl-2">Navn</th>
                            <th className="pb-2">Rolle</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right pr-2">Handling</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-royal/5">
                          {activitySignups.map(signup => {
                            const user = users.find(u => u.id === signup.userId);
                            if (!user) return null;
                            return (
                              <tr key={signup.userId} className="hover:bg-royal/5">
                                <td className="py-2 pl-2 font-medium text-royal">
                                  {user.fullName} {/* Full name for admin */}
                                </td>
                                <td className="py-2 text-royal/60 text-xs">
                                  {user.role}
                                </td>
                                <td className="py-2">
                                  <select 
                                    value={signup.status}
                                    onChange={(e) => updateSignupStatus(activity.id, user.id, e.target.value as Signup['status'])}
                                    className="bg-transparent text-xs uppercase font-mono border-none focus:ring-0 cursor-pointer"
                                  >
                                    <option value="confirmed">Confirmed</option>
                                    <option value="waitlist">Waitlist</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                                <td className="py-2 text-right pr-2">
                                  <button 
                                    onClick={() => adminRemoveUser(user.id, activity.id)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    title="Meld av"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
