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
import {
  StaffServiceAreasField,
  type ServiceAreaOption,
} from "@/components/hub/staff-service-areas-field";
import { StaffPhotoField } from "@/components/hub/staff-photo-field";
import {
  HubActionAlert,
  HubDetailsSection,
  HubEmptyState,
  HubStatCard,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubTextarea,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StaffMemberRow } from "@/lib/bookings/bookable-detailers";
import type { SitePackage } from "@/lib/catalog/public-catalog";
import { cn } from "@/lib/utils";

const EMPTY: HubStaffActionState = { ok: false, message: "" };

function StaffBadgesWithBlocks({
  member,
  blockedCount,
  allowedAreasCount,
}: {
  member: StaffMemberRow;
  blockedCount: number;
  allowedAreasCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {member.is_detailer ? (
        <Badge variant="secondary" className="font-mono text-[8px] uppercase">
          Detailer
        </Badge>
      ) : null}
      {member.is_detailer && member.is_senior_detailer ? (
        <Badge variant="default" className="font-mono text-[8px] uppercase">
          Senior
        </Badge>
      ) : null}
      {member.is_bookable ? (
        <Badge variant="outline" className="font-mono text-[8px] uppercase">
          Bookable
        </Badge>
      ) : null}
      {member.is_detailer && blockedCount > 0 ? (
        <Badge variant="destructive" className="font-mono text-[8px]">
          {blockedCount} pkg blocked
        </Badge>
      ) : null}
      {member.is_detailer && allowedAreasCount > 0 ? (
        <Badge variant="outline" className="font-mono text-[8px]">
          {allowedAreasCount} area{allowedAreasCount === 1 ? "" : "s"}
        </Badge>
      ) : null}
      {member.profile_id ? (
        <span className="max-w-[10rem] truncate font-mono text-[8px] text-muted-foreground">
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
        className="size-10 shrink-0 rounded-full border border-border object-cover object-top"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 font-mono text-[9px] text-muted-foreground">
      ?
    </div>
  );
}

function StaffMemberFormFields({
  member,
  idPrefix,
}: {
  member?: StaffMemberRow;
  idPrefix: string;
}) {
  return (
    <>
      <HubFieldRow>
        <HubFormField label="Name" htmlFor={`${idPrefix}display_name`} required>
          <HubInput
            id={`${idPrefix}display_name`}
            name="display_name"
            required
            defaultValue={member?.display_name}
            placeholder={member ? undefined : "Alex"}
          />
        </HubFormField>
        <HubFormField label="Role" htmlFor={`${idPrefix}role_label`}>
          <HubInput
            id={`${idPrefix}role_label`}
            name="role_label"
            defaultValue={member?.role_label ?? ""}
            placeholder={member ? undefined : "Detailer"}
          />
        </HubFormField>
        <HubFormField label="Sort" htmlFor={`${idPrefix}sort_order`}>
          <HubInput
            id={`${idPrefix}sort_order`}
            name="sort_order"
            type="number"
            defaultValue={member ? String(member.sort_order) : "0"}
          />
        </HubFormField>
        <HubFormField
          label="Bio"
          htmlFor={`${idPrefix}bio`}
          className="sm:col-span-2 lg:col-span-3"
        >
          {member ? (
            <HubTextarea
              id={`${idPrefix}bio`}
              name="bio"
              rows={1}
              defaultValue={member.bio}
              className="min-h-[2.25rem] resize-y"
            />
          ) : (
            <HubInput
              id={`${idPrefix}bio`}
              name="bio"
              placeholder="Optional short bio"
            />
          )}
        </HubFormField>
        <div className="sm:col-span-2 lg:col-span-3">
          <StaffPhotoField currentUrl={member?.photo_url} optional={!member} />
        </div>
      </HubFieldRow>

      <div className="mt-2.5 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="is_detailer"
            defaultChecked={member ? member.is_detailer : true}
            className="size-3.5 rounded border-input"
          />
          Detailer
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="is_bookable"
            defaultChecked={member ? member.is_bookable : true}
            className="size-3.5 rounded border-input"
          />
          Bookable
        </label>
        {member?.is_detailer ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              name="is_senior_detailer"
              defaultChecked={member.is_senior_detailer}
              className="size-3.5 rounded border-input"
            />
            Senior detailer (higher package pay)
          </label>
        ) : null}
        {member ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              name="active"
              defaultChecked={member.active}
              className="size-3.5 rounded border-input"
            />
            Active
          </label>
        ) : null}
      </div>
    </>
  );
}

