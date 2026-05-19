"use client";

import Image from "next/image";
import { useState } from "react";

import { Icon } from "@/components/ui/icons";
import type { TeamMember } from "@/lib/data";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [active, setActive] = useState<TeamMember | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-0.5 bg-border-faint sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <button
            key={member.name}
            type="button"
            onClick={() => setActive(member)}
            className="group relative flex cursor-pointer flex-col items-center overflow-hidden bg-card px-7 pb-10 pt-12 text-center transition-colors hover:bg-card2 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-y before:to-transparent before:transition-transform before:duration-500 hover:before:scale-x-100"
          >
            <div className="relative mb-6 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border-2 border-y/20 bg-y/[0.05] transition-all group-hover:border-y/55 group-hover:shadow-[0_0_28px_rgba(240,201,58,0.12)]">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="120px"
                  className="object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
                  onError={() => {
                    /* swallow — placeholder fallback shows automatically */
                  }}
                />
              ) : (
                <Icon name="user" className="h-12 w-12 text-y/30" />
              )}
            </div>
            <div className="mb-2 font-display text-2xl leading-none tracking-[0.08em] text-text">
              {member.name.toUpperCase()}
            </div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-y/80">
              {member.role}
            </div>
            <div className="mt-3.5 inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-y/0 transition-colors group-hover:text-y/65">
              <span className="h-px w-3.5 bg-y opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              View Bio
            </div>
          </button>
        ))}
      </div>

      {active && <BioModal member={active} onClose={() => setActive(null)} />}
    </>
  );
}

function BioModal({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-6 backdrop-blur-md"
    >
      <div className="relative w-full max-w-[420px] animate-[fadeUp_0.3s_ease_both] rounded-xl border border-y/20 bg-card p-10 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-xl before:bg-gradient-to-r before:from-y before:to-transparent">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer p-1 text-text/30 transition-colors hover:text-y"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-y/30 bg-y/[0.06]">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon name="user" className="h-8 w-8 text-y/25" />
          )}
        </div>
        <div className="mb-1 text-center font-display text-[28px] tracking-[0.06em]">
          {member.name.toUpperCase()}
        </div>
        <div className="mb-6 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-y/80">
          {member.role}
        </div>
        <div aria-hidden className="mb-5 h-px bg-white/[0.06]" />
        <p className="text-sm leading-[1.8] text-text/60">{member.bio}</p>
      </div>
    </div>
  );
}
