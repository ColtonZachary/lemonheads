"use client";

import { useActionState } from "react";

import {
  inviteHubUser,
  removeHubAccess,
  updateHubProfile,
  type HubManagersActionState,
} from "@/app/actions/hub-managers";
import { Button } from "@/components/ui/button";
import {
  canDeactivateHubUser,
  canInviteHubRole,
} from "@/lib/hub/hub-access-permissions";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const EMPTY: HubManagersActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export type HubProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  active: boolean;
};

function ProfileEditForm({
  profile,
  currentUserId,
  viewerRole,
}: {
  profile: HubProfileRow;
  currentUserId: string;
  viewerRole: UserRole;
}) {
  const [state, action, pending] = useActionState(
    updateHubProfile.bind(null, profile.id),
    EMPTY,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeHubAccess.bind(null, profile.id),
    EMPTY,
  );
  const isSelf = profile.id === currentUserId;
  const isAdminViewer = viewerRole === "admin";
  const mayRemove =
    profile.active && canDeactivateHubUser({ id: currentUserId, role: viewerRole }, profile);

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Full name</span>
            <input
              name="full_name"
              required
              defaultValue={profile.full_name}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Phone</span>
            <input name="phone" defaultValue={profile.phone} className={fieldClass} />
          </label>
          {isAdminViewer ? (
            <label className="block">
              <span className={labelClass}>Role</span>
              <select
                name="role"
                defaultValue={profile.role}
                className={fieldClass}
                disabled={isSelf}
              >
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="detailer">detailer</option>
              </select>
            </label>
          ) : (
            <input type="hidden" name="role" value="detailer" />
          )}
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={profile.active}
              disabled={isSelf || !mayRemove}
              className="size-4"
            />
            Active (can sign in)
          </label>
        </div>
        <p className="font-mono text-[9px] text-text/35">{profile.email}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={pending}
            className="h-auto min-h-0 px-3 py-1.5 text-xs"
          >
            {pending ? "Saving…" : "Save profile"}
          </Button>
          {mayRemove ? (
            <Button
              type="submit"
              formAction={removeAction}
              disabled={removePending}
              variant="outline"
              className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
            >
              {removePending ? "Removing…" : "Remove access"}
            </Button>
          ) : null}
        </div>
      </form>
      {(state.message || removeState.message) && (
        <p
          className={cn(
            "font-mono text-xs",
            state.ok || removeState.ok ? "text-y" : "text-red-200",
          )}
        >
          {removeState.message || state.message}
        </p>
      )}
    </div>
  );
}

export function ManagersPanel({
  profiles,
  currentUserId,
  viewerRole,
}: {
  profiles: HubProfileRow[];
  currentUserId: string;
  viewerRole: UserRole;
}) {
  const isAdmin = viewerRole === "admin";
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteHubUser,
    EMPTY,
  );

  const active = profiles.filter((p) => p.active);
  const inactive = profiles.filter((p) => !p.active);

  return (
    <div className="space-y-10">
      {isAdmin || canInviteHubRole(viewerRole, "detailer") ? (
        <form action={inviteAction} className="rounded-md border border-white/10 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
            Invite hub user
          </h2>
          <p className="mt-1 text-sm text-text/45">
            {isAdmin
              ? "Sends a Supabase email invite. They click Accept invitation, set a password, then sign in at /login."
              : "Invite a detailer — they set a password from the email, then use /login."}
          </p>
          <p className="mt-2 font-mono text-[9px] leading-relaxed text-text/35">
            Supabase → Authentication → URL configuration: Site URL must be your
            Vercel app (not the marketing site). Add redirect URL{" "}
            <span className="text-text/50">/auth/confirm</span> and{" "}
            <span className="text-text/50">/auth/callback</span>. Invite email
            template should link to /auth/confirm (see docs).
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Email *</span>
              <input name="email" type="email" required className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Full name *</span>
              <input name="full_name" required className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <input name="phone" type="tel" className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Role *</span>
              {isAdmin ? (
                <select name="role" className={fieldClass} defaultValue="manager">
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                  <option value="detailer">detailer</option>
                </select>
              ) : (
                <>
                  <input type="hidden" name="role" value="detailer" />
                  <p className="mt-2 font-mono text-sm text-text/50">detailer</p>
                </>
              )}
            </label>
          </div>

          <Button type="submit" className="mt-6" disabled={invitePending}>
            {invitePending ? "Sending…" : "Send invite"}
          </Button>

          {inviteState.message && (
            <p
              className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
                inviteState.ok
                  ? "border-y/30 bg-y/10 text-y"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
            >
              {inviteState.message}
            </p>
          )}
        </form>
      ) : null}

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Active accounts ({active.length})
        </h3>
        <ul className="mt-4 space-y-4">
          {active.map((profile) => (
            <li key={profile.id} className="rounded-md border border-white/10 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-sm text-y/85">{profile.full_name}</div>
                <span className="rounded bg-y/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-y/70">
                  {profile.role}
                </span>
              </div>
              <ProfileEditForm
                profile={profile}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
              />
            </li>
          ))}
          {!active.length ? (
            <li className="rounded-md border border-dashed border-white/10 p-8 text-center font-mono text-xs text-text/40">
              No active accounts in this list.
            </li>
          ) : null}
        </ul>
      </section>

      {inactive.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Access removed ({inactive.length})
          </h3>
          <ul className="mt-4 space-y-4">
            {inactive.map((profile) => (
              <li
                key={profile.id}
                className="rounded-md border border-white/5 px-4 py-4 opacity-70"
              >
                <div className="font-mono text-sm text-text/55">{profile.full_name}</div>
                <ProfileEditForm
                  profile={profile}
                  currentUserId={currentUserId}
                  viewerRole={viewerRole}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
