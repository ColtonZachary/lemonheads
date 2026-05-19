import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { REVIEWS } from "@/lib/data";

export function Reviews() {
  return (
    <Section id="reviews">
      <SectionLabel>What People Say</SectionLabel>
      <SectionTitle>CUSTOMER REVIEWS</SectionTitle>

      <div className="mt-14 grid gap-px bg-border-faint sm:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <article
            key={review.name}
            className="bg-bk p-9 transition-colors hover:bg-card"
          >
            <div className="mb-5 flex gap-0.5 text-[13px] tracking-[3px] text-y">
              {"★★★★★"}
            </div>
            <blockquote className="mb-7 text-sm italic leading-[1.8] text-text/70">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-y/20 bg-y/10 font-mono text-[11px] font-bold text-y">
                {review.initials}
              </div>
              <div>
                <div className="text-[13px] font-bold tracking-[0.05em]">
                  {review.name}
                </div>
                <div className="font-mono text-[10px] tracking-[0.1em] text-muted">
                  {review.location}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
