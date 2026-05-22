"use client";

import { useActionState, useState } from "react";

import {
  createStaffMember,
  toggleStaffMemberActive,
  deleteStaffMember,
  updateStaffMember,
  type HubStaffActionState,
} from "@/app/actions/hub-staff";
import { StaffPackageBlocksField } from "@/components/hub/staff-package-blocks-field";
import { StaffPhotoField } from "@/components/hub/staff-photo-field";
import { Button } from "@/components/ui/button";
import type { StaffMemberRow } from "@/lib/bookings/bookable-detailers";
import type { SitePackage } from "@/lib/catalog/public-catalog";
import { cn } from "@/lib/utils";

const EMPTY: HubStaffActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function StaffBadgesWithBlocks({
  member,
  blockedCount,
}: {
  member: StaffMemberRow;
  blockedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {member.is_detailer ? (
        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-text/55">
          Detailer
        </span>
      ) : null}
      {member.is_bookable ? (
        <span className="rounded bg-y/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-y/70">
          Bookable
        </span>
      ) : null}
      {member.is_detailer && blockedCount > 0 ? (
        <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[8px] text-red-200/80">
          {blockedCount} pkg blocked
        </span>
      ) : null}
      {member.profile_id ? (
        <span className="max-w-[10rem] truncate font-mono text-[8px] text-text/40">
          {member.profiles?.email}
        </span>
      ) : null}
    </div>
  );
}

function StaffAvatar({ member }: { member: StaffMemberRow }) {
  if (member.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo_url}
        alt=""
        className="size-10 shrink-0 rounded-full border border-white/15 object-cover object-top"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[9px] text-text/30">
      ?
    </div>
  );
}

