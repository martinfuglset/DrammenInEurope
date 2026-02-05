import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import { ArrowLeft } from 'lucide-react';

const PAYMENT_PLAN_MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober'
].map((label, index) => ({
  key: `2026-${String(index + 1).padStart(2, '0')}`,
  label: `${label} 2026`
}));

const MONTHLY_AMOUNT = 350;
const formatAmount = (amount: number) => `${amount} kr`;

export function AdminPaymentStatusView() {
  const isAdmin = useStore(selectIsAdmin);
  const { users, paymentMonths } = useStore();
  const [showPaymentStatus, setShowPaymentStatus] = useState(true);
  const [paymentStatusSearch, setPaymentStatusSearch] = useState('');

  const filteredPaymentUsers = useMemo(() => {
    const normalizedSearch = paymentStatusSearch.trim().toLowerCase();
    if (!normalizedSearch) return users;
    return users.filter((user) => {
      const haystack = [user.fullName, user.displayName, user.email, user.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [users, paymentStatusSearch]);

  const getPaidMonthSetForUser = (userId: string) =>
    new Set(paymentMonths.filter((row) => row.userId === userId && row.paid).map((row) => row.month));
  const totalPaidAmountAll = paymentMonths.filter((row) => row.paid).length * MONTHLY_AMOUNT;
  const shouldShowPaymentStatus = showPaymentStatus || paymentStatusSearch.trim().length > 0;

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase"
        >
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end pb-2 flex-wrap gap-4">
          <h2 className="font-display font-bold text-2xl text-royal uppercase">
            Betalingsstatus deltakere
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-royal font-display font-bold text-2xl">
                {formatAmount(totalPaidAmountAll)}
              </div>
              <div className="text-royal/50 text-[10px] font-mono uppercase">Totalt betalt</div>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentStatus((prev) => !prev)}
              className="flex items-center gap-2 border border-royal/20 text-royal px-4 py-2 text-xs font-mono uppercase font-bold hover:border-royal/60 transition-colors"
            >
              {shouldShowPaymentStatus ? 'Skjul' : 'Vis'}
            </button>
            <input
              className="w-56 border-b border-royal/20 bg-transparent text-sm py-1 focus:border-royal outline-none"
              placeholder="Søk betaling..."
              value={paymentStatusSearch}
              onChange={(e) => setPaymentStatusSearch(e.target.value)}
            />
          </div>
        </div>

        {shouldShowPaymentStatus ? (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPaymentUsers.map((user) => {
                const paidSet = getPaidMonthSetForUser(user.id);
                const totalPaidMonths = paidSet.size;
                const totalTarget = PAYMENT_PLAN_MONTHS.length * MONTHLY_AMOUNT;
                const totalPaidAmount = totalPaidMonths * MONTHLY_AMOUNT;
                const progressPercent =
                  totalTarget > 0 ? Math.min(100, Math.round((totalPaidAmount / totalTarget) * 100)) : 0;
                const remainingAmount = Math.max(0, totalTarget - totalPaidAmount);
                return (
                  <div
                    key={user.id}
                    className="bg-white border border-royal/10 shadow-sm p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-royal participant-name font-bold uppercase">
                          {user.fullName}
                        </p>
                        <p className="text-royal/50 text-xs font-mono uppercase">
                          Betalt {totalPaidAmount} kr • Gjenstår {remainingAmount} kr
                        </p>
                      </div>
                      <div className="text-right text-xs text-royal/60 font-mono uppercase">
                        {totalPaidMonths} / {PAYMENT_PLAN_MONTHS.length} måneder
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-royal/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-royal via-royal-dark to-royal transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex flex-col-reverse gap-1">
                      {PAYMENT_PLAN_MONTHS.map((month) => {
                        const isPaid = paidSet.has(month.key);
                        return (
                          <div
                            key={month.key}
                            className={`h-1.5 w-8 rounded-full ${isPaid ? 'bg-royal' : 'bg-royal/10'}`}
                            title={month.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredPaymentUsers.length === 0 && (
                <div className="bg-white border border-royal/10 shadow-sm p-6 text-center text-royal/40 italic col-span-2">
                  Ingen deltakere funnet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/60 border border-royal/10 shadow-sm p-6 text-royal/50 text-xs font-mono uppercase">
            Betalingsstatus er skjult. Søk etter navn eller klikk "Vis".
          </div>
        )}
      </div>
    </div>
  );
}
