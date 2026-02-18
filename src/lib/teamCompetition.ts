export type CompetitionSubmissionStatus = 'pending' | 'approved' | 'rejected';
import type { User } from '../types';

export interface CompetitionTeam {
  id: string;
  name: string;
  leaderUserId?: string;
  memberUserIds: string[];
}

export interface CompetitionChallenge {
  id: string;
  title: string;
  description?: string;
  stars: number;
  isActive: boolean;
  participantVisible: boolean;
}

export interface CompetitionSubmission {
  id: string;
  teamId: string;
  challengeId: string;
  status: CompetitionSubmissionStatus;
  updatedAt: string;
  updatedByUserId?: string;
}

export interface TeamCompetitionData {
  teams: CompetitionTeam[];
  challenges: CompetitionChallenge[];
  submissions: CompetitionSubmission[];
}

export interface BusGroup {
  title: string;
  members: string[];
}

export const TEAM_COMPETITION_PAGE_SLUG = 'team-competition';

export const DEFAULT_TEAM_COMPETITION_DATA: TeamCompetitionData = {
  teams: [],
  challenges: [],
  submissions: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const VALID_STATUSES: CompetitionSubmissionStatus[] = ['pending', 'approved', 'rejected'];

function parseTeam(value: unknown): CompetitionTeam | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const memberUserIds = Array.isArray(value.memberUserIds)
    ? value.memberUserIds.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    id: value.id,
    name: value.name,
    leaderUserId: typeof value.leaderUserId === 'string' ? value.leaderUserId : undefined,
    memberUserIds,
  };
}

function parseChallenge(value: unknown): CompetitionChallenge | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null;
  const starsNumber = Number(value.stars);
  const stars = Number.isFinite(starsNumber) ? Math.max(1, Math.round(starsNumber)) : 1;
  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : undefined,
    stars,
    isActive: value.isActive === undefined ? true : Boolean(value.isActive),
    participantVisible: value.participantVisible === undefined ? true : Boolean(value.participantVisible),
  };
}

function parseSubmission(value: unknown): CompetitionSubmission | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.teamId !== 'string' ||
    typeof value.challengeId !== 'string' ||
    typeof value.status !== 'string'
  ) {
    return null;
  }
  if (!VALID_STATUSES.includes(value.status as CompetitionSubmissionStatus)) return null;
  return {
    id: value.id,
    teamId: value.teamId,
    challengeId: value.challengeId,
    status: value.status as CompetitionSubmissionStatus,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    updatedByUserId: typeof value.updatedByUserId === 'string' ? value.updatedByUserId : undefined,
  };
}

export function parseTeamCompetitionData(rawContent: string | undefined): TeamCompetitionData {
  if (!rawContent?.trim()) return DEFAULT_TEAM_COMPETITION_DATA;
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (!isRecord(parsed)) return DEFAULT_TEAM_COMPETITION_DATA;
    const teams = Array.isArray(parsed.teams) ? parsed.teams.map(parseTeam).filter((row): row is CompetitionTeam => row !== null) : [];
    const challenges = Array.isArray(parsed.challenges)
      ? parsed.challenges.map(parseChallenge).filter((row): row is CompetitionChallenge => row !== null)
      : [];
    const submissions = Array.isArray(parsed.submissions)
      ? parsed.submissions.map(parseSubmission).filter((row): row is CompetitionSubmission => row !== null)
      : [];
    return { teams, challenges, submissions };
  } catch {
    return DEFAULT_TEAM_COMPETITION_DATA;
  }
}

export function serializeTeamCompetitionData(data: TeamCompetitionData): string {
  return JSON.stringify(data);
}

export function createCompetitionChallenge(title = 'Ny challenge'): CompetitionChallenge {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    stars: 3,
    isActive: true,
    participantVisible: true,
  };
}

