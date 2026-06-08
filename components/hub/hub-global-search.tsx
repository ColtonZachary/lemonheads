"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { searchHubGlobalAction } from "@/app/actions/hub-global-search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  HUB_SEARCH_KIND_LABELS,
  type HubSearchResult,
  type HubSearchResultKind,
} from "@/lib/hub/global-search";
import { cn } from "@/lib/utils";

const GROUP_ORDER: HubSearchResultKind[] = [
  "booking",
  "customer",
  "staff",
  "promo",
  "package",
  "addon",
  "page",
];

function groupResults(results: HubSearchResult[]) {
  const groups = new Map<HubSearchResultKind, HubSearchResult[]>();

  for (const result of results) {
    const list = groups.get(result.kind) ?? [];
    list.push(result);
    groups.set(result.kind, list);
  }

  return GROUP_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
    kind,
    items: groups.get(kind)!,
  }));
}

function preventDismissOnAnchor(
  event: Event,
  anchorRef: React.RefObject<HTMLDivElement | null>,
) {
  const target = event.target;
  if (target instanceof Node && anchorRef.current?.contains(target)) {
    event.preventDefault();
  }
}

export function HubGlobalSearch({
  isManager,
  variant = "sidebar",
  className,
}: {
  isManager: boolean;
  variant?: "sidebar" | "header";
  className?: string;
}) {
  const router = useRouter();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HubSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isSidebar = variant === "sidebar";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        anchorRef.current
          ?.querySelector<HTMLInputElement>('[data-slot="input-group-control"]')
          ?.focus();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchHubGlobalAction(trimmed).then((res) => {
        if (!res.ok) {
          setSearchError(res.error);
          setResults([]);
        } else {
          setSearchError(null);
          setResults(res.results);
        }
        setLoading(false);
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  function choose(result: HubSearchResult) {
    router.push(result.href);
    setQuery("");
    setResults([]);
    setOpen(false);
    setSearchError(null);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(value.trim().length > 0);
  }

  const placeholder = isManager
    ? isSidebar
      ? "Search anything…"
      : "Search bookings, customers, pages…"
    : "Search hub pages…";

  const trimmedQuery = query.trim();
  const grouped = groupResults(results);
  const showEmptyState =
    !loading &&
    !searchError &&
    trimmedQuery.length >= 2 &&
    results.length === 0;

  return (
    <div
      className={cn(
        "min-w-0",
        isSidebar ? "w-full" : "flex-1",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="w-full">
            <InputGroup
              className={cn(
                "font-mono",
                isSidebar &&
                  "border-sidebar-border bg-sidebar-accent/20 shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-sidebar-ring has-[[data-slot=input-group-control]:focus-visible]:ring-sidebar-ring/30",
              )}
            >
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onFocus={() => {
                  if (trimmedQuery.length > 0) setOpen(true);
                }}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                className={cn(
                  "text-sm",
                  isSidebar &&
                    "text-sidebar-foreground placeholder:text-sidebar-foreground/50",
                )}
              />
            </InputGroup>
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          side={isSidebar ? "right" : "bottom"}
          sideOffset={8}
          className={cn("w-72 p-0", isSidebar && "md:w-80")}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) =>
            preventDismissOnAnchor(event, anchorRef)
          }
          onFocusOutside={(event) => preventDismissOnAnchor(event, anchorRef)}
          onPointerDownOutside={(event) =>
            preventDismissOnAnchor(event, anchorRef)
          }
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-80">
              {loading ? (
                <CommandEmpty className="font-mono text-[10px]">
                  Searching…
                </CommandEmpty>
              ) : null}

              {searchError ? (
                <CommandEmpty className="font-mono text-xs text-destructive">
                  {searchError}
                </CommandEmpty>
              ) : null}

              {showEmptyState ? (
                <CommandEmpty className="font-mono text-[10px]">
                  No matches for &ldquo;{trimmedQuery}&rdquo;.
                </CommandEmpty>
              ) : null}

              {grouped.map(({ kind, items }) => (
                <CommandGroup
                  key={kind}
                  heading={HUB_SEARCH_KIND_LABELS[kind]}
                  className="font-mono **:[[cmdk-group-heading]]:text-[9px] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[0.12em]"
                >
                  {items.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      onSelect={() => choose(result)}
                      className="flex-col items-start gap-0.5 py-2"
                    >
                      <span className="block w-full truncate font-mono text-sm">
                        {result.title}
                      </span>
                      <span className="block w-full truncate font-mono text-[10px] text-muted-foreground">
                        {result.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
