"use client";

import { useActionState, useState } from "react";

import {
  deleteHubUserPermanently,
  inviteHubUser,
  removeHubAccess,
  updateHubProfile,
  type HubManagersActionState,
} from "@/app/actions/hub-managers";
import { Button } from "@/components/ui/button";
import {
  canDeactivateHubUser,
  canDeleteHubUser,
  canInviteHubRole,
} from "@/lib/hub/hub-access-permissions";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const EMPTY: HubManagersActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
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
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteHubUserPermanently.bind(null, profile.id),
    EMPTY,
  );
  const isSelf = profile.id === currentUserId;
  const isAdminViewer = viewerRole === "admin";
  const actor = { id: currentUserId, role: viewerRole };
  const mayRemove = profile.active && canDeactivateHubUser(actor, profile);
  const mayDelete = !isSelf && canDeleteHubUser(actor, profile);
  const busy = pending || removePending || deletePending;

  return (
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
          <label className="block">
            <span className={labelClass}>Role</span>
            <select
              name="role"
              defaultValue={profile.role}
              className={fieldClass}
              disabled={isSelf}
            >
              <option value="manager">manager</option>
              <option value="detailer">detailer</option>
            </select>
          </label>
        )}
        <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={profile.active}
            disabled={isSelf || !mayRemove}
            className="size-3.5"
          />
          Active (can sign in)
        </label>
      </div>
      <p className="mt-2 font-mono text-[9px] text-text/40">{profile.email}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </Button>
        {mayRemove ? (
          <Button
            type="submit"
            formAction={removeAction}
            disabled={busy}
            variant="outline"
            className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          >
            {removePending ? "…" : "Remove access"}
          </Button>
        ) : null}
        {mayDelete ? (
          <Button
            type="submit"
            formAction={deleteAction}
            disabled={busy}
            variant="outline"
            className="h-auto min-h-0 border-red-500/40 px-3 py-1.5 text-xs text-red-300"
            onClick={(e) => {
              if (
                !confirm(
                  `Permanently delete ${profile.full_name}? Same email can be invited again.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {deletePending ? "…" : "Delete"}
          </Button>
        ) : null}
      </div>

      {(state.message || removeState.message || deleteState.message) && (
        <p
          className={cn(
            "mt-2 font-mono text-[10px]",
            state.ok || removeState.ok || deleteState.ok
              ? "text-y"
              : "text-red-200",
          )}
        >
          {deleteState.message || removeState.message || state.message}
        </p>
      )}
    </form>
  );
}

function ProfileListRow({
  profile,
  expanded,
  onToggleEdit,
  currentUserId,
  viewerRole,
  isSelf,
}: {
  profile: HubProfileRow;
  expanded: boolean;
  onToggleEdit: () => void;
  currentUserId: string;
  viewerRole: UserRole;
  isSelf?: boolean;
}) {
  return (
    <li
      className={cn(
        "overflow-hidden rounded-lg border",
        profile.active ? "border-white/10" : "border-white/5 opacity-75",
        expanded && "border-y/25",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm text-y/90">{profile.full_name}</span>
            {isSelf ? (
              <span className="font-mono text-[8px] uppercase text-text/40">You</span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-y/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-y/70">
              {profile.role}
            </span>
            <span className="truncate font-mono text-[9px] text-text/45">{profile.email}</span>
            {!profile.active ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] text-text/50">
                Access removed
              </span>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-0 shrink-0 px-2 py-1 text-[10px]"
          onClick={onToggleEdit}
        >
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? (
        <ProfileEditForm
          profile={profile}
          currentUserId={currentUserId}
          viewerRole={viewerRole}
        />
      ) : null}
    </li>
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
  const canInvite =
    isAdmin ||
    canInviteHubRole(viewerRole, "manager") ||
    canInviteHubRole(viewerRole, "detailer");
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteHubUser,
    EMPTY,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = profiles.filter((p) => p.active);
  const inactive = profiles.filter((p) => !p.active);
  const managers = active.filter((p) => p.role === "manager" || p.role === "admin").length;
  const detailers = active.filter((p) => p.role === "detailer").length;

  const toggleEdit = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Active</p>
          <p className="font-display text-2xl text-y">{active.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Managers</p>
          <p className="font-display text-2xl text-y">{managers}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Detailers</p>
          <p className="font-display text-2xl text-y">{detailers}</p>
        </div>
      </div>

      {canInvite ? (
        <details className="rounded-lg border border-white/10 bg-card/30">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
            + Invite hub user
          </summary>
          <form action={inviteAction} className="border-t border-white/10 px-4 py-4">
            <details className="mb-3 text-[10px] text-text/40">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-text/45">
                Email setup notes
              </summary>
              <p className="mt-2 leading-relaxed">
                Supabase → Authentication → URL configuration: Site URL = your Vercel app.
                Redirect URLs: /auth/confirm and /auth/callback.
              </p>
            </details>
            <div className="grid gap-2.5 sm:grid-cols-2">
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
                  <select name="role" className={fieldClass} defaultValue="manager">
                    <option value="manager">manager</option>
                    <option value="detailer">detailer</option>
                  </select>
                )}
              </label>
            </div>
            <Button
              type="submit"
              className="mt-4 h-auto min-h-0 px-4 py-2 text-xs"
              disabled={invitePending}
            >
              {invitePending ? "Sending…" : "Send invite"}
            </Button>
            {inviteState.message ? (
              <p
                className={cn(
                  "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
                  inviteState.ok
                    ? "border-y/30 bg-y/10 text-y"
                    : "border-red-500/30 bg-red-500/10 text-red-200",
                )}
              >
                {inviteState.message}
              </p>
            ) : null}
          </form>
        </details>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Accounts
          </h2>
          <span className="font-mono text-[9px] text-text/35">Tap Edit to change role or access</span>
        </div>
        {!active.length && !inactive.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No hub users yet. Expand &ldquo;Invite hub user&rdquo; above.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((profile) => (
              <ProfileListRow
                key={profile.id}
                profile={profile}
                expanded={expandedId === profile.id}
                onToggleEdit={() => toggleEdit(profile.id)}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
                isSelf={profile.id === currentUserId}
              />
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 ? (
        <details className="rounded-lg border border-white/5">
          <summary className="cursor-pointer list-none px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text/45 [&::-webkit-details-marker]:hidden">
            Access removed ({inactive.length}) — delete to re-use email
          </summary>
          <ul className="space-y-2 border-t border-white/5 px-3 py-3">
            {inactive.map((profile) => (
              <ProfileListRow
                key={profile.id}
                profile={profile}
                expanded={expandedId === profile.id}
                onToggleEdit={() => toggleEdit(profile.id)}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
