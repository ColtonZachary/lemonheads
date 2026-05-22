"use client";

import { useEffect, useId, useRef, useState } from "react";

import { searchHubCustomersForBooking } from "@/app/actions/hub-customer-lookup";
import type { CustomerBookingPick } from "@/lib/hub/customer-lookup-for-booking";
import { cn } from "@/lib/utils";

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";
const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";

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
    <div ref={rootRef} className={compact ? "mb-5" : "mb-6"}>
      <label className="block">
        <span className={labelClass}>Find existing customer</span>
        <input
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
          className={fieldClass}
          placeholder="Name, email, or phone"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </label>
      <p className="mt-1.5 font-mono text-[9px] text-text/35">
        Type at least 2 characters, then pick a customer to fill the fields below.
      </p>
      {searchError ? (
        <p className="mt-2 font-mono text-xs text-red-300/80">{searchError}</p>
      ) : null}
      {loading && query.trim().length >= 2 ? (
        <p className="mt-2 font-mono text-[9px] text-text/35">Searching…</p>
      ) : null}
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="mt-2 max-h-56 overflow-y-auto rounded-md border border-white/15 bg-card2 shadow-lg"
        >
          {results.map((pick, index) => (
            <li key={`${pick.customerId ?? "b"}-${pick.email}-${pick.phone}`} role="option">
              <button
                type="button"
                aria-selected={index === activeIndex}
                className={cn(
                  "w-full px-3 py-2.5 text-left transition-colors",
                  index === activeIndex
                    ? "bg-y/15 text-text/95"
                    : "hover:bg-white/[0.04] text-text/85",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(pick)}
              >
                <span className="block font-mono text-sm">{pick.displayName}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-text/45">
                  {[pick.email, pick.phone].filter(Boolean).join(" · ")}
                  {pick.bookingCount > 0
                    ? ` · ${pick.bookingCount} booking${pick.bookingCount === 1 ? "" : "s"}`
                    : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!loading &&
      query.trim().length >= 2 &&
      !searchError &&
      results.length === 0 ? (
        <p className="mt-2 font-mono text-[9px] text-text/35">No matching customers.</p>
      ) : null}
    </div>
  );
}