function StaffEditForm({
  member,
  packages,
  blockedPackageKeys,
}: {
  member: StaffMemberRow;
  packages: SitePackage[];
  blockedPackageKeys: string[];
}) {
  const [state, action, pending] = useActionState(
    updateStaffMember.bind(null, member.id),
    EMPTY,
  );

  return (
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            name="display_name"
            required
            defaultValue={member.display_name}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Role</span>
          <input
            name="role_label"
            defaultValue={member.role_label}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sort</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(member.sort_order)}
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelClass}>Bio</span>
          <textarea
            name="bio"
            rows={1}
            defaultValue={member.bio}
            className={cn(fieldClass, "min-h-[2.25rem] resize-y")}
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <StaffPhotoField currentUrl={member.photo_url} />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="is_detailer"
            defaultChecked={member.is_detailer}
            className="size-3.5"
          />
          Detailer
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="is_bookable"
            defaultChecked={member.is_bookable}
            className="size-3.5"
          />
          Bookable
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="active"
            defaultChecked={member.active}
            className="size-3.5"
          />
          Active
        </label>
      </div>

      {member.is_detailer ? (
        <StaffPackageBlocksField
          packages={packages}
          blockedKeys={blockedPackageKeys}
          compact
        />
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.message ? (
          <p
            className={cn(
              "font-mono text-[10px]",
              state.ok ? "text-y" : "text-red-200",
            )}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function StaffActionButtons({
  id,
  name,
  active,
  compact,
}: {
  id: string;
  name: string;
  active: boolean;
  compact?: boolean;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleStaffMemberActive.bind(null, id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStaffMember.bind(null, id),
    EMPTY,
  );

  const btnClass = "h-auto min-h-0 px-2 py-1 text-[10px]";

  return (
    <div className={cn("flex shrink-0 flex-wrap gap-1.5", compact && "justify-end")}>
      <form
        action={toggleAction}
        onSubmit={(e) => {
          const msg = active
            ? `Deactivate ${name}?`
            : `Reactivate ${name}?`;
          if (!confirm(msg)) e.preventDefault();
        }}
      >
        <Button
          type="submit"
          variant="outline"
          className={btnClass}
          disabled={togglePending || deletePending}
        >
          {togglePending ? "…" : active ? "Off" : "On"}
        </Button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (
            !confirm(`Permanently remove ${name}? Schedule rules and photo are deleted.`)
          ) {
            e.preventDefault();
          }
        }}
      >
        <Button
          type="submit"
          variant="outline"
          className={cn(btnClass, "border-red-500/30 text-red-200/90")}
          disabled={togglePending || deletePending}
        >
          {deletePending ? "…" : "Delete"}
        </Button>
      </form>
      {(toggleState.message || deleteState.message) && !compact ? (
        <span
          className={cn(
            "w-full font-mono text-[9px]",
            toggleState.ok || deleteState.ok ? "text-y" : "text-red-300",
          )}
        >
          {deleteState.message || toggleState.message}
        </span>
      ) : null}
    </div>
  );
}

function StaffListRow({
  member,
  expanded,
  onToggleEdit,
  packages,
  blockedPackageKeys,
}: {
  member: StaffMemberRow;
  expanded: boolean;
  onToggleEdit: () => void;
  packages: SitePackage[];
  blockedPackageKeys: string[];
}) {
  return (
    <li
      className={cn(
        "overflow-hidden rounded-lg border transition-colors",
        member.active ? "border-white/10" : "border-white/5 opacity-75",
        expanded && "border-y/25",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <StaffAvatar member={member} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm text-y/90">{member.display_name}</span>
            <span className="truncate text-xs text-text/45">{member.role_label}</span>
          </div>
          <StaffBadgesWithBlocks
            member={member}
            blockedCount={blockedPackageKeys.length}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-0 px-2 py-1 text-[10px]"
            onClick={onToggleEdit}
          >
            {expanded ? "Close" : "Edit"}
          </Button>
          <StaffActionButtons
            id={member.id}
            name={member.display_name}
            active={member.active}
            compact
          />
        </div>
      </div>
      {expanded ? (
        <StaffEditForm
          member={member}
          packages={packages}
          blockedPackageKeys={blockedPackageKeys}
        />
      ) : null}
    </li>
  );
}

export function StaffPanel({
  staff,
  packages,
  blockedByStaffId,
}: {
  staff: StaffMemberRow[];
  packages: SitePackage[];
  blockedByStaffId: Record<string, string[]>;
}) {
  const [createState, createAction, createPending] = useActionState(
    createStaffMember,
    EMPTY,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = staff.filter((s) => s.active);
  const inactive = staff.filter((s) => !s.active);
  const detailerCount = staff.filter((s) => s.is_detailer && s.active).length;

  const toggleEdit = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Active
          </p>
          <p className="font-display text-2xl text-y">{active.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Bookable detailers
          </p>
          <p className="font-display text-2xl text-y">
            {staff.filter((s) => s.active && s.is_bookable).length}
          </p>
        </div>
        {inactive.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
              Inactive
            </p>
            <p className="font-display text-2xl text-text/50">{inactive.length}</p>
          </div>
        ) : null}
      </div>

      <details className="group rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y hover:text-y/90 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-text/40 group-open:hidden">+</span>
            <span className="hidden text-text/40 group-open:inline">−</span>
            Add team member
          </span>
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={labelClass}>Name *</span>
              <input name="display_name" required className={fieldClass} placeholder="Alex" />
            </label>
            <label className="block">
              <span className={labelClass}>Role</span>
              <input name="role_label" className={fieldClass} placeholder="Detailer" />
            </label>
            <label className="block">
              <span className={labelClass}>Sort</span>
              <input name="sort_order" type="number" defaultValue="0" className={fieldClass} />
            </label>
            <div className="flex flex-wrap items-end gap-3 pb-0.5 sm:col-span-2 lg:col-span-1">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" name="is_detailer" defaultChecked className="size-3.5" />
                Detailer
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" name="is_bookable" defaultChecked className="size-3.5" />
                Bookable
              </label>
            </div>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className={labelClass}>Bio</span>
              <input name="bio" className={fieldClass} placeholder="Optional short bio" />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <StaffPhotoField optional />
            </div>
          </div>
          <Button type="submit" className="mt-4 h-auto min-h-0 px-4 py-2 text-xs" disabled={createPending}>
            {createPending ? "Adding…" : "Add member"}
          </Button>
          {createState.message ? (
            <p
              className={cn(
                "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
                createState.ok
                  ? "border-y/30 bg-y/10 text-y"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              )}
            >
              {createState.message}
            </p>
          ) : null}
        </form>
      </details>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Team roster
          </h2>
          <span className="font-mono text-[9px] text-text/35">
            {detailerCount} detailer{detailerCount === 1 ? "" : "s"} · tap Edit to change
          </span>
        </div>
        {!active.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No active staff. Expand &ldquo;Add team member&rdquo; above or run{" "}
            <code className="text-y/70">npm run hub:seed</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((member) => (
              <StaffListRow
                key={member.id}
                member={member}
                expanded={expandedId === member.id}
                onToggleEdit={() => toggleEdit(member.id)}
                packages={packages}
                blockedPackageKeys={blockedByStaffId[member.id] ?? []}
              />
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 ? (
        <details className="rounded-lg border border-white/5">
          <summary className="cursor-pointer list-none px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text/45 [&::-webkit-details-marker]:hidden">
            Inactive ({inactive.length})
          </summary>
          <ul className="space-y-2 border-t border-white/5 px-3 py-3">
            {inactive.map((member) => (
              <StaffListRow
                key={member.id}
                member={member}
                expanded={expandedId === member.id}
                onToggleEdit={() => toggleEdit(member.id)}
                packages={packages}
                blockedPackageKeys={blockedByStaffId[member.id] ?? []}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
