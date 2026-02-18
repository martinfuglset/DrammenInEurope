import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  Crown,
  Sparkles,
  Star,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useStore, selectIsAdmin } from '../store';
import {
  TEAM_COMPETITION_PAGE_SLUG,
  deriveCompetitionTeamsFromBusGroups,
  parseTeamCompetitionData,
  serializeTeamCompetitionData,
  upsertSubmissionStatus,
  type CompetitionSubmissionStatus,
} from '../lib/teamCompetition';

type CompetitionTab = 'leaderboard' | 'challenges';
type ChallengeFilter = 'all' | 'todo' | 'pending' | 'approved' | 'rejected';

const COMPETITION_TITLE = 'STAR CLASH';

const PODIUM_STYLES = [
  {
    badge: 'Mesterlag',
    icon: Crown,
    cardClass: 'border-amber-300 bg-amber-50/60',
    progressClass: 'bg-amber-400',
  },
  {
    badge: 'Utfordrer',
    icon: Trophy,
    cardClass: 'border-slate-300 bg-slate-50',
    progressClass: 'bg-slate-400',
  },
  {
    badge: 'Dark horse',
    icon: Award,
    cardClass: 'border-orange-300 bg-orange-50/60',
    progressClass: 'bg-orange-400',
  },
] as const;

function statusTone(status: CompetitionSubmissionStatus | undefined) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-royal/5 text-royal/60 border-royal/10';
}

function statusLabel(status: CompetitionSubmissionStatus | undefined) {
  if (status === 'approved') return 'Godkjent';
  if (status === 'pending') return 'Til vurdering';
  if (status === 'rejected') return 'Avvist';
  return 'Ikke sendt inn';
}

function filterLabel(filter: ChallengeFilter) {
  if (filter === 'all') return 'Alle';
  if (filter === 'todo') return 'Ikke sendt inn';
  if (filter === 'pending') return 'Venter';
  if (filter === 'approved') return 'Godkjent';
  return 'Avvist';
}

