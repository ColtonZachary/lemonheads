export function HubComingSoon({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">{title}</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Schema ready — UI in the next build phase
      </p>
      <ul className="mt-8 list-inside list-disc space-y-2 font-mono text-sm text-text/55">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
