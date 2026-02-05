import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import type { TripDay } from '../types';
import { Lock as LockIcon, Unlock, Edit2, Save, MapPin, GripVertical, Plus, Trash2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export function AdminProgramView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    days,
    updateDay,
    updateScheduleItem,
    addScheduleItem,
    removeScheduleItem,
    addDay,
    removeDay,
    reorderDays,
    reorderScheduleItems,
    adminToggleDayLock,
  } = useStore();

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<{ dayId: string; idx: number } | null>(null);

  const EditableDay = ({ day, index }: { day: TripDay; index: number }) => {
    const isEditing = editingDayId === day.id;
    if (!isEditing) {
      return (
        <div
          className={clsx(
            'bg-white border border-royal/10 p-6 shadow-sm group relative',
            draggedDayId === day.id ? 'opacity-50' : 'opacity-100'
          )}
          draggable
          onDragStart={(e) => { setDraggedDayId(day.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!draggedDayId || draggedDayId === day.id) return;
            const fromIndex = days.findIndex((d) => d.id === draggedDayId);
            reorderDays(fromIndex, index);
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
              <p className="text-sm text-royal/80 text-readable mt-2">{day.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => adminToggleDayLock(day.id)}
                className={clsx('p-2 rounded hover:bg-royal/5', day.isLocked ? 'text-red-500' : 'text-royal/40')}
                title={day.isLocked ? 'Lås opp' : 'Lås'}
              >
                {day.isLocked ? <LockIcon size={16} /> : <Unlock size={16} />}
              </button>
              <button onClick={() => setEditingDayId(day.id)} className="p-2 text-royal/40 hover:text-royal hover:bg-royal/5 rounded">
                <Edit2 size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-2 border-l-2 border-royal/10 pl-4">
            {day.scheduleItems.map((item, i) => (
              <div key={i} className="flex gap-4 text-sm text-readable">
                <span className="font-mono font-bold text-royal/60 w-12">{item.time}</span>
                <div className="flex-1">
                  <span className="font-bold text-royal">{item.activity}</span>
                  {item.location && <span className="text-royal/50 ml-2 font-mono text-xs uppercase"><MapPin size={10} className="inline mr-1" />{item.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
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
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Tittel</label>
              <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-lg text-royal" defaultValue={day.title} onBlur={(e) => updateDay(day.id, { title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Dato</label>
              <input type="date" className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm" defaultValue={day.date} onBlur={(e) => updateDay(day.id, { date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Beskrivelse</label>
            <textarea className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm" rows={2} defaultValue={day.description} onBlur={(e) => updateDay(day.id, { description: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id={`choice-${day.id}`} checked={day.isChoiceDay} onChange={(e) => updateDay(day.id, { isChoiceDay: e.target.checked })} className="accent-royal" />
            <label htmlFor={`choice-${day.id}`} className="text-xs font-mono uppercase text-royal/80">Er dette en valgfri aktivitetsdag?</label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro block mb-2">Tidsplan (Dra for å endre rekkefølge)</label>
          {day.scheduleItems.map((item, idx) => (
            <div
              key={idx}
              className={clsx('flex gap-2 items-start group relative pl-6', draggedItemId?.dayId === day.id && draggedItemId.idx === idx ? 'opacity-50' : 'opacity-100')}
              draggable
              onDragStart={(e) => { setDraggedItemId({ dayId: day.id, idx }); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggedItemId || draggedItemId.dayId !== day.id || draggedItemId.idx === idx) return;
                reorderScheduleItems(day.id, draggedItemId.idx, idx);
                setDraggedItemId(null);
              }}
              onDragEnd={() => setDraggedItemId(null)}
            >
              <div className="absolute left-0 top-2 cursor-move text-royal/20 hover:text-royal/60"><GripVertical size={14} /></div>
              <input className="w-16 border-b border-royal/10 focus:border-royal bg-transparent font-mono text-xs py-1" defaultValue={item.time} onBlur={(e) => updateScheduleItem(day.id, idx, { time: e.target.value })} placeholder="00:00" />
              <div className="flex-1 space-y-1">
                <input className="w-full border-b border-royal/10 focus:border-royal bg-transparent font-bold text-sm py-1" defaultValue={item.activity} onBlur={(e) => updateScheduleItem(day.id, idx, { activity: e.target.value })} placeholder="Aktivitet..." />
                <input className="w-full border-b border-royal/10 focus:border-royal bg-transparent font-mono text-[10px] text-royal/60 py-1" defaultValue={item.location || ''} onBlur={(e) => updateScheduleItem(day.id, idx, { location: e.target.value })} placeholder="Sted (valgfritt)" />
              </div>
              <button onClick={() => removeScheduleItem(day.id, idx)} className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={() => addScheduleItem(day.id)} className="text-xs font-mono uppercase text-royal/40 hover:text-royal flex items-center gap-1 mt-2"><Plus size={12} /> Legg til punkt</button>
        </div>
      </div>
    );
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-end pb-2">
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Rediger Program</h2>
          <button onClick={addDay} className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark">
            <Plus size={14} /> Ny Dag
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {days.map((day, index) => (
            <div key={day.id} className="relative group">
              <EditableDay day={day} index={index} />
              {!editingDayId && (
                <button
                  onClick={() => { if (confirm('Sikker på at du vil slette denne dagen?')) removeDay(day.id); }}
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
    </div>
  );
}
