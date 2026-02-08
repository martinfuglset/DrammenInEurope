import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useStore, selectIsAdmin } from '../store';

const DEPARTURE_DATE = new Date('2026-10-07T00:00:00');
const VIPPS_NUMBER = '550383';

function useCountdown() {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = DEPARTURE_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining({ days, hours, minutes, seconds });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}
import { DayCard } from '../components/DayCard';
import { Logo } from '../components/Logo';
import {
    Bell,
    Users,
    Calendar,
    ClipboardList,
    Book,
    MessageCircle,
    Camera
} from 'lucide-react';

export function ParticipantView() {
  const days = useStore((s) => s.days);
  const currentUser = useStore((s) => s.currentUser);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const paymentMonths = useStore((s) => s.paymentMonths);
  const setPaymentMonth = useStore((s) => s.setPaymentMonth);
  const loginWithCredentials = useStore((s) => s.loginWithCredentials);
  const users = useStore((s) => s.users);
  const logout = useStore((s) => s.logout);
  const isAdmin = useStore(selectIsAdmin);
  const participantHiddenSections = useStore((s) => s.participantHiddenSections);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  useEffect(() => {
    if (!currentUser) {
      setLoginUsername('');
      setLoginPassword('');
      setLoginError(false);
    }
  }, [currentUser]);

  const allMenuItems = [
    { label: 'Oppslagstavle', icon: Bell, path: '/noticeboard', sectionId: 'nav_noticeboard' as const },
    { label: 'Grupper', icon: Users, path: '/groups', sectionId: 'nav_groups' as const },
    { label: 'Dagens Planer', icon: Calendar, path: '/todays-plans', sectionId: 'nav_todays_plans' as const },
    { label: 'Pakkeliste', icon: ClipboardList, path: '/packing-list', sectionId: 'nav_packing_list' as const },
    { label: 'Regler', icon: Book, path: '/rules', sectionId: 'nav_rules' as const },
    { label: 'Feedback', icon: MessageCircle, path: '/feedback', sectionId: 'nav_feedback' as const },
    { label: 'Photodrop', icon: Camera, path: '/photodrop', sectionId: 'nav_photodrop' as const },
  ];
  const menuItems = allMenuItems.filter((item) => !participantHiddenSections.includes(item.sectionId));

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

  const countdown = useCountdown();

  if (!currentUser) {
    const isLoadingUsers = isLoading && users.length === 0;
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      const ok = loginWithCredentials(loginUsername, loginPassword);
      setLoginError(!ok);
    };

    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white/60 border border-royal/10 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <Logo className="text-royal mb-4" width={100} />
            <div className="flex items-center gap-3 text-royal mb-2 opacity-60">
              <span className="type-label-wide">Innlogging</span>
            </div>
            <h1 className="type-display-2 text-royal">
              Deltaker
            </h1>
            <p className="text-royal/60 type-label mt-2">
              Brukernavn = to første bokstaver i navnet. Passord = fødselsdato DDMMYY.
            </p>
            {error && (
              <p className="mt-3 p-3 bg-amber-100 border border-amber-300 text-amber-800 text-xs rounded">
                {error}
              </p>
            )}
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

  const handleVippsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const fallbackUrl = 'https://vipps.no';
    const appScheme = 'vipps://';
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(t);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
    const t = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (document.visibilityState === 'visible') {
        window.location.href = fallbackUrl;
      }
    }, 2000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.location.href = appScheme;
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        
        {/* Header */}
        <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-8 pb-6 sm:pb-8">
          <div className="min-w-0 flex-1 flex items-end gap-4 sm:gap-6">
            <Logo className="text-royal shrink-0" width={80} />
            <h1 className="type-display-1 text-royal">
              Drammen<br/>In Europe
            </h1>
          </div>

          <div className="relative flex items-center gap-2 sm:gap-3 shrink-0" ref={avatarMenuRef}>
            <span className="font-bold text-royal text-base sm:text-lg truncate max-w-[140px] sm:max-w-none">{currentUser?.displayName}</span>
            {isAdmin && (
              <Link
                to="/admin"
                className="font-mono text-xs uppercase text-royal/70 hover:text-royal border border-royal/30 hover:border-royal px-2 py-1.5 rounded-sm transition-colors shrink-0"
              >
                Gå til admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-royal/15 text-royal flex items-center justify-center font-sans font-bold text-sm hover:bg-royal/25 focus:outline-none focus:ring-2 focus:ring-royal/40 transition-colors"
              aria-label="Åpne meny"
              aria-expanded={avatarMenuOpen}
            >
              {(currentUser?.displayName || currentUser?.fullName || '?').charAt(0).toUpperCase()}
            </button>
            {avatarMenuOpen && (
              <div className="absolute top-full right-0 mt-2 py-1 min-w-[140px] bg-white border border-royal/10 shadow-lg rounded-sm z-50">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 type-label text-royal hover:bg-royal/10 transition-colors"
                >
                  Logg ut
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Countdown to Departure */}
        {!participantHiddenSections.includes('countdown') && (
        <div className="mb-10 sm:mb-16 p-6 sm:p-8 md:p-12 bg-linear-to-br from-royal via-royal-dark to-royal shadow-[8px_8px_0_0_rgba(0,47,167,0.3)] border-2 border-royal-dark relative overflow-hidden">
          <div className="relative z-10 text-center">
            <p className="type-label-wide text-white/80 md:text-sm mb-2">
              Avreisedag — 7. oktober 2026
            </p>
            <h2 className="type-display-2 text-white mb-6 sm:mb-8">
              Snart er vi på tur!
            </h2>
            {countdown ? (
              countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 ? (
                <p className="type-display-1 text-white animate-pulse text-center">
                  🎉 I dag er avreisedagen! 🎉
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8 max-w-2xl mx-auto">
                  {[
                    { value: countdown.days, label: 'dager' },
                    { value: countdown.hours, label: 'timer' },
                    { value: countdown.minutes, label: 'min' },
                    { value: countdown.seconds, label: 'sek' },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="type-display-1 text-white tabular-nums min-w-[2ch] drop-shadow-sm text-[1.75rem] sm:text-[2.5rem] md:text-[4rem] lg:text-[4.5rem]">
                        {String(value).padStart(2, '0')}
                      </span>
                      <span className="type-label-wide text-white/70 md:text-xs mt-1">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white" />
              </div>
            )}
          </div>
        </div>
        )}

        {/* Navigation Grid */}
        {menuItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-16 animate-stagger">
            {menuItems.map((item) => (
                <Link 
                    key={item.path} 
                    to={item.path}
                    className="touch-target bg-white/40 hover:bg-white/60 active:bg-white/70 backdrop-blur-sm border border-royal/10 p-4 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 group transition-all hover:-translate-y-1 active:translate-y-0 rounded-sm"
                >
                    <item.icon size={22} className="sm:w-6 sm:h-6 text-royal/80 group-hover:text-royal group-hover:scale-110 transition-all shrink-0" />
                    <span className="type-label text-royal leading-tight">{item.label}</span>
                </Link>
            ))}
        </div>
        )}

        {/* Payment Overview */}
        {!participantHiddenSections.includes('payment_overview') && (
        <div className="mb-16">
          <div className="flex items-center gap-3 text-royal mb-4 opacity-60">
            <span className="type-label-wide">Betalingsplan</span>
          </div>
          <div className="bg-linear-to-br from-white via-paper/50 to-royal/10 border border-royal/10 p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6 relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm relative z-10">
              <div>
                <p className="type-label-wide text-royal/50">Plan</p>
                <p className="text-royal font-bold uppercase">Månedlig</p>
              </div>
              <div>
                <p className="type-label-wide text-royal/50">Beløp</p>
                <p className="text-royal font-bold">350 kr / mnd</p>
              </div>
              <div>
                <p className="type-label-wide text-royal/50">Vipps</p>
                <a
                  href="https://vipps.no"
                  onClick={handleVippsClick}
                  className="text-royal font-bold underline decoration-royal/30 underline-offset-2 hover:decoration-royal"
                  title={`Åpne Vipps og betal ${monthlyAmount} kr til ${VIPPS_NUMBER}`}
                >
                  {VIPPS_NUMBER}
                </a>
                <p className="text-royal/60 type-label mt-0.5">Trykk for å åpne Vipps – betal {monthlyAmount} kr</p>
              </div>
            </div>

            <div className="pt-6 space-y-5 relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="type-label-wide text-royal/50">Betalt totalt</p>
                  <p className="text-royal font-display font-bold text-3xl leading-none">
                    {totalPaidAmount} kr
                  </p>
                  <p className="text-royal/50 type-label mt-1">
                    Gjenstår {remainingAmount} kr
                  </p>
                </div>
                <div className="flex items-end gap-4">
                  <div className="text-right type-label text-royal/60">
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
                  className="h-full bg-linear-to-r from-royal via-royal-dark to-royal transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="type-label-wide text-royal/50 mb-2">Betalt måneder</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {paymentPlanMonths.map((month) => {
                  const isPaid = paidMonths.has(month.key);
                  return (
                  <label
                    key={month.key}
                    className="touch-target flex items-center gap-2 border border-royal/10 rounded-sm px-2 py-2.5 sm:py-2 text-royal/80 hover:border-royal/30 active:border-royal/40 transition-colors cursor-pointer"
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
              <p className="text-royal/40 type-label-wide mt-3">
                Huk av når du har betalt for måneden. Siste betaling er Oktober 2026.
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Day Cards */}
        {!participantHiddenSections.includes('day_cards') && (
        <div className="space-y-6 animate-stagger">
            <div className="flex items-center gap-3 text-royal mb-4 opacity-60">
                <span className="type-label-wide">Dag for dag</span>
            </div>
          {days.map(day => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>
        )}

      </div>
    </div>
  );
}
