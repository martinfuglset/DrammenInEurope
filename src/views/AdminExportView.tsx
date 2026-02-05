import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import { Download, ArrowLeft } from 'lucide-react';

export function AdminExportView() {
  const isAdmin = useStore(selectIsAdmin);
  const { exportAdminData, exportAllData } = useStore();

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
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Eksport</h2>
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
          <button
            onClick={() => exportAdminData('paymentPlans')}
            className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
          >
            Betalingsplaner (CSV)
          </button>
          <button
            onClick={() => exportAdminData('paymentTransactions')}
            className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
          >
            Transaksjoner (CSV)
          </button>
          <button
            onClick={() => exportAdminData('budgets')}
            className="bg-white border border-royal/10 px-4 py-3 text-xs font-mono uppercase text-royal hover:border-royal/40 hover:shadow-sm transition-all"
          >
            Budsjetter (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
