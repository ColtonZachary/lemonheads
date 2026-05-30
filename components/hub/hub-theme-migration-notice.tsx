import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function HubThemeMigrationNotice() {
  return (
    <Alert className="mb-8 border-primary/30 bg-primary/5">
      <AlertTitle className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
        Database setup required
      </AlertTitle>
      <AlertDescription className="space-y-2 text-sm text-muted-foreground">
        <p>
          Hub colors need one more column on{" "}
          <code className="text-foreground/80">profiles</code>. In Supabase → SQL Editor,
          run:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {`alter table public.profiles
  add column if not exists hub_theme jsonb not null default '{}';`}
        </pre>
        <p className="text-xs">Then refresh this page. Saving colors will work after that.</p>
      </AlertDescription>
    </Alert>
  );
}
