import { apiFetch } from './api';
import { Team, TeamRole } from './types';

export async function listMyTeams(): Promise<Team[]> {
  const { teams } = await apiFetch<{ teams: Team[] }>('/api/teams');
  return teams;
}

export async function getTeam(id: string): Promise<Team> {
  const { team } = await apiFetch<{ team: Team }>(`/api/teams/${id}`);
  return team;
}

export async function createTeam(input: { name: string; description: string }): Promise<Team> {
  const { team } = await apiFetch<{ team: Team }>('/api/teams', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return team;
}

export async function joinTeamByCode(inviteCode: string): Promise<Team> {
  const { team } = await apiFetch<{ team: Team }>('/api/teams/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
  return team;
}

export async function leaveTeam(teamId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/leave`, { method: 'POST' });
}

export async function deleteTeam(teamId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}`, { method: 'DELETE' });
}

export async function regenerateInviteCode(teamId: string): Promise<string> {
  const { inviteCode } = await apiFetch<{ inviteCode: string }>(`/api/teams/${teamId}/regenerate-code`, {
    method: 'POST',
  });
  return inviteCode;
}

export async function updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<Team> {
  const { team } = await apiFetch<{ team: Team }>(
    `/api/teams/${teamId}/members/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );
  return team;
}
