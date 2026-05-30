import { Section, SectionLabel, SectionTitle } from "@/components/ui/section";
import { Icon, type IconName } from "@/components/ui/icons";

const STEPS: { num: string; title: string; body: string; icon: IconName }[] = [
  {
    num: "01",
    title: "Book Online",
    body: "Schedule through our website or the Lemonheads app in minutes. Pick your date, time, and package.",
    icon: "phone",
  },
  {
    num: "02",
    title: "We Come to You",
    body: "Choose mobile at your home or office, or drop it off at our Edmond HQ. You relax.",
    icon: "car",
  },
  {
    num: "03",
    title: "Get Back on the Road",
    body: "Pay securely through the app or digital invoice. Drive away in a car that looks brand new.",
    icon: "star",
  },
];

export function HowItWorks() {
  return (
    <Section id="how" className="bg-dk">
      <SectionLabel>The Process</SectionLabel>
      <SectionTitle>HOW IT WORKS</SectionTitle>

      <div className="mt-14 grid gap-px bg-border-faint md:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.num}
            className="group relative overflow-hidden bg-bk p-9 transition-colors hover:bg-card2 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-y before:to-transparent before:transition-transform before:duration-500 hover:before:scale-x-100"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-4 right-5 font-display text-[96px] leading-none tracking-tight text-y/[0.05]"
            >
              {step.num}
            </span>
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md border border-y/15 bg-y/[0.08] text-y">
              <Icon name={step.icon} className="h-5 w-5" />
            </div>
            <h3 className="mb-3 font-display text-2xl tracking-[0.06em]">
              {step.title}
            </h3>
            <p className="text-[13px] leading-[1.8] text-text/45">{step.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
