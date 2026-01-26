import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useStore } from '../store';
import { DayCard } from '../components/DayCard';
import { SharpStar } from '../components/Star';
import {
    UserCircle,
    Bell,
    Users,
    Calendar,
    ClipboardList,
    Book,
    MessageCircle,
    Camera,
    Sparkles
} from 'lucide-react';

export function ParticipantView() {
  const { days, currentUser, isLoading, paymentMonths, setPaymentMonth, loginWithCredentials, users, logout } = useStore();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoginUsername('');
      setLoginPassword('');
      setLoginError(false);
    }
  }, [currentUser]);

  const menuItems = [
    { label: 'Oppslagstavle', icon: Bell, path: '/noticeboard' },
    { label: 'Grupper', icon: Users, path: '/groups' },
    { label: 'Dagens Planer', icon: Calendar, path: '/todays-plans' },
    { label: 'Pakkeliste', icon: ClipboardList, path: '/packing-list' },
    { label: 'Regler', icon: Book, path: '/rules' },
    { label: 'Feedback', icon: MessageCircle, path: '/feedback' },
    { label: 'Photodrop', icon: Camera, path: '/photodrop' },
  ];

  const paymentPlanMonths = useMemo(() => {
    const months = [
      'Januar',
      'Februar',
      'Mars',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober'
    ];
    return months.map((label, index) => {
      const monthNumber = String(index + 1).padStart(2, '0');
      return {
        key: `2026-${monthNumber}`,
        label: `${label} 2026`
      };
    });
  }, []);

  const paidMonths = useMemo(() => {
    const currentUserId = currentUser?.id;
    if (!currentUserId) return new Set<string>();
    return new Set(
      paymentMonths
        .filter((row) => row.userId === currentUserId && row.paid)
        .map((row) => row.month)
    );
  }, [paymentMonths, currentUser?.id]);

  if (!currentUser) {
    const isLoadingUsers = isLoading && users.length === 0;
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      const ok = loginWithCredentials(loginUsername, loginPassword);
      setLoginError(!ok);
    };

    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white/60 border border-royal/10 shadow-sm p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
              <SharpStar size={12} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Innlogging</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-royal uppercase leading-none tracking-tight">
              Deltaker
            </h1>
            <p className="text-royal/60 text-xs font-mono uppercase mt-2">
              Brukernavn = to første bokstaver i navnet. Passord = fødselsdato DDMMYY.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Brukernavn"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              value={loginUsername}
              onChange={(event) => {
                setLoginUsername(event.target.value);
                setLoginError(false);
              }}
              className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-3 rounded-sm"
            />
            <input
              type="password"
              placeholder="Passord (DDMMYY)"
              inputMode="numeric"
              pattern="[0-9]*"
              value={loginPassword}
              onChange={(event) => {
                setLoginPassword(event.target.value);
                setLoginError(false);
              }}
              className="w-full border border-royal/20 focus:border-royal bg-transparent text-sm p-3 rounded-sm"
            />

            {loginError && (
              <p className="text-red-500 text-xs text-center font-mono uppercase">
                Feil brukernavn eller passord
              </p>
            )}

            {isLoadingUsers && (
              <div className="flex items-center justify-center gap-2 text-royal/60 text-xs font-mono uppercase">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-royal"></div>
                Laster deltakere...
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingUsers}
              className="w-full bg-royal text-white px-4 py-3 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalPaidMonths = paidMonths.size;
  const monthlyAmount = 350;
  const totalTarget = paymentPlanMonths.length * monthlyAmount;
  const totalPaidAmount = totalPaidMonths * monthlyAmount;
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalPaidAmount / totalTarget) * 100)) : 0;
  const remainingAmount = Math.max(0, totalTarget - totalPaidAmount);

  const toggleMonth = (monthKey: string, paid: boolean) => {
    if (!currentUser?.id) return;
    setPaymentMonth(currentUser.id, monthKey, paid);
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-32">
       {/* Background Ambience */}
       <SharpStar className="absolute top-32 left-1/4 text-royal w-4 h-4 animate-pulse opacity-60" />
       <SharpStar className="absolute top-10 right-1/3 text-royal w-6 h-6 opacity-80" />
       <SharpStar className="absolute bottom-20 left-10 text-royal w-12 h-12 opacity-10" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-royal/10 pb-8">
          <div>
            <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
                <SharpStar size={12} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Programoversikt</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-7xl text-royal uppercase leading-none tracking-tight">
              Drammen<br/>In Europe
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 mb-1">
               <span className="font-sans font-bold text-royal text-lg">Hei, {currentUser?.displayName}</span>
               <UserCircle className="text-royal/80" />
            </div>
            <p className="font-mono text-xs text-royal/50 uppercase tracking-widest text-right max-w-[200px]">
              Du er logget inn som deltaker.
            </p>
            <button
              type="button"
              onClick={logout}
              className="text-royal/60 hover:text-royal text-xs font-mono uppercase tracking-widest"
            >
              Logg ut
            </button>
          </div>
        </header>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {menuItems.map((item) => (
                <Link 
                    key={item.path} 
                    to={item.path}
                    className="bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-royal/10 p-4 flex flex-col items-center justify-center text-center gap-3 group transition-all hover:-translate-y-1"
                >
                    <item.icon size={24} className="text-royal/80 group-hover:text-royal group-hover:scale-110 transition-all" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-royal">{item.label}</span>
                </Link>
            ))}
        </div>

        {/* Payment Overview */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-royal mb-4 opacity-60">
            <SharpStar size={12} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Betalingsplan</span>
          </div>
          <div className="bg-gradient-to-br from-white via-white to-royal/5 border border-royal/10 p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute -top-8 -right-6 text-royal/10">
              <Sparkles size={80} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm relative z-10">
              <div>
                <p className="font-mono text-[10px] uppercase text-royal/50">Plan</p>
                <p className="text-royal font-bold uppercase">Månedlig</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-royal/50">Beløp</p>
                <p className="text-royal font-bold">350 kr / mnd</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-royal/50">Vipps</p>
                <a
                  href="#"
                  className="text-royal font-bold underline decoration-royal/30 underline-offset-2 hover:decoration-royal"
                >
                  Vipps-nummer kommer
                </a>
              </div>
            </div>

            <div className="border-t border-royal/10 pt-6 space-y-5 relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase text-royal/50">Betalt totalt</p>
                  <p className="text-royal font-display font-bold text-3xl tracking-tight">
                    {totalPaidAmount} kr
                  </p>
                  <p className="text-royal/50 text-xs font-mono uppercase mt-1">
                    Gjenstår {remainingAmount} kr
                  </p>
                </div>
                <div className="flex items-end gap-4">
                  <div className="text-right text-xs text-royal/60 font-mono uppercase">
                    {totalPaidMonths} / {paymentPlanMonths.length} måneder
                  </div>
                  <div className="flex flex-col-reverse gap-1">
                    {paymentPlanMonths.map((month) => {
                      const isPaid = paidMonths.has(month.key);
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
              </div>
              <div className="w-full h-2.5 bg-royal/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-royal via-royal-dark to-royal transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="font-mono text-[10px] uppercase text-royal/50 mb-2">Betalt måneder</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {paymentPlanMonths.map((month) => {
                  const isPaid = paidMonths.has(month.key);
                  return (
                  <label
                    key={month.key}
                    className="flex items-center gap-2 border border-royal/10 rounded-sm px-2 py-2 text-royal/80 hover:border-royal/30 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-royal"
                      checked={isPaid}
                      onChange={() => toggleMonth(month.key, !isPaid)}
                    />
                    <span className={isPaid ? 'text-royal font-semibold' : undefined}>
                      {month.label}
                    </span>
                  </label>
                )})}
              </div>
              <p className="text-royal/40 text-[10px] font-mono uppercase mt-3">
                Huk av når du har betalt for måneden. Siste betaling er Oktober 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Day Cards */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 text-royal mb-4 opacity-60">
                <SharpStar size={12} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Dag for dag</span>
            </div>
          {days.map(day => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>

      </div>
    </div>
  );
}
