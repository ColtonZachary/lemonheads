import Link from "next/link";

import { CustomerProfileView } from "@/components/hub/customer-profile-view";
import { HubFormField, HubInput } from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentralDate } from "@/lib/hub/format";
import {
  customerProfileHref,
  type CustomerProfile,
} from "@/lib/hub/customer-search";

export { CustomerProfileView };

export function CustomersSearchForm({
  defaultQuery,
}: {
  defaultQuery?: string;
}) {
  return (
    <Card className="mt-8 border-border/80 bg-card/40">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Customer lookup
        </CardTitle>
        <CardDescription className="font-mono text-[9px]">
          Email or phone (any format) · at least 4 digits for phone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <HubFormField
            label="Email or phone"
            htmlFor="customers-q"
            className="min-w-0 flex-1"
          >
            <HubInput
              id="customers-q"
              type="search"
              name="q"
              defaultValue={defaultQuery ?? ""}
              placeholder="customer@email.com or 4055551234"
              autoComplete="off"
              minLength={3}
            />
          </HubFormField>
          <Button type="submit" className="shrink-0 sm:mb-0.5">
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CustomerMatchList({
  profiles,
  searchQuery,
}: {
  profiles: CustomerProfile[];
  searchQuery: string;
}) {
  return (
    <Card className="mt-8 border-border/80">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Multiple customers
        </CardTitle>
        <CardDescription className="font-mono text-[9px]">
          {profiles.length} matches for &ldquo;{searchQuery}&rdquo; — pick one
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {profiles.map((p) => (
            <li key={p.email || p.phoneDigits}>
              <Link
                href={customerProfileHref(p)}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-mono text-sm">{p.displayName}</p>
                  {p.email ? (
                    <p className="font-mono text-xs text-muted-foreground">{p.email}</p>
                  ) : null}
                  {p.phone ? (
                    <p className="font-mono text-xs text-muted-foreground">{p.phone}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {p.bookingCount} job{p.bookingCount === 1 ? "" : "s"}
                  </Badge>
                  {p.lastBookingAt ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Last {formatCentralDate(p.lastBookingAt)}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
