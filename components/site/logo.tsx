import Image from "next/image";
import Link from "next/link";

import { assetPath } from "@/lib/asset-path";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)}>
      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center transition-all group-hover:drop-shadow-[0_0_12px_rgba(240,201,58,0.45)]">
        <Image
          src={assetPath("/lemon-logo.png")}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority
        />
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
