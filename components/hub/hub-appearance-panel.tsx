"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  resetHubTheme,
  saveHubTheme,
  type HubThemeActionState,
} from "@/app/actions/hub-theme";
import { HubActionAlert } from "@/components/hub/hub-page";
import { HubFormField, HubInput } from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HUB_THEME_DEFAULTS,
  HUB_THEME_ITEMS,
  hubThemeStyle,
  resolveHubTheme,
  type HubTheme,
  type HubThemeKey,
} from "@/lib/hub/hub-theme";
const EMPTY: HubThemeActionState = { ok: false, message: "" };

const COLOR_GROUPS: { title: string; keys: HubThemeKey[] }[] = [
  { title: "Accent", keys: ["accent", "accentBright"] },
  { title: "Surfaces", keys: ["background", "card", "border"] },
  { title: "Text", keys: ["text", "muted"] },
];

function ColorField({
  item,
  value,
  onChange,
}: {
  item: (typeof HUB_THEME_ITEMS)[number];
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const showPicker = item.key !== "border";
  const pickerValue = value.startsWith("#") ? value : HUB_THEME_DEFAULTS[item.key];

  return (
    <HubFormField label={item.label} htmlFor={`theme-${item.key}`}>
      <div className="flex gap-1.5">
        {showPicker ? (
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(item.key, e.target.value)}
            className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-muted/30"
            aria-label={`${item.label} picker`}
          />
        ) : null}
        <HubInput
          id={`theme-${item.key}`}
          name={item.key}
          type="text"
          value={value}
          onChange={(e) => onChange(item.key, e.target.value)}
          placeholder={HUB_THEME_DEFAULTS[item.key]}
          className="flex-1"
        />
      </div>
    </HubFormField>
  );
}

function ThemePreview({ theme }: { theme: HubTheme }) {
  const resolved = resolveHubTheme(theme);
  const style = hubThemeStyle(theme);

  return (
    <div
      className="overflow-hidden rounded-lg border border-border"
      style={style}
    >
      <div className="flex min-h-[100px]">
        <div className="w-[88px] border-r border-border bg-card p-2">
          <div className="font-display text-xs tracking-[0.08em] text-[var(--hub-accent,#f5e642)]">
            HUB
          </div>
          <div className="mt-2 rounded bg-[var(--hub-accent,#f5e642)]/15 px-1.5 py-0.5 font-mono text-[8px] text-[var(--hub-accent,#f5e642)]">
            Nav
          </div>
        </div>
        <div className="flex-1 bg-[var(--hub-bg,#0a0a0a)] p-3">
          <div className="font-display text-lg tracking-[0.04em] text-[var(--hub-accent,#f5e642)]">
            Preview
          </div>
          <p className="mt-1 text-[10px] text-[var(--hub-text,#e8e8e8)]/70">Body text</p>
          <button
            type="button"
            className="mt-2 rounded bg-[var(--hub-accent,#f5e642)] px-2 py-1 font-mono text-[9px] font-bold uppercase text-black"
          >
            Button
          </button>
        </div>
      </div>
      <div className="border-t border-border bg-card/80 px-2 py-1 font-mono text-[8px] text-muted-foreground">
        {resolved.accent} · {resolved.card}
      </div>
    </div>
  );
}

export function HubAppearancePanel({
  savedTheme,
  schemaReady = true,
}: {
  savedTheme: HubTheme;
  schemaReady?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<HubTheme>(() => ({
    ...resolveHubTheme(savedTheme),
  }));
  const [saveState, saveAction, savePending] = useActionState(saveHubTheme, EMPTY);
  const [resetState, resetAction, resetPending] = useActionState(
    resetHubTheme,
    EMPTY,
  );

  const itemByKey = useMemo(
    () => new Map(HUB_THEME_ITEMS.map((i) => [i.key, i])),
    [],
  );

  const mergedDraft = useMemo(() => {
    const next: HubTheme = {};
    for (const item of HUB_THEME_ITEMS) {
      const v = draft[item.key];
      if (v && v !== HUB_THEME_DEFAULTS[item.key]) {
        next[item.key] = v;
      }
    }
    return next;
  }, [draft]);

  function setColor(key: string, value: string) {
    setDraft((prev) => ({
      ...prev,
      [key as keyof HubTheme]: value,
    }));
  }

  useEffect(() => {
    if (resetState.ok) {
      setDraft({ ...HUB_THEME_DEFAULTS });
      router.refresh();
    }
  }, [resetState.ok, router]);

  useEffect(() => {
    if (saveState.ok) {
      router.refresh();
    }
  }, [saveState.ok, router]);

  const flash = saveState.message || resetState.message;
  const flashOk = saveState.ok || resetState.ok;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Colors apply only to your hub login — other users keep their own theme.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <form action={saveAction} className="space-y-3">
          {COLOR_GROUPS.map((group) => (
            <Card key={group.title} className="border-border/80 bg-card/40">
              <CardHeader className="py-3">
                <CardTitle className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                {group.keys.map((key) => {
                  const item = itemByKey.get(key)!;
                  return (
                    <ColorField
                      key={key}
                      item={item}
                      value={draft[key] ?? HUB_THEME_DEFAULTS[key]}
                      onChange={setColor}
                    />
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <HubActionAlert state={{ ok: flashOk, message: flash }} />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={savePending || !schemaReady}>
              {savePending ? "Saving…" : "Save colors"}
            </Button>
            <Button
              type="submit"
              formAction={resetAction}
              variant="outline"
              size="sm"
              disabled={resetPending || !schemaReady}
            >
              {resetPending ? "…" : "Reset defaults"}
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            Preview
          </p>
          <div className="mt-2">
            <ThemePreview theme={mergedDraft} />
          </div>
        </div>
      </div>
    </div>
  );
}
