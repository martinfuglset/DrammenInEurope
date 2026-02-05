import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import type { Signup } from '../types';
import { Trash2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export function AdminSignupsView() {
  const isAdmin = useStore(selectIsAdmin);
  const { activities, signups, users, updateSignupStatus, adminRemoveUser } = useStore();

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="space-y-6 pt-2">
        <h2 className="font-display font-bold text-2xl text-royal uppercase pb-2">Påmeldingslister</h2>

        <div className="grid grid-cols-1 gap-8">
          {activities.map((activity) => {
            const activitySignups = signups.filter((s) => s.activityId === activity.id);
            const isFull = activitySignups.length >= activity.capacityMax;

            return (
              <div key={activity.id} className="bg-white border border-royal/10 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-xl text-royal uppercase">{activity.title}</h3>
                    <p className="font-mono text-xs text-royal/60 text-readable mt-1 uppercase">
                      {activity.timeStart} - {activity.timeEnd} • {activity.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={clsx('font-mono text-sm font-bold block', isFull ? 'text-red-500' : 'text-green-600')}
                      >
                        {activitySignups.length} / {activity.capacityMax}
                      </span>
                      <span className="text-[10px] uppercase text-royal/40 font-mono">Kapasitet</span>
                    </div>
                    <div className={clsx('w-3 h-3 rounded-full', isFull ? 'bg-red-500' : 'bg-green-500')} />
                  </div>
                </div>

                {activitySignups.length === 0 ? (
                  <p className="text-sm text-royal/40 italic">Ingen påmeldte.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="font-mono text-[10px] uppercase text-royal/40">
                        <tr>
                          <th className="pb-2 pl-2">Navn</th>
                          <th className="pb-2">Rolle</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right pr-2">Handling</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-royal/5">
                        {activitySignups.map((signup) => {
                          const user = users.find((u) => u.id === signup.userId);
                          if (!user) return null;
                          return (
                            <tr key={signup.userId} className="hover:bg-royal/5">
                              <td className="py-2 pl-2 font-medium text-royal participant-name">{user.fullName}</td>
                              <td className="py-2 text-royal/60 text-xs">{user.role}</td>
                              <td className="py-2">
                                <select
                                  value={signup.status}
                                  onChange={(e) =>
                                    updateSignupStatus(activity.id, user.id, e.target.value as Signup['status'])
                                  }
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
  );
}
