import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useStore, selectIsAdmin } from '../store';

const DEPARTURE_DATE = new Date('2026-10-07T00:00:00');
const VIPPS_NUMBER = '550383';
const HOODIE_PRICE = 400;
const HOODIE_SIZES: HoodieSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function isUnder18(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return false;
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return age < 18;
}

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
    Camera,
} from 'lucide-react';
import type { HoodieSize } from '../types';

export function ParticipantView() {
  const days = useStore((s) => s.days);
  const currentUser = useStore((s) => s.currentUser);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const paymentMonths = useStore((s) => s.paymentMonths);
  const setPaymentMonthOption = useStore((s) => s.setPaymentMonthOption);
  const loginWithCredentials = useStore((s) => s.loginWithCredentials);
  const users = useStore((s) => s.users);
  const logout = useStore((s) => s.logout);
  const isAdmin = useStore(selectIsAdmin);
  const participantHiddenSections = useStore((s) => s.participantHiddenSections);
  const hoodieRegistrations = useStore((s) => s.hoodieRegistrations);
  const setHoodieRegistration = useStore((s) => s.setHoodieRegistration);
  const removeHoodieRegistration = useStore((s) => s.removeHoodieRegistration);
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

  const under18 = isUnder18(currentUser?.birthDate);
  const satisfiedMonths = useMemo(() => {
    const currentUserId = currentUser?.id;
    if (!currentUserId) return new Set<string>();
    return new Set(
      paymentMonths
        .filter((row) => row.userId === currentUserId && (row.paid || row.dugnad))
        .map((row) => row.month)
    );
  }, [paymentMonths, currentUser?.id]);
  const getMonthOption = useCallback(
    (monthKey: string): 'vipps' | 'dugnad' | null => {
      if (!currentUser?.id) return null;
      const row = paymentMonths.find((r) => r.userId === currentUser.id && r.month === monthKey);
      if (!row) return null;
      if (row.paid) return 'vipps';
      if (row.dugnad) return 'dugnad';
      return null;
    },
    [paymentMonths, currentUser?.id]
  );

  const countdown = useCountdown();

  if (!currentUser) {
    const isLoadingUsers = isLoading && users.length === 0;
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      const ok = loginWithCredentials(loginUsername, loginPassword);
      setLoginError(!ok);
    };

    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 gap-6">
        <div className="w-full max-w-md bg-white/60 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <Logo className="text-royal mb-4" width={130} />
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

  const totalSatisfiedMonths = satisfiedMonths.size;
  const monthlyAmount = 350;
  const totalTarget = paymentPlanMonths.length * monthlyAmount;
  const totalPaidAmount = totalSatisfiedMonths * monthlyAmount;
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalPaidAmount / totalTarget) * 100)) : 0;
  const remainingAmount = Math.max(0, totalTarget - totalPaidAmount);

  const setMonthOption = (monthKey: string, option: 'vipps' | 'dugnad' | null) => {
    if (!currentUser?.id) return;
    setPaymentMonthOption(currentUser.id, monthKey, option);
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
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-12 relative z-10">
        
        {/* Header */}
        <header className="mb-6 sm:mb-12 flex flex-row justify-between items-center gap-3 sm:gap-8 pb-4 sm:pb-8">
          <div className="min-w-0 flex-1 flex items-end">
            <Logo className="text-royal shrink-0" width={96} />
          </div>

          <div className="relative flex items-center gap-2 sm:gap-3 shrink-0" ref={avatarMenuRef}>
            <span className="font-bold text-royal text-sm sm:text-lg truncate max-w-[110px] sm:max-w-none">{currentUser?.displayName}</span>
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
              <div className="absolute top-full right-0 mt-2 py-1 min-w-[180px] bg-white border border-royal/10 shadow-lg rounded-sm z-50">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setAvatarMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 type-label text-royal hover:bg-royal/10 transition-colors"
                  >
                    Gå til admin
                  </Link>
                )}
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
        <div className="mb-8 sm:mb-16 p-4 sm:p-8 md:p-12 bg-royal relative overflow-hidden">
          <div className="relative z-10 text-center">
            <p className="type-label-wide text-white/80 md:text-sm mb-2">
              Avreisedag — 7. oktober 2026
            </p>
            <h2 className="type-display-2 text-white mb-4 sm:mb-8">
              Snart er vi på tur!
            </h2>
            {countdown ? (
              countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 ? (
                <p className="type-display-1 text-white animate-pulse text-center">
                  🎉 I dag er avreisedagen! 🎉
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-8 max-w-2xl mx-auto">
                  {[
                    { value: countdown.days, label: 'dager' },
                    { value: countdown.hours, label: 'timer' },
                    { value: countdown.minutes, label: 'min' },
                    { value: countdown.seconds, label: 'sek' },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="type-display-1 text-white tabular-nums min-w-[2ch] text-[1.35rem] sm:text-[2.5rem] md:text-[4rem] lg:text-[4.5rem]">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-8 sm:mb-16 animate-stagger">
            {menuItems.map((item) => (
                <Link 
                    key={item.path} 
                    to={item.path}
                    className="touch-target bg-white/40 hover:bg-white/60 active:bg-white/70 backdrop-blur-sm p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 group transition-all hover:-translate-y-1 active:translate-y-0 rounded-sm"
                >
                    <item.icon size={22} className="sm:w-6 sm:h-6 text-royal/80 group-hover:text-royal group-hover:scale-110 transition-all shrink-0" />
                    <span className="type-label text-royal leading-tight">{item.label}</span>
                </Link>
            ))}
        </div>
        )}

        {/* Hoodie merch */}
        {!participantHiddenSections.includes('hoodie') && (
        <div className="mb-10 sm:mb-16">
          <div className="bg-white p-4 sm:p-6 space-y-5 relative overflow-hidden">
            <h2 className="card-heading">Hoodie</h2>
            <p className="text-royal/80 text-sm">
              Hoodien koster <strong>{HOODIE_PRICE} kr</strong>. Du kjøper ved å velge størrelse nedenfor.
              Betal med Vipps til{' '}
              <a
                href="https://vipps.no"
                onClick={handleVippsClick}
                className="font-bold underline decoration-royal/30 underline-offset-2 hover:decoration-royal"
                title={`Åpne Vipps og betal ${HOODIE_PRICE} kr til ${VIPPS_NUMBER}`}
              >
                {VIPPS_NUMBER}
              </a>
              .
            </p>
            {(() => {
              const myHoodie = currentUser ? hoodieRegistrations.find((r) => r.userId === currentUser.id) : null;
              return (
                <div className="space-y-4 pt-2">
                  <p className="type-label-wide text-royal/50">Velg størrelse</p>
                  <div className="flex flex-wrap gap-2">
                    {HOODIE_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => currentUser && setHoodieRegistration(currentUser.id, size)}
                        className={`touch-target px-4 py-2.5 border text-sm font-mono uppercase transition-colors ${
                          myHoodie?.size === size
                            ? 'bg-royal text-white border-royal'
                            : 'border-royal/30 text-royal hover:border-royal hover:bg-royal/10'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {myHoodie && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="text-royal font-semibold">Du har valgt: {myHoodie.size}</span>
                      <button
                        type="button"
                        onClick={() => currentUser && removeHoodieRegistration(currentUser.id)}
                        className="type-label text-royal/60 hover:text-royal underline"
                      >
                        Fjern bestilling
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        )}

        {/* Payment Overview */}
        {!participantHiddenSections.includes('payment_overview') && (
        <div className="mb-10 sm:mb-16">
          <div className="bg-white p-4 sm:p-6 space-y-4 sm:space-y-6 relative overflow-hidden">
            <h2 className="card-heading">Betalingsplan</h2>
            {/* Summary: compact on mobile, same row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm relative z-10">
              <div className="min-w-0">
                <p className="type-label-wide text-royal/50 text-[10px] sm:text-xs">Plan</p>
                <p className="text-royal font-bold uppercase text-xs sm:text-sm truncate">Månedlig</p>
              </div>
              <div className="min-w-0">
                <p className="type-label-wide text-royal/50 text-[10px] sm:text-xs">Beløp</p>
                <p className="text-royal font-bold text-xs sm:text-sm truncate">350 kr / mnd</p>
              </div>
              <div className="min-w-0">
                <p className="type-label-wide text-royal/50 text-[10px] sm:text-xs">Vipps</p>
                <a
                  href="https://vipps.no"
                  onClick={handleVippsClick}
                  className="text-royal font-bold underline decoration-royal/30 underline-offset-2 hover:decoration-royal text-xs sm:text-sm truncate block"
                  title={`Åpne Vipps og betal ${monthlyAmount} kr til ${VIPPS_NUMBER}`}
                >
                  {VIPPS_NUMBER}
                </a>
                <p className="text-royal/60 type-label mt-0.5 text-[10px] sm:text-xs hidden sm:block">Trykk for å åpne Vipps – betal {monthlyAmount} kr</p>
              </div>
            </div>

            <p className="text-royal/70 text-xs sm:text-sm">
              {under18 ? (
                <>Under 18: Vipps eller <strong>3,5 t dugnad</strong> per mnd.</>
              ) : (
                <>Over 18: Vipps eller <strong>2,5 t dugnad</strong> per mnd.</>
              )}
            </p>

            {/* Progress: stacked on mobile for clarity */}
            <div className="pt-3 sm:pt-4 space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                <div>
                  <p className="type-label-wide text-royal/50 text-[10px] sm:text-xs">Levert totalt</p>
                  <p className="text-royal font-display font-bold text-2xl sm:text-3xl leading-none tabular-nums">
                    {totalPaidAmount} kr
                  </p>
                  <p className="text-royal/50 type-label mt-0.5 sm:mt-1 text-xs">
                    Gjenstår {remainingAmount} kr
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="type-label text-royal/60 text-xs">
                    {totalSatisfiedMonths} / {paymentPlanMonths.length} mnd
                  </span>
                  <div className="flex gap-1 sm:gap-1.5" aria-hidden>
                    {paymentPlanMonths.map((month) => {
                      const satisfied = satisfiedMonths.has(month.key);
                      return (
                        <div
                          key={month.key}
                          className={`h-1.5 w-5 sm:w-6 rounded-full flex-shrink-0 ${satisfied ? 'bg-royal' : 'bg-royal/10'}`}
                          title={month.label}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-royal/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-royal transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div>
                <p className="type-label-wide text-royal/50 text-[10px] sm:text-xs mb-2 sm:mb-2.5">Per måned</p>
                <div className="space-y-2 sm:space-y-3">
                  {paymentPlanMonths.map((month) => {
                    const option = getMonthOption(month.key);
                    return (
                      <div
                        key={month.key}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-royal/10 rounded-sm p-2.5 sm:px-3 sm:py-2.5 hover:border-royal/20 transition-colors"
                      >
                        <span className="text-royal font-medium text-sm sm:min-w-[88px]">{month.label}</span>
                        <div className="flex gap-2 flex-1 min-w-0">
                          <label
                            className={`flex-1 flex items-center justify-center gap-1.5 cursor-pointer rounded-sm border py-2 px-2 sm:px-3 text-center text-xs sm:text-sm transition-colors touch-manipulation ${
                              option === 'vipps'
                                ? 'bg-royal/10 border-royal/30 text-royal font-semibold'
                                : 'border-royal/15 text-royal/80 hover:border-royal/25'
                            }`}
                            onClick={(e) => { if (option === 'vipps') { e.preventDefault(); setMonthOption(month.key, null); } }}
                          >
                            <input
                              type="radio"
                              name={`month-${month.key}`}
                              className="sr-only"
                              checked={option === 'vipps'}
                              onChange={() => setMonthOption(month.key, option === 'vipps' ? null : 'vipps')}
                            />
                            Vipps
                          </label>
                          <label
                            className={`flex-1 flex items-center justify-center gap-1.5 cursor-pointer rounded-sm border py-2 px-2 sm:px-3 text-center text-xs sm:text-sm transition-colors touch-manipulation ${
                              option === 'dugnad'
                                ? 'bg-royal/10 border-royal/30 text-royal font-semibold'
                                : 'border-royal/15 text-royal/80 hover:border-royal/25'
                            }`}
                            onClick={(e) => { if (option === 'dugnad') { e.preventDefault(); setMonthOption(month.key, null); } }}
                          >
                            <input
                              type="radio"
                              name={`month-${month.key}`}
                              className="sr-only"
                              checked={option === 'dugnad'}
                              onChange={() => setMonthOption(month.key, option === 'dugnad' ? null : 'dugnad')}
                            />
                            Dugnad ({under18 ? '3,5' : '2,5'} t)
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-royal/40 type-label-wide text-[10px] sm:text-xs mt-2">
                Huk av når du har betalt eller fullført dugnad. Frist Oktober 2026.
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Day Cards */}
        {!participantHiddenSections.includes('day_cards') && (
        <div className="space-y-6 animate-stagger">
          {days.map(day => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>
        )}

      </div>
    </div>
  );
}
