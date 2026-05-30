"use client";

import { useActionState, useState } from "react";

import {
  deleteHubUserPermanently,
  inviteHubUser,
  removeHubAccess,
  updateHubProfile,
  type HubManagersActionState,
} from "@/app/actions/hub-managers";
import {
  HubActionAlert,
  HubDetailsSection,
  HubEmptyState,
  HubStatCard,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  canDeactivateHubUser,
  canDeleteHubUser,
  canInviteHubRole,
} from "@/lib/hub/hub-access-permissions";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const EMPTY: HubManagersActionState = { ok: false, message: "" };

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
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
      <HubFieldRow>
        <HubFormField label="Full name" htmlFor={`name-${profile.id}`} required>
          <HubInput
            id={`name-${profile.id}`}
            name="full_name"
            required
            defaultValue={profile.full_name}
          />
        </HubFormField>
        <HubFormField label="Phone" htmlFor={`phone-${profile.id}`}>
          <HubInput
            id={`phone-${profile.id}`}
            name="phone"
            defaultValue={profile.phone}
          />
        </HubFormField>
        <HubFormField label="Role" htmlFor={`role-${profile.id}`}>
          <HubNativeSelect
            id={`role-${profile.id}`}
            name="role"
            defaultValue={profile.role}
            disabled={isSelf}
          >
            {isAdminViewer ? (
              <>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="detailer">detailer</option>
              </>
            ) : (
              <>
                <option value="manager">manager</option>
                <option value="detailer">detailer</option>
              </>
            )}
          </HubNativeSelect>
        </HubFormField>
        <label className="flex items-center gap-2 pb-1 text-sm sm:items-end">
          <input
            type="checkbox"
            name="active"
            defaultChecked={profile.active}
            disabled={isSelf || !mayRemove}
            className="size-4 accent-primary"
          />
          Active (can sign in)
        </label>
      </HubFieldRow>
      <p className="mt-2 font-mono text-[9px] text-muted-foreground">{profile.email}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {mayRemove ? (
          <Button
            type="submit"
            formAction={removeAction}
            disabled={busy}
            variant="outline"
            size="sm"
          >
            {removePending ? "…" : "Remove access"}
          </Button>
        ) : null}
        {mayDelete ? (
          <Button
            type="submit"
            formAction={deleteAction}
            disabled={busy}
            variant="destructive"
            size="sm"
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

      <HubActionAlert
        state={{
          ok: state.ok || removeState.ok || deleteState.ok,
          message:
            deleteState.message || removeState.message || state.message,
        }}
        className="mt-2"
      />
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
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !profile.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm">{profile.full_name}</span>
            {isSelf ? (
              <Badge variant="outline" className="font-mono text-[8px]">
                You
              </Badge>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-[8px] uppercase">
              {profile.role}
            </Badge>
            <span className="truncate font-mono text-[9px] text-muted-foreground">
              {profile.email}
            </span>
            {!profile.active ? (
              <Badge variant="outline" className="font-mono text-[8px]">
                Access removed
              </Badge>
            ) : null}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
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
    </Card>
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
        <HubStatCard label="Active" value={active.length} />
        <HubStatCard label="Managers" value={managers} />
        <HubStatCard label="Detailers" value={detailers} />
      </div>

      {canInvite ? (
        <HubDetailsSection summary="+ Invite hub user">
          <details className="mb-4 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              Email setup notes
            </summary>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Supabase → Authentication → URL configuration: Site URL = your app URL.
              Add Redirect URLs: <code className="text-foreground">…/auth/confirm**</code>,{" "}
              <code className="text-foreground">…/auth/finish**</code>, and optionally{" "}
              <code className="text-foreground">…/auth/callback**</code>.
            </p>
          </details>
          <form action={inviteAction} className="space-y-4">
            <HubFieldRow>
              <HubFormField label="Email" htmlFor="invite-email" required>
                <HubInput id="invite-email" name="email" type="email" required />
              </HubFormField>
              <HubFormField label="Full name" htmlFor="invite-name" required>
                <HubInput id="invite-name" name="full_name" required />
              </HubFormField>
              <HubFormField label="Phone" htmlFor="invite-phone">
                <HubInput id="invite-phone" name="phone" type="tel" />
              </HubFormField>
              <HubFormField label="Role" htmlFor="invite-role" required>
                <HubNativeSelect
                  id="invite-role"
                  name="role"
                  defaultValue="manager"
                >
                  {isAdmin ? (
                    <>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                      <option value="detailer">detailer</option>
                    </>
                  ) : (
                    <>
                      <option value="manager">manager</option>
                      <option value="detailer">detailer</option>
                    </>
                  )}
                </HubNativeSelect>
              </HubFormField>
            </HubFieldRow>
            <Button type="submit" disabled={invitePending}>
              {invitePending ? "Sending…" : "Send invite"}
            </Button>
            <HubActionAlert state={inviteState} />
          </form>
        </HubDetailsSection>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Accounts
          </h2>
          <span className="font-mono text-[9px] text-muted-foreground">
            Tap Edit to change role or access
          </span>
        </div>
        {!active.length && !inactive.length ? (
          <HubEmptyState>No hub users yet. Invite someone above.</HubEmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((profile) => (
              <li key={profile.id}>
                <ProfileListRow
                  profile={profile}
                  expanded={expandedId === profile.id}
                  onToggleEdit={() => toggleEdit(profile.id)}
                  currentUserId={currentUserId}
                  viewerRole={viewerRole}
                  isSelf={profile.id === currentUserId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 ? (
        <HubDetailsSection
          summary={`Access removed (${inactive.length}) — delete to re-use email`}
        >
          <ul className="space-y-2">
            {inactive.map((profile) => (
              <li key={profile.id}>
                <ProfileListRow
                  profile={profile}
                  expanded={expandedId === profile.id}
                  onToggleEdit={() => toggleEdit(profile.id)}
                  currentUserId={currentUserId}
                  viewerRole={viewerRole}
                />
              </li>
            ))}
          </ul>
        </HubDetailsSection>
      ) : null}
    </div>
  );
}
