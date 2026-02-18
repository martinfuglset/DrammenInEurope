import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Plus,
  Star,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { useStore, selectIsAdmin } from '../store';
import {
  TEAM_COMPETITION_PAGE_SLUG,
  createCompetitionChallenge,
  deriveCompetitionTeamsFromBusGroups,
  parseTeamCompetitionData,
  serializeTeamCompetitionData,
  upsertSubmissionStatus,
  type CompetitionSubmissionStatus,
  type TeamCompetitionData,
  type CompetitionTeam,
} from '../lib/teamCompetition';

function statusTone(status: CompetitionSubmissionStatus | undefined) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-royal/5 text-royal/60 border-royal/10';
}

function statusLabel(status: CompetitionSubmissionStatus | undefined) {
  if (status === 'approved') return 'Godkjent';
  if (status === 'pending') return 'Venter';
  if (status === 'rejected') return 'Avvist';
  return 'Ingen';
}

export function AdminTeamCompetitionView() {
  const isAdmin = useStore(selectIsAdmin);
  const { infoPages, updateInfoPage, users, currentUser } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedStatusTeamId, setSelectedStatusTeamId] = useState<string>('');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSavesRef = useRef(0);

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

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.displayName || user.fullName]));
  }, [users]);

  const challengeById = useMemo(
    () => new Map(competition.challenges.map((challenge) => [challenge.id, challenge])),
    [competition.challenges]
  );

  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

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
          return sum + (challengeById.get(submission.challengeId)?.stars ?? 0);
        }, 0);
        return { teamId: team.id, stars };
      })
      .sort((a, b) => b.stars - a.stars || (teamById.get(a.teamId)?.name || '').localeCompare(teamById.get(b.teamId)?.name || ''));
  }, [challengeById, competition.submissions, teamById, teams]);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  const statusCounts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const submission of competition.submissions) {
      if (!teamById.has(submission.teamId) || !challengeById.has(submission.challengeId)) continue;
      if (submission.status === 'pending') pending += 1;
      if (submission.status === 'approved') approved += 1;
      if (submission.status === 'rejected') rejected += 1;
    }

    return { pending, approved, rejected };
  }, [challengeById, competition.submissions, teamById]);

  const selectedStatusTeam = useMemo(
    () => teams.find((team) => team.id === selectedStatusTeamId) ?? null,
    [selectedStatusTeamId, teams]
  );

  useEffect(() => {
    if (teams.length === 0) {
      if (selectedStatusTeamId !== '') setSelectedStatusTeamId('');
      return;
    }
    if (!selectedStatusTeamId || !teams.some((team) => team.id === selectedStatusTeamId)) {
      setSelectedStatusTeamId(teams[0].id);
    }
  }, [selectedStatusTeamId, teams]);

  const persistCompetition = (nextData: TeamCompetitionData) => {
    pendingSavesRef.current += 1;
    setIsSaving(true);
    setSaveError(null);

    const nextSave = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await updateInfoPage(TEAM_COMPETITION_PAGE_SLUG, serializeTeamCompetitionData(nextData));
      })
      .catch((err) => {
        console.error(err);
        setSaveError('Kunne ikke lagre endringer akkurat na.');
      })
      .finally(() => {
        pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
        if (pendingSavesRef.current === 0) setIsSaving(false);
      });

    saveQueueRef.current = nextSave;
  };

  const setTeamsAndPersist = (nextTeams: CompetitionTeam[], overrides?: Partial<TeamCompetitionData>) => {
    persistCompetition({
      teams: nextTeams,
      challenges: overrides?.challenges ?? competition.challenges,
      submissions: overrides?.submissions ?? competition.submissions,
    });
  };

  const setTeamLeader = (teamId: string, leaderUserId: string | undefined) => {
    const team = teams.find((row) => row.id === teamId);
    if (!team) return;
    if (leaderUserId && !team.memberUserIds.includes(leaderUserId)) return;
    const nextTeams = teams.map((row) =>
      row.id === teamId ? { ...row, leaderUserId } : row
    );
    setTeamsAndPersist(nextTeams);
  };

  const updateChallenge = (
    challengeId: string,
    updater: (challenge: TeamCompetitionData['challenges'][number]) => TeamCompetitionData['challenges'][number]
  ) => {
    const nextChallenges = competition.challenges.map((challenge) =>
      challenge.id === challengeId ? updater(challenge) : challenge
    );
    setTeamsAndPersist(teams, { challenges: nextChallenges });
  };

  const setSubmissionStatus = (teamId: string, challengeId: string, status: CompetitionSubmissionStatus | null) => {
    const nextSubmissions = upsertSubmissionStatus(competition.submissions, {
      teamId,
      challengeId,
      status,
      updatedByUserId: currentUser?.id,
    });
    setTeamsAndPersist(teams, { submissions: nextSubmissions });
  };

  const removeChallenge = (challengeId: string) => {
    const nextChallenges = competition.challenges.filter((challenge) => challenge.id !== challengeId);
    const nextSubmissions = competition.submissions.filter((submission) => submission.challengeId !== challengeId);
    setTeamsAndPersist(teams, { challenges: nextChallenges, submissions: nextSubmissions });
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">
      <header className="space-y-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-royal/60 hover:text-royal transition-colors">
          <ArrowLeft size={18} />
          <span className="type-label">Tilbake til dashboard</span>
        </Link>
        <div className="bg-white border border-royal/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="type-label-wide text-royal/50">Planlegging og administrasjon</p>
              <h1 className="font-display font-bold text-3xl text-royal uppercase">Star Clash</h1>
              <p className="text-sm text-royal/70 mt-2 max-w-3xl">
                Lag hentes fra <strong>Grupper - Bussinndeling</strong>. Medlemmer styres der. Her velger du kun lagleder
                (fra gruppens medlemmer), oppretter challenges og godkjenner innsendinger.
              </p>
            </div>
            <div className="text-right">
              <p className="type-label-wide text-royal/50">Status</p>
              <p className="text-sm text-royal/70">{isSaving ? 'Lagrer...' : 'Alle endringer lagres fortlopende'}</p>
              {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-display font-bold text-2xl text-royal uppercase flex items-center gap-2">
          <Trophy size={20} />
          Status og verifisering
        </h2>

        <div className="bg-white border border-royal/10 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-lg text-royal uppercase">Top 3 lag</h3>
            <span className="type-label-wide text-royal/50">Viser kun topp 3</span>
          </div>
          {topThree.length === 0 ? (
            <p className="text-sm text-royal/60">Ingen lag å vise enda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThree.map((row, index) => {
                const team = teamById.get(row.teamId);
                if (!team) return null;
                const rank = index + 1;
                const rankStyle =
                  rank === 1
                    ? 'border-amber-300 bg-amber-50/40'
                    : rank === 2
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-orange-300 bg-orange-50/40';
                return (
                  <article key={row.teamId} className={`border p-4 ${rankStyle}`}>
                    <p className="type-label-wide text-royal/50">#{rank}</p>
                    <h4 className="font-display font-bold text-xl text-royal uppercase mt-1">{team.name}</h4>
                    <p className="mt-2 flex items-center gap-1 text-royal">
                      <Star size={14} className="fill-current" />
                      <span className="font-mono font-bold">{row.stars}</span>
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-royal/10 p-4 space-y-3">
          <h3 className="font-display font-bold text-lg text-royal uppercase">Statusoppsummering</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-amber-200 bg-amber-50/60 px-3 py-3">
              <p className="type-label-wide text-amber-700/80">Venter godkjenning</p>
              <p className="font-display font-bold text-2xl text-amber-700">{statusCounts.pending}</p>
            </div>
            <div className="border border-emerald-200 bg-emerald-50/60 px-3 py-3">
              <p className="type-label-wide text-emerald-700/80">Godkjent</p>
              <p className="font-display font-bold text-2xl text-emerald-700">{statusCounts.approved}</p>
            </div>
            <div className="border border-rose-200 bg-rose-50/60 px-3 py-3">
              <p className="type-label-wide text-rose-700/80">Avvist</p>
              <p className="font-display font-bold text-2xl text-rose-700">{statusCounts.rejected}</p>
            </div>
          </div>
          <p className="text-sm text-royal/60">
            Bruk feltet under for å sette status per challenge for valgt lag.
          </p>
        </div>

        {selectedStatusTeam && competition.challenges.length > 0 && (
          <div className="bg-white border border-royal/10 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-royal uppercase">Detaljstatus per lag</h3>
              <label className="flex items-center gap-2 text-sm text-royal">
                <span className="type-label-wide text-royal/50">Lag</span>
                <select
                  value={selectedStatusTeamId}
                  onChange={(event) => setSelectedStatusTeamId(event.target.value)}
                  className="border border-royal/20 px-3 py-1.5 bg-white text-sm"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="space-y-2">
              {competition.challenges.map((challenge) => {
                const status = submissionMap.get(`${selectedStatusTeam.id}:${challenge.id}`);
                return (
                  <div key={challenge.id} className="border border-royal/10 px-3 py-2 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-royal font-semibold">{challenge.title}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase border ${statusTone(status)}`}>
                        {status === 'approved' && <CheckCircle2 size={12} />}
                        {status === 'pending' && <Clock3 size={12} />}
                        {status === 'rejected' && <XCircle size={12} />}
                        {statusLabel(status)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus(selectedStatusTeam.id, challenge.id, 'pending')}
                        className="border border-amber-300 text-amber-700 px-2 py-1 text-[10px] font-mono uppercase hover:bg-amber-50"
                      >
                        Venter
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus(selectedStatusTeam.id, challenge.id, 'approved')}
                        className="border border-emerald-300 text-emerald-700 px-2 py-1 text-[10px] font-mono uppercase hover:bg-emerald-50"
                      >
                        Godkjenn
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus(selectedStatusTeam.id, challenge.id, 'rejected')}
                        className="border border-rose-300 text-rose-700 px-2 py-1 text-[10px] font-mono uppercase hover:bg-rose-50"
                      >
                        Avvis
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus(selectedStatusTeam.id, challenge.id, null)}
                        className="border border-royal/20 text-royal px-2 py-1 text-[10px] font-mono uppercase hover:border-royal/40"
                      >
                        Nullstill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <details className="bg-white border border-royal/10">
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-royal font-display font-bold uppercase text-lg">
            <Users size={18} />
            Lagoppsett
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-royal/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-royal/70">
                Grupper og medlemmer kommer fra <strong>Grupper - Bussinndeling</strong>. Her velger du kun lagleder per gruppe.
              </p>
              <Link
                to="/groups"
                className="border border-royal/20 text-royal px-3 py-2 text-xs font-mono uppercase hover:border-royal/40 transition-colors"
              >
                Gå til Grupper
              </Link>
            </div>

            {teams.length === 0 ? (
              <div className="border border-dashed border-royal/20 p-8 text-royal/60">
                Fant ingen bussgrupper. Legg til bussinndeling under <Link to="/groups" className="underline">Grupper</Link>.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {teams.map((team) => {
                  const teamMembers = team.memberUserIds
                    .map((memberId) => ({ id: memberId, label: userNameById.get(memberId) ?? 'Ukjent deltaker' }))
                    .filter((row) => row.label.trim().length > 0);
                  return (
                    <article key={team.id} className="border border-royal/10 p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-xl text-royal uppercase">{team.name}</h3>
                          <p className="text-xs text-royal/60 mt-1">{teamMembers.length} medlemmer fra bussgruppen</p>
                        </div>
                      </div>

                      <label className="block">
                        <span className="type-label-wide text-royal/50">Lagleder</span>
                        <select
                          value={team.leaderUserId ?? ''}
                          onChange={(event) => setTeamLeader(team.id, event.target.value || undefined)}
                          className="mt-1 w-full border border-royal/20 px-3 py-2 text-sm bg-white"
                          disabled={teamMembers.length === 0}
                        >
                          <option value="">Ingen valgt</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <details className="rounded border border-royal/10">
                        <summary className="cursor-pointer px-3 py-2 text-sm text-royal font-medium">
                          Medlemmer ({teamMembers.length}) - styres i Grupper
                        </summary>
                        <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto border-t border-royal/10">
                          {teamMembers.length === 0 ? (
                            <p className="text-sm text-royal/60 col-span-full">
                              Ingen matchende medlemmer funnet. Sjekk at navn i bussgruppen matcher deltakerlisten.
                            </p>
                          ) : (
                            teamMembers.map((member) => (
                              <p key={member.id} className="text-sm text-royal/80">
                                {member.label}
                              </p>
                            ))
                          )}
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-bold text-2xl text-royal uppercase flex items-center gap-2">
            <Bus size={20} />
            Challenges
          </h2>
          <button
            type="button"
            onClick={() => {
              const nextChallenges = [...competition.challenges, createCompetitionChallenge()];
              setTeamsAndPersist(teams, { challenges: nextChallenges });
            }}
            className="bg-royal text-white px-3 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            Ny challenge
          </button>
        </div>

        {competition.challenges.length === 0 ? (
          <div className="bg-white border border-dashed border-royal/20 p-8 text-royal/60">
            Ingen challenges opprettet enda.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {competition.challenges.map((challenge) => (
              <article key={challenge.id} className="bg-white border border-royal/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_96px] gap-3 flex-1">
                    <input
                      type="text"
                      value={challenge.title}
                      onChange={(event) => updateChallenge(challenge.id, (row) => ({ ...row, title: event.target.value }))}
                      placeholder="Navn pa challenge"
                      className="border border-royal/20 px-3 py-2 text-sm"
                    />
                    <label className="block">
                      <span className="type-label-wide text-royal/50">Stjerner</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={challenge.stars}
                        onChange={(event) =>
                          updateChallenge(challenge.id, (row) => ({
                            ...row,
                            stars: Math.max(1, Math.round(Number(event.target.value) || 1)),
                          }))
                        }
                        className="mt-1 w-full border border-royal/20 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChallenge(challenge.id)}
                    className="p-2 text-royal/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Slett challenge"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <textarea
                  value={challenge.description ?? ''}
                  onChange={(event) => updateChallenge(challenge.id, (row) => ({ ...row, description: event.target.value }))}
                  placeholder="Kort beskrivelse av challenge"
                  className="w-full border border-royal/20 px-3 py-2 text-sm min-h-[90px]"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-royal/80">
                    <input
                      type="checkbox"
                      checked={challenge.isActive}
                      onChange={(event) => updateChallenge(challenge.id, (row) => ({ ...row, isActive: event.target.checked }))}
                    />
                    Aktiv
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-royal/80">
                    <input
                      type="checkbox"
                      checked={challenge.participantVisible}
                      onChange={(event) =>
                        updateChallenge(challenge.id, (row) => ({ ...row, participantVisible: event.target.checked }))
                      }
                    />
                    {challenge.participantVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    Synlig for deltakere
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
