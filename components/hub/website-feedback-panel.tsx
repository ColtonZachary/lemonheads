"use client";

import { useActionState } from "react";

import {
  deleteWebsiteFeedback,
  dismissWebsiteFeedback,
  markWebsiteFeedbackReviewed,
  type HubWebsiteFeedbackActionState,
} from "@/app/actions/hub-website-feedback";
import { Button } from "@/components/ui/button";
import {
  formatSiteExperienceRating,
  type WebsiteFeedbackRow,
  type WebsiteFeedbackStatus,
} from "@/lib/feedback/website-feedback";
import { cn } from "@/lib/utils";

const EMPTY: HubWebsiteFeedbackActionState = { ok: false, message: "" };

const statusStyles: Record<WebsiteFeedbackStatus, string> = {
  pending: "bg-y/10 text-y/80",
  reviewed: "bg-emerald-500/10 text-emerald-200",
  dismissed: "bg-white/10 text-text/45",
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
  const flashOk =
    reviewedState.ok || dismissState.ok || deleteState.ok;

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
      {flash && (
        <p
          className={cn(
            "font-mono text-[10px]",
            flashOk ? "text-y/70" : "text-red-300/90",
          )}
        >
          {flash}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {row.status === "pending" && (
          <>
            <form action={reviewedAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" size="sm" variant="primary">
                Mark reviewed
              </Button>
            </form>
            <form action={dismissAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" size="sm" variant="ghost">
                Dismiss
              </Button>
            </form>
          </>
        )}
        <form action={deleteAction}>
          <input type="hidden" name="id" value={row.id} />
          <Button type="submit" size="sm" variant="ghost" className="text-red-300/80">
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
    <article className="rounded-md border border-white/10 bg-dk/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-text/90">{row.submitter_name}</div>
          {row.submitter_email && (
            <div className="font-mono text-[10px] text-text/45">
              {row.submitter_email}
            </div>
          )}
        </div>
        <span
          className={cn(
            "rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
            statusStyles[row.status],
          )}
        >
          {row.status}
        </span>
      </div>

      <div className="mt-3 font-mono text-sm tracking-[0.15em] text-y">
        {formatSiteExperienceRating(row.rating)}
        <span className="ml-2 text-[10px] tracking-[0.1em] text-text/40">
          site experience
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text/75">{row.feedback_text}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-text/35">
        <span>Submitted {submitted}</span>
        {row.page_path && <span>Page {row.page_path}</span>}
        {row.reviewed_at && (
          <span>
            Handled{" "}
            {new Date(row.reviewed_at).toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </span>
        )}
      </div>

      <FeedbackActions row={row} />
    </article>
  );
}

export function WebsiteFeedbackPanel({ rows }: { rows: WebsiteFeedbackRow[] }) {
  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status === "reviewed");
  const dismissed = rows.filter((r) => r.status === "dismissed");

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y/70">
          New ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-text/40">No new website feedback.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {pending.map((r) => (
              <FeedbackCard key={r.id} row={r} />
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text/50">
            Reviewed ({reviewed.length})
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {reviewed.map((r) => (
              <FeedbackCard key={r.id} row={r} />
            ))}
          </div>
        </section>
      )}

      {dismissed.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text/40">
            Dismissed ({dismissed.length})
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {dismissed.map((r) => (
              <FeedbackCard key={r.id} row={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
