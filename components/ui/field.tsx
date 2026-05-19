import * as React from "react";

import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-[4px] border border-white/10 bg-[#0D0D0D] px-3.5 py-3 font-sans text-base text-text outline-none transition-colors placeholder:text-white/30 focus:border-y/50 focus:bg-[#0F0F0F] disabled:opacity-50";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-[110px] resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        fieldBase,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23f0c93a%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[right_14px_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export function FormRow({
  className,
  cols = 2,
  ...props
}: React.ComponentProps<"div"> & { cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "grid gap-3.5",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}
