import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import type { ActivityOption } from '../types';
import { Edit2, Save, Trash2, GripVertical, Plus, Clock, MapPin, Bus, Tag, Car, ExternalLink, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export function AdminActivitiesView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    activities,
    signups,
    updateActivity,
    addActivity,
    removeActivity,
    reorderActivities,
  } = useStore();

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);

  const EditableActivity = ({ activity, index }: { activity: ActivityOption; index: number }) => {
    const isEditing = editingActivityId === activity.id;
    const signupsForActivity = signups.filter((s) => s.activityId === activity.id);

    if (!isEditing) {
      return (
        <div
          className={clsx('bg-white border border-royal/10 p-6 shadow-sm relative group', draggedActivityId === activity.id ? 'opacity-50' : 'opacity-100')}
          draggable
          onDragStart={(e) => { setDraggedActivityId(activity.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!draggedActivityId || draggedActivityId === activity.id) return;
            const fromIndex = activities.findIndex((a) => a.id === draggedActivityId);
            reorderActivities(fromIndex, index);
            setDraggedActivityId(null);
          }}
          onDragEnd={() => setDraggedActivityId(null)}
        >
          <div className="absolute top-2 left-2 cursor-move text-royal/20 hover:text-royal/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <GripVertical size={16} />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setEditingActivityId(activity.id)} className="p-2 text-royal/40 hover:text-royal hover:bg-royal/5 rounded">
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => { if (confirm('Er du sikker? Dette vil slette aktiviteten og alle påmeldinger.')) removeActivity(activity.id); }}
              className="p-2 text-royal/20 hover:text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mb-4 pr-12">
            <h3 className="font-display font-bold text-lg text-royal uppercase">{activity.title}</h3>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-royal/60 text-readable mt-1 uppercase">
              <span className="flex items-center gap-1"><Clock size={12} /> {activity.timeStart}-{activity.timeEnd}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {activity.location}</span>
              <span className="flex items-center gap-1"><Bus size={12} /> {activity.transport}</span>
              {activity.price != null && activity.price !== '' && <span className="flex items-center gap-1"><Tag size={12} /> {activity.price}</span>}
              {activity.drivingLength != null && activity.drivingLength !== '' && <span className="flex items-center gap-1"><Car size={12} /> {activity.drivingLength}</span>}
              {activity.link != null && activity.link !== '' && (
                <a href={activity.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-royal/60 hover:text-royal"><ExternalLink size={12} /> Lenke</a>
              )}
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
          <button onClick={() => setEditingActivityId(null)} className="p-2 text-green-600 hover:bg-green-50 rounded bg-green-50/50"><Save size={20} /></button>
        </div>
        <div className="space-y-4 pr-12">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Tittel</label>
            <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-display font-bold text-lg text-royal" defaultValue={activity.title} onBlur={(e) => updateActivity(activity.id, { title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Start</label>
              <input type="time" className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm" defaultValue={activity.timeStart} onBlur={(e) => updateActivity(activity.id, { timeStart: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Slutt</label>
              <input type="time" className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm" defaultValue={activity.timeEnd} onBlur={(e) => updateActivity(activity.id, { timeEnd: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Sted</label>
              <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm" defaultValue={activity.location} onBlur={(e) => updateActivity(activity.id, { location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Kapasitet</label>
              <input type="number" className="w-full border-b border-royal/20 focus:border-royal bg-transparent font-mono text-sm" defaultValue={activity.capacityMax} onBlur={(e) => updateActivity(activity.id, { capacityMax: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Transport</label>
            <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm" defaultValue={activity.transport} onBlur={(e) => updateActivity(activity.id, { transport: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Pris (f.eks. 350 kr / Gratis)</label>
              <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm" defaultValue={activity.price ?? ''} onBlur={(e) => updateActivity(activity.id, { price: e.target.value.trim() || undefined })} placeholder="Pris..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Kjørelengde (f.eks. 45 min / 120 km)</label>
              <input className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm" defaultValue={activity.drivingLength ?? ''} onBlur={(e) => updateActivity(activity.id, { drivingLength: e.target.value.trim() || undefined })} placeholder="Kjørelengde..." />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Lenke til aktivitet (URL)</label>
            <input type="url" className="w-full border-b border-royal/20 focus:border-royal bg-transparent text-sm" defaultValue={activity.link ?? ''} onBlur={(e) => updateActivity(activity.id, { link: e.target.value.trim() || undefined })} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-royal/40 text-readable-micro">Beskrivelse</label>
            <textarea className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-2 rounded-sm" rows={2} defaultValue={activity.description} onBlur={(e) => updateActivity(activity.id, { description: e.target.value })} />
          </div>
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
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Administrer Aktiviteter</h2>
          <button onClick={addActivity} className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark">
            <Plus size={14} /> Ny Aktivitet
          </button>
        </div>
        <p className="text-royal/60 text-sm max-w-2xl">
          Disse aktivitetene vises på dager markert som &quot;Valgfri Dag&quot;. Husk å sette kapasitet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, index) => (
            <EditableActivity key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
