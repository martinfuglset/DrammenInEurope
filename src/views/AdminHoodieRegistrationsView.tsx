import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import { ArrowLeft, Shirt } from 'lucide-react';

export function AdminHoodieRegistrationsView() {
  const isAdmin = useStore(selectIsAdmin);
  const { hoodieRegistrations, users } = useStore();

  if (!isAdmin) return null;

  const bySize = hoodieRegistrations.reduce<Record<string, number>>((acc, r) => {
    acc[r.size] = (acc[r.size] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="space-y-6 pt-2">
        <div className="flex items-center gap-2">
          <Shirt size={28} className="text-royal" />
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Hoodie-registreringer</h2>
        </div>
        <p className="text-royal/70 text-sm max-w-2xl">
          Alle som har valgt størrelse på hoodie (400 kr). Betaling skjer via Vipps til 550383.
        </p>

        {Object.keys(bySize).length > 0 && (
          <div className="bg-royal/5 border border-royal/10 p-4 rounded-sm">
            <p className="type-label-wide text-royal/50 mb-2">Antall per størrelse</p>
            <div className="flex flex-wrap gap-4">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                <span key={size} className="font-mono text-royal">
                  {size}: <strong>{bySize[size] ?? 0}</strong>
                </span>
              ))}
            </div>
            <p className="text-royal/60 text-sm mt-2">Totalt: {hoodieRegistrations.length} bestillinger</p>
          </div>
        )}

        {hoodieRegistrations.length === 0 ? (
          <p className="text-sm text-royal/40 italic">Ingen hoodie-registreringer ennå.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="font-mono text-[10px] uppercase text-royal/40">
                <tr>
                  <th className="pb-2 pl-2">Navn</th>
                  <th className="pb-2">Størrelse</th>
                  <th className="pb-2">Registrert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal/5">
                {hoodieRegistrations.map((reg) => {
                  const user = users.find((u) => u.id === reg.userId);
                  return (
                    <tr key={reg.id} className="hover:bg-royal/5">
                      <td className="py-2 pl-2 font-medium text-royal">
                        {user ? user.fullName : reg.userId}
                      </td>
                      <td className="py-2 font-mono text-royal">{reg.size}</td>
                      <td className="py-2 text-royal/60 text-xs">
                        {new Date(reg.createdAt).toLocaleDateString('nb-NO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
