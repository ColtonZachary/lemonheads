"use client";

import { useActionState } from "react";

import {
  createStaffMember,
  toggleStaffMemberActive,
  deleteStaffMember,
  updateStaffMember,
  type HubStaffActionState,
} from "@/app/actions/hub-staff";
import { StaffPhotoField } from "@/components/hub/staff-photo-field";
import { Button } from "@/components/ui/button";
import type { StaffMemberRow } from "@/lib/bookings/bookable-detailers";
import { cn } from "@/lib/utils";

const EMPTY: HubStaffActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function StaffEditForm({ member }: { member: StaffMemberRow }) {
  const [state, action, pending] = useActionState(
    updateStaffMember.bind(null, member.id),
    EMPTY,
  );

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-white/10 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Display name</span>
          <input
            name="display_name"
            required
            defaultValue={member.display_name}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Role label</span>
          <input
            name="role_label"
            defaultValue={member.role_label}
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Bio</span>
          <textarea name="bio" rows={2} defaultValue={member.bio} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(member.sort_order)}
            className={fieldClass}
          />
        </label>
        <StaffPhotoField currentUrl={member.photo_url} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_detailer"
            defaultChecked={member.is_detailer}
            className="size-4"
          />
          Detailer
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_bookable"
            defaultChecked={member.is_bookable}
            className="size-4"
          />
          Bookable online
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={member.active}
            className="size-4"
          />
          Active
        </label>
      </div>
      <Button type="submit" disabled={pending} className="h-auto min-h-0 px-3 py-1.5 text-xs">
        {pending ? "Saving…" : "Save changes"}
      </Button>
      {state.message && (
        <p
          className={cn(
            "font-mono text-xs",
            state.ok ? "text-y" : "text-red-200",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function StaffActionButtons({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleStaffMemberActive.bind(null, id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStaffMember.bind(null, id),
    EMPTY,
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <form
          action={toggleAction}
          onSubmit={(e) => {
            const msg = active
              ? `Deactivate ${name}? They won't appear on the team page or booking list until reactivated.`
              : `Reactivate ${name}? They will appear on the team page again; detailers are bookable online again.`;
            if (!confirm(msg)) e.preventDefault();
          }}
        >
          <Button
            type="submit"
            variant="outline"
            className="h-auto min-h-0 px-2 py-1 text-[10px]"
            disabled={togglePending || deletePending}
          >
            {togglePending ? "…" : active ? "Deactivate" : "Reactivate"}
          </Button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `Permanently remove ${name}? This deletes their profile, photo, and schedule rules. Past bookings are not deleted.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <Button
            type="submit"
            variant="outline"
            className="h-auto min-h-0 border-red-500/30 px-2 py-1 text-[10px] text-red-200 hover:border-red-500/50"
            disabled={togglePending || deletePending}
          >
            {deletePending ? "Removing…" : "Remove permanently"}
          </Button>
        </form>
      </div>
      {(toggleState.message || deleteState.message) && (
        <p
          className={cn(
            "max-w-xs text-right font-mono text-[9px]",
            toggleState.ok || deleteState.ok ? "text-y" : "text-red-300",
          )}
        >
          {deleteState.message || toggleState.message}
        </p>
      )}
    </div>
  );
}

export function StaffPanel({ staff }: { staff: StaffMemberRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createStaffMember,
    EMPTY,
  );

  const active = staff.filter((s) => s.active);
  const inactive = staff.filter((s) => !s.active);

  return (
    <div className="space-y-10">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add team member
        </h2>
        <p className="mt-1 text-sm text-text/45">
          Appears on the website team page when active. Check &quot;Bookable online&quot; for
          detailers who can be assigned to jobs.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Display name *</span>
            <input name="display_name" required className={fieldClass} placeholder="Alex" />
          </label>
          <label className="block">
            <span className={labelClass}>Role label</span>
            <input name="role_label" className={fieldClass} placeholder="Detailer" />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Bio</span>
            <textarea name="bio" rows={2} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Sort order</span>
            <input name="sort_order" type="number" defaultValue="0" className={fieldClass} />
          </label>
          <StaffPhotoField />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_detailer" defaultChecked className="size-4" />
            Detailer
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_bookable" defaultChecked className="size-4" />
            Bookable online
          </label>
        </div>

        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add staff member"}
        </Button>

        {createState.message && (
          <p
            className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
              createState.ok
                ? "border-y/30 bg-y/10 text-y"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {createState.message}
          </p>
        )}
      </form>

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Active ({active.length})
        </h3>
        {!active.length ? (
          <p className="mt-4 text-sm text-text/40">No active staff. Run npm run hub:seed or add above.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {active.map((member) => (
              <li
                key={member.id}
                className="rounded-md border border-white/10 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-4">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt=""
                        className="size-14 shrink-0 rounded-full border border-white/15 object-cover object-top"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-text/30">
                        ?
                      </div>
                    )}
                    <div>
                    <div className="font-mono text-sm text-y/85">{member.display_name}</div>
                    <div className="mt-1 text-sm text-text/50">{member.role_label}</div>
                    <div className="mt-2 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.08em]">
                      {member.is_detailer && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-text/55">
                          Detailer
                        </span>
                      )}
                      {member.is_bookable && (
                        <span className="rounded bg-y/10 px-2 py-0.5 text-y/70">
                          Bookable
                        </span>
                      )}
                      {member.profile_id && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-text/55">
                          Hub login
                          {member.profiles?.email ? ` · ${member.profiles.email}` : ""}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                  <StaffActionButtons
                    id={member.id}
                    name={member.display_name}
                    active={member.active}
                  />
                </div>
                <StaffEditForm member={member} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Inactive ({inactive.length})
          </h3>
          <ul className="mt-4 space-y-3">
            {inactive.map((member) => (
              <li
                key={member.id}
                className="rounded-md border border-white/5 px-4 py-3 opacity-70"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="font-mono text-sm text-text/60">{member.display_name}</div>
                  <StaffActionButtons
                    id={member.id}
                    name={member.display_name}
                    active={member.active}
                  />
                </div>
                <StaffEditForm member={member} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
