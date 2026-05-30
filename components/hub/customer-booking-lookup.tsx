"use client";

import { useEffect, useId, useRef, useState } from "react";

import { searchHubCustomersForBooking } from "@/app/actions/hub-customer-lookup";
import { HubFormField, HubInput } from "@/components/hub/hub-form";
import type { CustomerBookingPick } from "@/lib/hub/customer-lookup-for-booking";
import { cn } from "@/lib/utils";

export function CustomerBookingLookup({
  onSelect,
  compact,
}: {
  onSelect: (pick: CustomerBookingPick) => void;
  compact?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerBookingPick[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchHubCustomersForBooking(trimmed).then((res) => {
        if (!res.ok) {
          setSearchError(res.error);
          setResults([]);
        } else {
          setSearchError(null);
          setResults(res.results);
          setOpen(res.results.length > 0);
          setActiveIndex(res.results.length > 0 ? 0 : -1);
        }
        setLoading(false);
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(pick: CustomerBookingPick) {
    onSelect(pick);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      choose(results[activeIndex]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={compact ? "mb-2" : "mb-4"}>
      <HubFormField label="Find existing customer" htmlFor="customer-lookup">
        <HubInput
          id="customer-lookup"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Name, email, or phone"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </HubFormField>
      <p className="font-mono text-[9px] text-muted-foreground">
        Type at least 2 characters, then pick a customer to fill contact and address
        from their last booking.
      </p>
      {searchError ? (
        <p className="mt-2 font-mono text-xs text-destructive">{searchError}</p>
      ) : null}
      {loading && query.trim().length >= 2 ? (
        <p className="mt-2 font-mono text-[9px] text-muted-foreground">Searching…</p>
      ) : null}
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
        >
          {results.map((pick, index) => (
            <li key={`${pick.customerId ?? "b"}-${pick.email}-${pick.phone}`} role="option">
              <button
                type="button"
                aria-selected={index === activeIndex}
                className={cn(
                  "w-full px-3 py-2.5 text-left transition-colors",
                  index === activeIndex
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground/90 hover:bg-muted/50",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(pick)}
              >
                <span className="block font-mono text-sm">{pick.displayName}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                  {[pick.email, pick.phone].filter(Boolean).join(" · ")}
                  {pick.bookingCount > 0
                    ? ` · ${pick.bookingCount} booking${pick.bookingCount === 1 ? "" : "s"}`
                    : null}
                </span>
                {pick.address || pick.city ? (
                  <span className="mt-0.5 block truncate font-mono text-[9px] text-muted-foreground">
                    {[pick.address, pick.city, pick.zip].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!loading &&
      query.trim().length >= 2 &&
      !searchError &&
      results.length === 0 ? (
        <p className="mt-2 font-mono text-[9px] text-muted-foreground">
          No matching customers.
        </p>
      ) : null}
    </div>
  );
}