export function TeamCompetitionView() {
  const { infoPages, updateInfoPage, currentUser, users } = useStore();
  const isAdmin = useStore(selectIsAdmin);
  const location = useLocation();
  const [savingChallengeId, setSavingChallengeId] = useState<string | null>(null);
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all');

  const activeTab: CompetitionTab = location.pathname.endsWith('/challenges') ? 'challenges' : 'leaderboard';
  const rawContent = infoPages.find((page) => page.slug === TEAM_COMPETITION_PAGE_SLUG)?.content;
  const groupsRawContent = infoPages.find((page) => page.slug === 'groups')?.content;
  const competition = useMemo(() => parseTeamCompetitionData(rawContent), [rawContent]);

  const teams = useMemo(
    () =>
      deriveCompetitionTeamsFromBusGroups({
        groupsRawContent,
        users,
        storedTeams: competition.teams,
      }),
    [competition.teams, groupsRawContent, users]
  );

  const challengeById = useMemo(
    () => new Map(competition.challenges.map((challenge) => [challenge.id, challenge])),
    [competition.challenges]
  );

  const submissionMap = useMemo(() => {
    const map = new Map<string, CompetitionSubmissionStatus>();
    for (const submission of competition.submissions) {
      map.set(`${submission.teamId}:${submission.challengeId}`, submission.status);
    }
    return map;
  }, [competition.submissions]);

  const leaderboard = useMemo(() => {
    return teams
      .map((team) => {
        const stars = competition.submissions.reduce((sum, submission) => {
          if (submission.teamId !== team.id || submission.status !== 'approved') return sum;
          const challenge = challengeById.get(submission.challengeId);
          if (!challenge) return sum;
          return sum + challenge.stars;
        }, 0);
        const approvedChallenges = competition.submissions.filter(
          (submission) => submission.teamId === team.id && submission.status === 'approved'
        ).length;
        return {
          team,
          stars,
          approvedChallenges,
        };
      })
      .sort((a, b) => b.stars - a.stars || b.approvedChallenges - a.approvedChallenges || a.team.name.localeCompare(b.team.name));
  }, [challengeById, competition.submissions, teams]);

  const myTeam = useMemo(() => {
    if (!currentUser) return null;
    return teams.find((team) => team.leaderUserId === currentUser.id || team.memberUserIds.includes(currentUser.id)) ?? null;
  }, [currentUser, teams]);

  const myTeamRank = useMemo(() => {
    if (!myTeam) return null;
    const index = leaderboard.findIndex((row) => row.team.id === myTeam.id);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, myTeam]);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const leaderStars = topThree[0]?.stars ?? 0;

  const myTeamRow = useMemo(() => {
    if (!myTeam) return null;
    return leaderboard.find((row) => row.team.id === myTeam.id) ?? null;
  }, [leaderboard, myTeam]);

  const isTeamLeader = Boolean(currentUser && myTeam && myTeam.leaderUserId === currentUser.id);

  const visibleChallenges = useMemo(
    () =>
      competition.challenges
        .filter((challenge) => challenge.participantVisible && challenge.isActive)
        .sort((a, b) => b.stars - a.stars || a.title.localeCompare(b.title)),
    [competition.challenges]
  );

  const challengeStats = useMemo(() => {
    let todo = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    if (!myTeam) {
      return {
        total: visibleChallenges.length,
        todo,
        pending,
        approved,
        rejected,
      };
    }

    for (const challenge of visibleChallenges) {
      const status = submissionMap.get(`${myTeam.id}:${challenge.id}`);
      if (!status) todo += 1;
      else if (status === 'pending') pending += 1;
      else if (status === 'approved') approved += 1;
      else if (status === 'rejected') rejected += 1;
    }

    return {
      total: visibleChallenges.length,
      todo,
      pending,
      approved,
      rejected,
    };
  }, [myTeam, submissionMap, visibleChallenges]);

  const filteredChallenges = useMemo(() => {
    if (challengeFilter === 'all' || !myTeam) return visibleChallenges;
    return visibleChallenges.filter((challenge) => {
      const status = submissionMap.get(`${myTeam.id}:${challenge.id}`);
      if (challengeFilter === 'todo') return !status;
      return status === challengeFilter;
    });
  }, [challengeFilter, myTeam, submissionMap, visibleChallenges]);

  const filterCounts: Record<ChallengeFilter, number> = {
    all: challengeStats.total,
    todo: challengeStats.todo,
    pending: challengeStats.pending,
    approved: challengeStats.approved,
    rejected: challengeStats.rejected,
  };

  const saveChallengeStatus = async (challengeId: string, status: CompetitionSubmissionStatus | null) => {
    if (!myTeam || !currentUser) return;
    setSavingChallengeId(challengeId);
    const nextSubmissions = upsertSubmissionStatus(competition.submissions, {
      teamId: myTeam.id,
      challengeId,
      status,
      updatedByUserId: currentUser.id,
    });
    await updateInfoPage(
      TEAM_COMPETITION_PAGE_SLUG,
      serializeTeamCompetitionData({
        ...competition,
        teams,
        submissions: nextSubmissions,
      })
    );
    setSavingChallengeId(null);
  };

  return (
    <div className="min-h-screen bg-paper relative overflow-x-hidden selection:bg-royal selection:text-white pb-safe">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <header className="mb-8 sm:mb-10 space-y-4">
          <Link to={isAdmin ? '/admin' : '/'} className="inline-flex items-center gap-2 text-royal/60 hover:text-royal transition-colors">
            <ArrowLeft size={20} />
            <span className="type-label">Tilbake</span>
          </Link>
          <div className="bg-royal text-white p-6 md:p-8 overflow-hidden relative">
            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="type-label-wide text-white/75 mb-2">Konkurranse mellom busslag</p>
                <h1 className="font-display font-bold text-3xl md:text-5xl uppercase tracking-tight">{COMPETITION_TITLE}</h1>
                <p className="mt-3 text-white/90 text-sm md:text-base max-w-2xl">
                  Jakt poeng, klatre på statusboardet og bli turens mest legendariske lag.
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Sparkles size={18} />
                <span className="type-label">Live status. Smarte moves. Maks hype.</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            to="/team-competition"
            className={`px-4 py-2 text-xs font-mono uppercase border transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-royal text-white border-royal'
                : 'bg-white border-royal/20 text-royal hover:border-royal/40'
            }`}
          >
            Statusboard
          </Link>
          <Link
            to="/team-competition/challenges"
            className={`px-4 py-2 text-xs font-mono uppercase border transition-colors ${
              activeTab === 'challenges'
                ? 'bg-royal text-white border-royal'
                : 'bg-white border-royal/20 text-royal hover:border-royal/40'
            }`}
          >
            Challenges
          </Link>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <section className="bg-white border border-royal/10 p-5 md:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-royal">
                    <Trophy size={20} />
                    <h2 className="font-display font-bold text-2xl uppercase">Top 3</h2>
                  </div>
                  <p className="text-sm text-royal/60 mt-1">Kun de sterkeste lagene vises her.</p>
                </div>
                <Link
                  to="/team-competition/challenges"
                  className="bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors"
                >
                  Spill challenges
                </Link>
              </div>

              {topThree.length === 0 ? (
                <div className="border border-dashed border-royal/20 p-8 text-center text-royal/60">
                  Ingen busslag funnet enda. Oppdater bussinndeling i Grupper-siden.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((row, idx) => {
                    const rank = idx + 1;
                    const rankStyle = PODIUM_STYLES[idx];
                    const Icon = rankStyle.icon;
                    const progress = leaderStars > 0 ? Math.round((row.stars / leaderStars) * 100) : 0;
                    return (
                      <article key={row.team.id} className={`border p-5 transition-transform hover:-translate-y-0.5 ${rankStyle.cardClass}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="type-label-wide text-royal/70">#{rank}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-royal/70">
                            <Icon size={12} />
                            {rankStyle.badge}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-xl text-royal uppercase mt-1">{row.team.name}</h3>
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 border border-royal/10 text-royal px-3 py-1">
                          <Star size={14} className="fill-current" />
                          <span className="font-mono text-sm font-bold">{row.stars}</span>
                        </div>
                        <p className="text-sm text-royal/70 mt-2">{row.approvedChallenges} godkjente challenges</p>
                        <div className="mt-3">
                          <div className="h-1.5 bg-white/70 border border-white/80 rounded-full overflow-hidden">
                            <div className={`h-full transition-[width] duration-700 ${rankStyle.progressClass}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="bg-white border border-royal/10 p-5">
                <p className="type-label-wide text-royal/50">Ditt lag</p>
                {myTeam ? (
                  <>
                    <h3 className="font-display font-bold text-xl text-royal uppercase mt-1">{myTeam.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-royal/70">
                      <span>Rangering: {myTeamRank ? `#${myTeamRank}` : '-'}</span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="fill-current text-royal" />
                        <strong className="text-royal">{myTeamRow?.stars ?? 0}</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-royal/60 mt-2">Ingen bussgruppe koblet til bruker enda.</p>
                )}
              </article>
              <article className="bg-white border border-royal/10 p-5">
                <p className="type-label-wide text-royal/50">Live meta</p>
                <div className="mt-2 flex items-center gap-2 text-royal">
                  <Target size={16} />
                  <p className="text-sm">
                    {challengeStats.approved} av {challengeStats.total} challenges er godkjent for laget ditt.
                  </p>
                </div>
              </article>
            </section>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            {!myTeam ? (
              <div className="bg-white border border-dashed border-royal/20 p-8 text-royal/60">
                Du er ikke i en bussgruppe enda. Sjekk Grupper-siden eller kontakt admin.
              </div>
            ) : (
              <div className="bg-white border border-royal/10 p-5 space-y-4">
                <div className="space-y-1">
                  <p className="type-label-wide text-royal/50">Ditt lag</p>
                  <h2 className="font-display font-bold text-2xl text-royal uppercase">{myTeam.name}</h2>
                  {myTeam.leaderUserId && (
                    <p className="text-sm text-royal/70">
                      Lagleder:{' '}
                      {users.find((user) => user.id === myTeam.leaderUserId)?.displayName ||
                        users.find((user) => user.id === myTeam.leaderUserId)?.fullName ||
                        'Ukjent'}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="border border-royal/10 bg-royal/[0.03] p-3">
                    <p className="type-label-wide text-royal/50">Godkjent</p>
                    <p className="font-display text-xl font-bold text-royal">{challengeStats.approved}</p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50/50 p-3">
                    <p className="type-label-wide text-amber-700/80">Venter</p>
                    <p className="font-display text-xl font-bold text-amber-700">{challengeStats.pending}</p>
                  </div>
                  <div className="border border-rose-200 bg-rose-50/50 p-3">
                    <p className="type-label-wide text-rose-700/80">Avvist</p>
                    <p className="font-display text-xl font-bold text-rose-700">{challengeStats.rejected}</p>
                  </div>
                  <div className="border border-royal/10 bg-white p-3">
                    <p className="type-label-wide text-royal/50">Ikke sendt</p>
                    <p className="font-display text-xl font-bold text-royal">{challengeStats.todo}</p>
                  </div>
                </div>
              </div>
            )}

            {myTeam && (
              <div className="bg-white border border-royal/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'todo', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setChallengeFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-mono uppercase border transition-colors ${
                        challengeFilter === filter
                          ? 'bg-royal text-white border-royal'
                          : 'border-royal/20 text-royal hover:border-royal/40 bg-white'
                      }`}
                    >
                      {filterLabel(filter)} ({filterCounts[filter]})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visibleChallenges.length === 0 ? (
              <div className="bg-white border border-dashed border-royal/20 p-8 text-royal/60">
                Ingen synlige challenges enda.
              </div>
            ) : filteredChallenges.length === 0 ? (
              <div className="bg-white border border-dashed border-royal/20 p-8 text-royal/60">
                Ingen challenges matcher filteret.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredChallenges.map((challenge) => {
                  const status = myTeam ? submissionMap.get(`${myTeam.id}:${challenge.id}`) : undefined;
                  return (
                    <article key={challenge.id} className="bg-white border border-royal/10 p-5 space-y-4 transition-shadow hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-xl text-royal uppercase">{challenge.title}</h3>
                          {challenge.description && (
                            <p className="text-sm text-royal/70 mt-1 whitespace-pre-wrap">{challenge.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 rounded-full bg-royal/10 text-royal px-3 py-1 flex items-center gap-1">
                          <Star size={14} className="fill-current" />
                          <span className="font-mono text-sm font-bold">{challenge.stars}</span>
                        </div>
                      </div>

                      <div className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase border ${statusTone(status)}`}>
                        {status === 'approved' && <CheckCircle2 size={14} />}
                        {status === 'pending' && <Clock3 size={14} />}
                        {status === 'rejected' && <XCircle size={14} />}
                        {!status && <Sparkles size={14} />}
                        {statusLabel(status)}
                      </div>

                      {myTeam && (
                        <div className="pt-1">
                          {isTeamLeader ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {(status === undefined || status === 'rejected') && (
                                <button
                                  type="button"
                                  onClick={() => saveChallengeStatus(challenge.id, 'pending')}
                                  disabled={savingChallengeId === challenge.id}
                                  className="bg-royal text-white px-3 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors disabled:opacity-60"
                                >
                                  Marker som gjennomfort
                                </button>
                              )}
                              {status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => saveChallengeStatus(challenge.id, null)}
                                  disabled={savingChallengeId === challenge.id}
                                  className="border border-royal/20 text-royal px-3 py-2 text-xs font-mono uppercase hover:border-royal/40 transition-colors disabled:opacity-60"
                                >
                                  Trekk tilbake
                                </button>
                              )}
                              {status === 'approved' && (
                                <p className="text-sm text-emerald-700">Godkjent av admin.</p>
                              )}
                              {savingChallengeId === challenge.id && (
                                <p className="text-xs text-royal/50 font-mono uppercase">Lagrer...</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-royal/60">
                              Kun lagleder kan sende inn challenge for godkjenning.
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
