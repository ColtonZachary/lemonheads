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
} from "@/lib/hub/hub-theme";

const EMPTY: HubThemeActionState = { ok: false, message: "" };

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";
const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";

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
      <p className="mt-0.5 text-xs text-text/45">{item.hint}</p>
      <div className="mt-2 flex gap-2">
        {showPicker ? (
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(item.key, e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border border-white/15 bg-dk"
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
      className="overflow-hidden rounded-md border border-border-faint"
      style={style}
    >
      <div className="flex min-h-[140px]">
        <div className="w-[120px] border-r border-border-faint bg-card p-3">
          <div className="font-display text-sm tracking-[0.08em] text-y">HUB</div>
          <div className="mt-3 rounded bg-y/15 px-2 py-1 font-mono text-[9px] text-y">
            Active
          </div>
          <div className="mt-1 font-mono text-[9px] text-text/50">Link</div>
        </div>
        <div className="flex-1 bg-dk p-4">
          <div className="font-display text-2xl tracking-[0.04em] text-y">
            PREVIEW
          </div>
          <p className="mt-2 text-xs text-text/70">Primary text sample</p>
          <p className="font-mono text-[10px] text-muted">Muted label</p>
          <button
            type="button"
            className="mt-3 rounded bg-y px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black"
          >
            Button
          </button>
        </div>
      </div>
      <div className="border-t border-border-faint bg-card/80 px-3 py-2 font-mono text-[9px] text-text/40">
        Accent {resolved.accent} · Card {resolved.card}
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
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form action={saveAction} className="space-y-6">
        <p className="text-sm text-text/50">
          Colors apply only to your account in the Managers Hub. Other users
          keep their own settings.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {HUB_THEME_ITEMS.map((item) => (
            <ColorField
              key={item.key}
              item={item}
              value={draft[item.key] ?? HUB_THEME_DEFAULTS[item.key]}
              onChange={setColor}
            />
          ))}
        </div>

        {flash && (
          <p
            className={
              flashOk
                ? "font-mono text-xs text-y"
                : "font-mono text-xs text-red-200"
            }
          >
            {flash}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={savePending || !schemaReady}>
            {savePending ? "Saving…" : "Save colors"}
          </Button>
          <Button
            type="submit"
            formAction={resetAction}
            variant="outline"
            disabled={resetPending || !schemaReady}
          >
            {resetPending ? "Resetting…" : "Reset to defaults"}
          </Button>
        </div>
      </form>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className={labelClass}>Live preview</p>
        <div className="mt-3">
          <ThemePreview theme={mergedDraft} />
        </div>
      </div>
    </div>
  );
}
