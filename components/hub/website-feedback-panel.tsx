"use client";

import { useActionState } from "react";

import {
  deleteWebsiteFeedback,
  dismissWebsiteFeedback,
  markWebsiteFeedbackReviewed,
  type HubWebsiteFeedbackActionState,
} from "@/app/actions/hub-website-feedback";
import { HubActionAlert } from "@/components/hub/hub-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  formatSiteExperienceRating,
  type WebsiteFeedbackRow,
  type WebsiteFeedbackStatus,
} from "@/lib/feedback/website-feedback";

const EMPTY: HubWebsiteFeedbackActionState = { ok: false, message: "" };

const statusVariant: Record<
  WebsiteFeedbackStatus,
  "default" | "secondary" | "outline"
> = {
  pending: "default",
  reviewed: "secondary",
  dismissed: "outline",
};

function FeedbackActions({ row }: { row: WebsiteFeedbackRow }) {
  const [reviewedState, reviewedAction] = useActionState(
    markWebsiteFeedbackReviewed,
    EMPTY,
  );
  const [dismissState, dismissAction] = useActionState(dismissWebsiteFeedback, EMPTY);
  const [deleteState, deleteAction] = useActionState(deleteWebsiteFeedback, EMPTY);

  const flash =
    reviewedState.message || dismissState.message || deleteState.message;
  const flashOk = reviewedState.ok || dismissState.ok || deleteState.ok;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <HubActionAlert state={{ ok: flashOk, message: flash }} />
      <div className="flex flex-wrap gap-2">
        {row.status === "pending" && (
          <>
            <form action={reviewedAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" size="sm">
                Mark reviewed
              </Button>
            </form>
            <form action={dismissAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" size="sm" variant="outline">
                Dismiss
              </Button>
            </form>
          </>
        )}
        <form action={deleteAction}>
          <input type="hidden" name="id" value={row.id} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}

function FeedbackCard({ row }: { row: WebsiteFeedbackRow }) {
  const submitted = new Date(row.created_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="border-border/80 bg-card/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <p className="font-semibold text-foreground">{row.submitter_name}</p>
          {row.submitter_email ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              {row.submitter_email}
            </p>
          ) : null}
        </div>
        <Badge variant={statusVariant[row.status]} className="font-mono text-[9px] uppercase">
          {row.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-sm tracking-[0.12em] text-primary">
          {formatSiteExperienceRating(row.rating)}
          <span className="ml-2 text-[10px] tracking-[0.08em] text-muted-foreground">
            site experience
          </span>
        </p>

        <p className="text-sm leading-relaxed text-foreground/90">{row.feedback_text}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span>Submitted {submitted}</span>
          {row.page_path ? <span>Page {row.page_path}</span> : null}
          {row.reviewed_at ? (
            <span>
              Handled{" "}
              {new Date(row.reviewed_at).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </span>
          ) : null}
        </div>

        <FeedbackActions row={row} />
      </CardContent>
    </Card>
  );
}

function FeedbackSection({
  title,
  count,
  rows,
}: {
  title: string;
  count: number;
  rows: WebsiteFeedbackRow[];
}) {
  if (count === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
        {title} ({count})
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <FeedbackCard key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}

export function WebsiteFeedbackPanel({ rows }: { rows: WebsiteFeedbackRow[] }) {
  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status === "reviewed");
  const dismissed = rows.filter((r) => r.status === "dismissed");

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          New ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No new website feedback.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {pending.map((r) => (
              <FeedbackCard key={r.id} row={r} />
            ))}
          </div>
        )}
      </section>

      <FeedbackSection title="Reviewed" count={reviewed.length} rows={reviewed} />
      <FeedbackSection title="Dismissed" count={dismissed.length} rows={dismissed} />
    </div>
  );
}
