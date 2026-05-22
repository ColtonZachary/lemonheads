import type { Profile } from "@/lib/auth/profile";
import type { UserRole } from "@/lib/auth/types";

export type HubAccessTarget = {
  id: string;
  role: UserRole;
  active: boolean;
};

export function canViewHubAccessPage(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

/** Admins see everyone; managers see managers and detailers only. */
export function filterProfilesForViewer(
  profiles: HubAccessTarget[],
  viewerRole: UserRole,
): HubAccessTarget[] {
  if (viewerRole === "admin") return profiles;
  return profiles.filter((p) => p.role === "detailer" || p.role === "manager");
}

function isManagerScopedTarget(role: UserRole): boolean {
  return role === "detailer" || role === "manager";
}

export function canManageHubUser(
  actor: Pick<Profile, "id" | "role">,
  target: HubAccessTarget,
): boolean {
  if (actor.id === target.id) return true;
  if (actor.role === "admin") return true;
  if (actor.role === "manager") return isManagerScopedTarget(target.role);
  return false;
}

export function canDeactivateHubUser(
  actor: Pick<Profile, "id" | "role">,
  target: HubAccessTarget,
): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "manager") return isManagerScopedTarget(target.role);
  return false;
}

/** Same rules as deactivate — removes Auth user so the email can be invited again. */
export function canDeleteHubUser(
  actor: Pick<Profile, "id" | "role">,
  target: HubAccessTarget,
): boolean {
  return canDeactivateHubUser(actor, target);
}

export function canChangeHubUserRole(
  actor: Pick<Profile, "role">,
  target: HubAccessTarget,
  newRole: UserRole,
): boolean {
  if (actor.role === "admin") return true;
  if (actor.role === "manager") {
    if (newRole === "admin" || target.role === "admin") return false;
    return newRole === "detailer" || newRole === "manager";
  }
  return false;
}

export function canInviteHubRole(actorRole: UserRole, inviteRole: UserRole): boolean {
  if (actorRole === "admin") return true;
  if (actorRole === "manager") {
    return inviteRole === "detailer" || inviteRole === "manager";
  }
  return false;
}
