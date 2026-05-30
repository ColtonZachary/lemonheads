import { HubPageHeader } from "@/components/hub/hub-page";

export function HubComingSoon({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <HubPageHeader
        title={title}
        description="Schema ready — UI in the next build phase"
      />
      <ul className="mt-8 list-inside list-disc space-y-2 font-mono text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
