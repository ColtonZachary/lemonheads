import type { Metadata } from "next";
import Link from "next/link";

import { TeamGrid } from "@/components/team/team-grid";
import { SectionLabel } from "@/components/ui/section";
import { getTeamMembers } from "@/lib/media";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meet the Team",
  description:
    `The detailers, managers, and specialists behind every ${SITE.name} mobile detail.`,
};

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <>
      <div className="px-[5%] pb-12 pt-20 text-center">
        <SectionLabel centered>Our People</SectionLabel>
        <h1 className="mt-4 font-display text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[0.02em]">
          MEET THE <span className="text-y">TEAM</span>
        </h1>
        <p className="mt-3.5 font-mono text-[13px] tracking-[0.08em] text-text/40">
          The crew behind every spotless detail.
        </p>
      </div>

      <div className="mx-auto max-w-[1100px] px-[5%] pb-24">
        <TeamGrid members={members} />
      </div>

      <div className="pb-16 text-center">
        <Link
          href="/"
          className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-y"
        >
          ← Back to Home
        </Link>
      </div>
    </>
  );
}
