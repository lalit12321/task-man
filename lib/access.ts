import { HttpError } from './auth';
import { TeamDoc } from './db';

export function getTeamMember(team: TeamDoc, userId: string) {
  return team.members.find((member) => member.userId === userId) ?? null;
}

export function requireTeamMember(team: TeamDoc, userId: string) {
  const member = getTeamMember(team, userId);
  if (!member) throw new HttpError(403, 'You are not a member of this team');
  return member;
}

export function requireTeamAdmin(team: TeamDoc, userId: string) {
  const member = requireTeamMember(team, userId);
  if (member.role !== 'admin') {
    throw new HttpError(403, 'Only team admins can perform this action');
  }
  return member;
}
