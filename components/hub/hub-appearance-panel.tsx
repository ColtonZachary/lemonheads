"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  resetHubTheme,
  saveHubTheme,
  type HubThemeActionState,
} from "@/app/actions/hub-theme";
import { Button } from "@/components/ui/button";
import {
  HUB_THEME_DEFAULTS,
  HUB_THEME_ITEMS,
  hubThemeStyle,
  resolveHubTheme,
  type HubTheme,
  type HubThemeKey,
} from "@/lib/hub/hub-theme";
import { cn } from "@/lib/utils";

const EMPTY: HubThemeActionState = { ok: false, message: "" };

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";
const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2 py-1.5 font-mono text-xs";

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
    <label className="block">
      <span className={labelClass}>{item.label}</span>
      <div className="mt-1 flex gap-1.5">
        {showPicker ? (
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(item.key, e.target.value)}
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-white/15 bg-dk"
            aria-label={`${item.label} picker`}
          />
        ) : null}
        <input
          name={item.key}
          type="text"
          value={value}
          onChange={(e) => onChange(item.key, e.target.value)}
          placeholder={HUB_THEME_DEFAULTS[item.key]}
          className={fieldClass}
        />
      </div>
    </label>
  );
}

function ThemePreview({ theme }: { theme: HubTheme }) {
  const resolved = resolveHubTheme(theme);
  const style = hubThemeStyle(theme);

  return (
    <div
      className="overflow-hidden rounded-lg border border-border-faint"
      style={style}
    >
      <div className="flex min-h-[100px]">
        <div className="w-[88px] border-r border-border-faint bg-card p-2">
          <div className="font-display text-xs tracking-[0.08em] text-y">HUB</div>
          <div className="mt-2 rounded bg-y/15 px-1.5 py-0.5 font-mono text-[8px] text-y">
            Nav
          </div>
        </div>
        <div className="flex-1 bg-dk p-3">
          <div className="font-display text-lg tracking-[0.04em] text-y">Preview</div>
          <p className="mt-1 text-[10px] text-text/70">Body text</p>
          <button
            type="button"
            className="mt-2 rounded bg-y px-2 py-1 font-mono text-[9px] font-bold uppercase text-black"
          >
            Button
          </button>
        </div>
      </div>
      <div className="border-t border-border-faint bg-card/80 px-2 py-1 font-mono text-[8px] text-text/40">
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
      <p className="text-sm text-text/45">
        Colors apply only to your hub login — other users keep their own theme.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <form action={saveAction} className="space-y-3">
          {COLOR_GROUPS.map((group) => (
            <details
              key={group.title}
              className="rounded-lg border border-white/10 bg-card/30"
              open={group.title === "Accent"}
            >
              <summary className="cursor-pointer list-none px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text/50 hover:text-y [&::-webkit-details-marker]:hidden">
                {group.title}
              </summary>
              <div className="grid gap-3 border-t border-white/10 p-3 sm:grid-cols-2">
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
              </div>
            </details>
          ))}

          {flash ? (
            <p
              className={cn(
                "font-mono text-[10px]",
                flashOk ? "text-y" : "text-red-200",
              )}
            >
              {flash}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              className="h-auto min-h-0 px-4 py-2 text-xs"
              disabled={savePending || !schemaReady}
            >
              {savePending ? "Saving…" : "Save colors"}
            </Button>
            <Button
              type="submit"
              formAction={resetAction}
              variant="outline"
              className="h-auto min-h-0 px-4 py-2 text-xs"
              disabled={resetPending || !schemaReady}
            >
              {resetPending ? "…" : "Reset defaults"}
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className={labelClass}>Preview</p>
          <div className="mt-2">
            <ThemePreview theme={mergedDraft} />
          </div>
        </div>
      </div>
    </div>
  );
}