export function upsertSubmissionStatus(
  submissions: CompetitionSubmission[],
  params: {
    teamId: string;
    challengeId: string;
    status: CompetitionSubmissionStatus | null;
    updatedByUserId?: string;
  }
): CompetitionSubmission[] {
  const { teamId, challengeId, status, updatedByUserId } = params;
  const idx = submissions.findIndex((s) => s.teamId === teamId && s.challengeId === challengeId);
  if (status === null) {
    if (idx < 0) return submissions;
    return submissions.filter((_, index) => index !== idx);
  }
  if (idx < 0) {
    return [
      ...submissions,
      {
        id: crypto.randomUUID(),
        teamId,
        challengeId,
        status,
        updatedAt: new Date().toISOString(),
        updatedByUserId,
      },
    ];
  }
  return submissions.map((submission, index) =>
    index === idx
      ? {
          ...submission,
          status,
          updatedAt: new Date().toISOString(),
          updatedByUserId,
        }
      : submission
  );
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function toGivenFirstFromSurnameFirst(value: string): string | null {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const surname = parts[0];
  const given = parts.slice(1).join(' ');
  if (!surname || !given) return null;
  return normalizeName(`${given} ${surname}`);
}

function toSurnameFirstFromGivenFirst(value: string): string | null {
  if (value.includes(',')) return null;
  const parts = value.split(' ').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const surname = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(' ');
  if (!surname || !given) return null;
  return normalizeName(`${surname}, ${given}`);
}

function buildNameLookupKeys(rawName: string): string[] {
  const normalized = normalizeName(rawName);
  if (!normalized) return [];

  const keys = new Set<string>();
  keys.add(normalized);
  keys.add(normalized.replace(/,\s*/g, ' '));

  const givenFirst = toGivenFirstFromSurnameFirst(normalized);
  if (givenFirst) {
    keys.add(givenFirst);
    keys.add(givenFirst.replace(/,\s*/g, ' '));
  }

  const surnameFirst = toSurnameFirstFromGivenFirst(normalized);
  if (surnameFirst) {
    keys.add(surnameFirst);
    keys.add(surnameFirst.replace(/,\s*/g, ' '));
  }

  return Array.from(keys);
}

function slugifyTeamTitle(value: string): string {
  const normalized = normalizeName(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'gruppe';
}

export function parseBusGroups(rawContent: string | undefined): BusGroup[] {
  if (!rawContent) return [];
  try {
    const parsed = JSON.parse(rawContent) as { bus?: string };
    const text = parsed.bus ?? '';
    if (!text.trim()) return [];
    return text
      .split(/\n\s*\n/)
      .map((block) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length === 0) return null;
        return {
          title: lines[0],
          members: lines.slice(1),
        };
      })
      .filter((row): row is BusGroup => row !== null);
  } catch {
    return [];
  }
}

export function deriveCompetitionTeamsFromBusGroups(params: {
  groupsRawContent: string | undefined;
  users: User[];
  storedTeams: CompetitionTeam[];
}): CompetitionTeam[] {
  const { groupsRawContent, users, storedTeams } = params;
  const busGroups = parseBusGroups(groupsRawContent);
  if (busGroups.length === 0) return [];

  const leaderByTeamId = new Map(storedTeams.map((team) => [team.id, team.leaderUserId]));
  const userIdByNormalizedName = new Map<string, string>();
  for (const user of users) {
    for (const key of buildNameLookupKeys(user.fullName)) {
      if (!userIdByNormalizedName.has(key)) userIdByNormalizedName.set(key, user.id);
    }
    if (user.displayName) {
      for (const key of buildNameLookupKeys(user.displayName)) {
        if (!userIdByNormalizedName.has(key)) userIdByNormalizedName.set(key, user.id);
      }
    }
  }

  const titleCounter = new Map<string, number>();

  return busGroups.map((group) => {
    const baseSlug = slugifyTeamTitle(group.title);
    const seen = (titleCounter.get(baseSlug) ?? 0) + 1;
    titleCounter.set(baseSlug, seen);
    const id = `bus-${baseSlug}-${seen}`;

    const memberUserIds = Array.from(
      new Set(
        group.members
          .map((memberName) =>
            buildNameLookupKeys(memberName)
              .map((key) => userIdByNormalizedName.get(key))
              .find((userId): userId is string => Boolean(userId))
          )
          .filter((userId): userId is string => Boolean(userId))
      )
    );
    const currentLeader = leaderByTeamId.get(id);
    const leaderUserId = currentLeader && memberUserIds.includes(currentLeader) ? currentLeader : undefined;

    return {
      id,
      name: group.title,
      leaderUserId,
      memberUserIds,
    };
  });
}
