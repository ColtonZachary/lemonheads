import type { Metadata } from "next";

import { WebsiteFeedbackForm } from "@/components/feedback/website-feedback-form";
import { SectionLabel } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Website Feedback",
  description:
    "Tell Lemonhead's Mobile Detail how we can improve this website — booking flow, navigation, and overall experience.",
};

export default function FeedbackPage() {
  return (
    <>
      <header className="px-[5%] pb-12 pt-20 text-center">
        <SectionLabel centered>Help Us Improve</SectionLabel>
        <h1 className="mt-4 font-display text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[0.02em]">
          WEBSITE <span className="text-y">FEEDBACK</span>
        </h1>
        <p className="mx-auto mt-3.5 max-w-lg font-mono text-[13px] leading-relaxed tracking-[0.08em] text-text/40">
          This is about the site itself — not your detail appointment. Tell us
          what was easy, confusing, or missing so we can make booking and
          browsing better.
        </p>
      </header>

      <div className="mx-auto max-w-[640px] px-[5%] pb-24">
        <WebsiteFeedbackForm />
        <p className="mt-8 text-center font-mono text-[10px] leading-relaxed tracking-[0.06em] text-text/35">
          For service questions or to book a detail, use{" "}
          <a href="/contact" className="text-y/70 hover:text-y">
            Contact
          </a>{" "}
          or{" "}
          <a href="/book" className="text-y/70 hover:text-y">
            Book Now
          </a>
          .
        </p>
      </div>
    </>
  );
}
