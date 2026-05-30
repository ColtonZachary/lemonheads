"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  removeBookingLoyaltyReward,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

export function BookingLoyaltyRewardRemove({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    removeBookingLoyaltyReward.bind(null, bookingId),
    EMPTY,
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={(e) => {
            if (
              !confirm(
                "Remove this reward from the booking? Points will be refunded and the price will update.",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          {pending ? "Removing…" : "Remove reward"}
        </Button>
      </form>
      {state.message ? (
        <Alert variant={state.ok ? "default" : "destructive"} className="max-w-xs py-2">
          <AlertDescription className="font-mono text-[10px]">
            {state.message}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
