import { api } from './api';

export interface AddMemberPayload {
  email: string;
  role?: 'admin' | 'member';
}

export interface RemoveMemberPayload {
  email: string;
}

export interface UpdateMemberRolePayload {
  email: string;
  role: 'admin' | 'member';
}

/**
 * Add a member to a team (admin-only)
 */
export async function addTeamMember(teamId: string, payload: AddMemberPayload) {
  return api(`/api/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Remove a member from a team (admin-only)
 */
export async function removeTeamMember(teamId: string, payload: RemoveMemberPayload) {
  return api(`/api/teams/${teamId}/members`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

/**
 * Update a member's role in a team (admin-only)
 */
export async function updateTeamMemberRole(teamId: string, payload: UpdateMemberRolePayload) {
  return api(`/api/teams/${teamId}/members/update-role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
