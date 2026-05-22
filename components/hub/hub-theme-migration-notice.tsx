export function HubThemeMigrationNotice() {
  return (
    <div className="mb-8 rounded-md border border-y/30 bg-y/[0.06] px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-y">
        Database setup required
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text/60">
        Hub colors need one more column on <code className="text-text/80">profiles</code>.
        In Supabase → SQL Editor, run:
      </p>
      <pre className="mt-3 overflow-x-auto rounded border border-white/10 bg-dk p-3 font-mono text-[11px] leading-relaxed text-text/70">
        {`alter table public.profiles
  add column if not exists hub_theme jsonb not null default '{}';`}
      </pre>
      <p className="mt-2 text-xs text-text/45">
        Then refresh this page. Saving colors will work after that.
      </p>
    </div>
  );
}
