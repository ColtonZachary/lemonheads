import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Yellow eyebrow label that appears above section titles. Uses the
 * `// LABEL` prefix from the original site.
 */
export function SectionLabel({
  className,
  centered,
  ...props
}: React.ComponentProps<"div"> & { centered?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.3em] text-y",
        centered && "justify-center",
        "before:content-['//'] before:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-display text-[clamp(44px,6.5vw,80px)] leading-[0.95] tracking-[0.02em] mb-4",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  id,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      id={id}
      className={cn("px-[5%] py-[100px] max-md:py-[72px]", className)}
      {...props}
    />
  );
}