function StaffEditForm({
  member,
  packages,
  serviceAreas,
  blockedPackageKeys,
  allowedAreaSlugs,
}: {
  member: StaffMemberRow;
  packages: SitePackage[];
  serviceAreas: ServiceAreaOption[];
  blockedPackageKeys: string[];
  allowedAreaSlugs: string[];
}) {
  const [state, action, pending] = useActionState(
    updateStaffMember.bind(null, member.id),
    EMPTY,
  );

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
      <StaffMemberFormFields member={member} idPrefix={`edit-${member.id}-`} />

      {member.is_detailer ? (
        <StaffPackageBlocksField
          packages={packages}
          blockedKeys={blockedPackageKeys}
          compact
        />
      ) : null}
      {member.is_detailer ? (
        <StaffServiceAreasField
          areas={serviceAreas}
          allowedSlugs={allowedAreaSlugs}
          compact
        />
      ) : null}

      <div className="mt-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <HubActionAlert state={state} className="mt-2" />
      </div>
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
    <div className="flex shrink-0 flex-wrap gap-1.5">
      <form
        action={toggleAction}
        onSubmit={(e) => {
          const msg = active ? `Deactivate ${name}?` : `Reactivate ${name}?`;
          if (!confirm(msg)) e.preventDefault();
        }}
      >
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={togglePending || deletePending}
        >
          {togglePending ? "…" : active ? "Off" : "On"}
        </Button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `Permanently remove ${name}? Schedule rules and photo are deleted.`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={togglePending || deletePending}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          {deletePending ? "…" : "Delete"}
        </Button>
      </form>
      {toggleState.message || deleteState.message ? (
        <span
          className={cn(
            "w-full font-mono text-[9px]",
            toggleState.ok || deleteState.ok ? "text-primary" : "text-destructive",
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
  serviceAreas,
  blockedPackageKeys,
  allowedAreaSlugs,
}: {
  member: StaffMemberRow;
  expanded: boolean;
  onToggleEdit: () => void;
  packages: SitePackage[];
  serviceAreas: ServiceAreaOption[];
  blockedPackageKeys: string[];
  allowedAreaSlugs: string[];
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !member.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <StaffAvatar member={member} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm text-primary">{member.display_name}</span>
            <span className="truncate text-xs text-muted-foreground">{member.role_label}</span>
          </div>
          <StaffBadgesWithBlocks
            member={member}
            blockedCount={blockedPackageKeys.length}
            allowedAreasCount={allowedAreaSlugs.length}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
            {expanded ? "Close" : "Edit"}
          </Button>
          <StaffActionButtons
            id={member.id}
            name={member.display_name}
            active={member.active}
          />
        </div>
      </div>
      {expanded ? (
        <StaffEditForm
          member={member}
          packages={packages}
          serviceAreas={serviceAreas}
          blockedPackageKeys={blockedPackageKeys}
          allowedAreaSlugs={allowedAreaSlugs}
        />
      ) : null}
    </Card>
  );
}

export function StaffPanel({
  staff,
  packages,
  serviceAreas,
  blockedByStaffId,
  allowedAreasByStaffId,
}: {
  staff: StaffMemberRow[];
  packages: SitePackage[];
  serviceAreas: ServiceAreaOption[];
  blockedByStaffId: Record<string, string[]>;
  allowedAreasByStaffId: Record<string, string[]>;
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
        <HubStatCard label="Active" value={active.length} />
        <HubStatCard
          label="Bookable detailers"
          value={staff.filter((s) => s.active && s.is_bookable).length}
        />
        {inactive.length > 0 ? (
          <HubStatCard label="Inactive" value={inactive.length} />
        ) : null}
      </div>

      <HubDetailsSection summary="+ Add team member">
        <form action={createAction}>
          <StaffMemberFormFields idPrefix="create-" />
          <Button type="submit" className="mt-4" disabled={createPending}>
            {createPending ? "Adding…" : "Add member"}
          </Button>
          <HubActionAlert state={createState} className="mt-3" />
        </form>
      </HubDetailsSection>

      <HubFormSection
        title="Team roster"
        description={`${detailerCount} detailer${detailerCount === 1 ? "" : "s"} · tap Edit to change`}
      >
        {!active.length ? (
          <HubEmptyState>
            No active staff. Expand &ldquo;Add team member&rdquo; above or run{" "}
            <code className="text-primary">npm run hub:seed</code>.
          </HubEmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((member) => (
              <li key={member.id}>
                <StaffListRow
                  member={member}
                  expanded={expandedId === member.id}
                  onToggleEdit={() => toggleEdit(member.id)}
                  packages={packages}
                  serviceAreas={serviceAreas}
                  blockedPackageKeys={blockedByStaffId[member.id] ?? []}
                  allowedAreaSlugs={allowedAreasByStaffId[member.id] ?? []}
                />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>

      {inactive.length > 0 ? (
        <HubDetailsSection summary={`Inactive (${inactive.length})`}>
          <ul className="space-y-2">
            {inactive.map((member) => (
              <li key={member.id}>
                <StaffListRow
                  member={member}
                  expanded={expandedId === member.id}
                  onToggleEdit={() => toggleEdit(member.id)}
                  packages={packages}
                  serviceAreas={serviceAreas}
                  blockedPackageKeys={blockedByStaffId[member.id] ?? []}
                  allowedAreaSlugs={allowedAreasByStaffId[member.id] ?? []}
                />
              </li>
            ))}
          </ul>
        </HubDetailsSection>
      ) : null}
    </div>
  );
}
