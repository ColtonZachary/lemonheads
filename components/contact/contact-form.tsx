"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitContact, type ContactState } from "@/lib/submit-contact";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FormRow,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/site-field";
import { Icon } from "@/components/ui/icons";

const INITIAL: ContactState = { status: "idle" };

const TOPICS = [
  "General question",
  "Book a service",
  "Membership inquiry",
  "Press / partnership",
  "Other",
];

export function ContactForm() {
  const [state, action] = useActionState(submitContact, INITIAL);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-y/30 bg-y/[0.04] p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-y/40 bg-y/[0.06] text-y">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <div className="font-display text-[36px] tracking-[0.04em] text-y">
          MESSAGE SENT
        </div>
        <p className="mt-3 text-sm text-text/60">
          Thanks — we&rsquo;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        defaultValue=""
        aria-hidden
      />

      <FormRow>
        <FieldGroup>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Jordan Smith" required />
          <FieldError errors={errors.name} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            required
          />
          <FieldError errors={errors.email} />
        </FieldGroup>
      </FormRow>

      <FormRow>
        <FieldGroup>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="(405) 555-0100" />
          <FieldError errors={errors.phone} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="topic">Topic</Label>
          <Select id="topic" name="topic" defaultValue="" required>
            <option value="" disabled>
              Select a topic…
            </option>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <FieldError errors={errors.topic} />
        </FieldGroup>
      </FormRow>

      <FieldGroup>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help?"
          required
          rows={6}
        />
        <FieldError errors={errors.message} />
      </FieldGroup>

      {state.status === "error" && (
        <p className="rounded-[4px] border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-xs tracking-[0.05em] text-red-300">
          ⚠ {state.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          We reply within 1 business day
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="font-mono text-[10px] text-red-400">{errors.join(" · ")}</p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send Message"}
      {!pending && <Icon name="arrowRight" className="h-3.5 w-3.5" />}
    </Button>
  );
}
