"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitWebsiteFeedback,
  type WebsiteFeedbackSubmitState,
} from "@/lib/submit-website-feedback";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FormRow,
  Input,
  Label,
  Textarea,
} from "@/components/ui/site-field";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const INITIAL: WebsiteFeedbackSubmitState = { status: "idle" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.[0]) return null;
  return <p className="mt-1 font-mono text-[10px] text-red-300/90">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending…" : "Send feedback"}
      {!pending && <Icon name="arrowRight" className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function WebsiteFeedbackForm() {
  const pathname = usePathname();
  const [state, action] = useActionState(submitWebsiteFeedback, INITIAL);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-y/30 bg-y/[0.04] p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-y/40 bg-y/[0.06] text-y">
          <Icon name="check" className="h-6 w-6" />
        </div>
        <div className="font-display text-3xl tracking-[0.04em] text-y sm:text-4xl">
          THANK YOU
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text/60">
          Your feedback helps us improve the site. We read every submission.
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="page" value={pathname} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        defaultValue=""
        aria-hidden
      />

      {state.status === "error" && state.message && (
        <p className="rounded border border-red-500/30 bg-red-500/[0.06] px-4 py-3 font-mono text-xs text-red-200/90">
          {state.message}
        </p>
      )}

      <FormRow>
        <FieldGroup>
          <Label htmlFor="feedback-name">Your name</Label>
          <Input
            id="feedback-name"
            name="name"
            placeholder="Jordan Smith"
            required
            autoComplete="name"
          />
          <FieldError errors={errors.name} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="feedback-email">Email (optional)</Label>
          <Input
            id="feedback-email"
            name="email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
          />
          <FieldError errors={errors.email} />
        </FieldGroup>
      </FormRow>

      <FieldGroup>
        <Label htmlFor="feedback-rating">How was the website to use?</Label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="feedback-rating"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs transition-colors",
                "has-[:checked]:border-y/40 has-[:checked]:bg-y/10 has-[:checked]:text-y",
              )}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                defaultChecked={value === 5}
                className="sr-only"
                required
              />
              <span className="tracking-[0.2em] text-y">{"★".repeat(value)}</span>
              <span className="text-text/50">{value}</span>
            </label>
          ))}
        </div>
        <FieldError errors={errors.rating} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="feedback-text">Your feedback</Label>
        <Textarea
          id="feedback-text"
          name="feedback"
          rows={5}
          placeholder="What worked well? What was confusing? Anything we should add or fix on the site?"
          required
        />
        <FieldError errors={errors.feedback} />
      </FieldGroup>

      <SubmitButton />
    </form>
  );
}
