import Link from "next/link";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  const initials = SITE.shortName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)}>
      <div
        aria-hidden
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[4px] border border-y/20 bg-y/[0.08] font-display text-sm tracking-[0.06em] text-y transition-all group-hover:border-y/40 group-hover:drop-shadow-[0_0_12px_rgba(240,201,58,0.35)]"
      >
        {initials}
      </div>
      <div className="leading-none">
        <div className="font-display text-[20px] tracking-[0.08em] text-y">
          {SITE.shortName}
        </div>
        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-text/50">
          {SITE.tagline}
        </div>
      </div>
    </Link>
  );
}
