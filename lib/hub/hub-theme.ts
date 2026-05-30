import type { CSSProperties } from "react";

/** Keys stored in profiles.hub_theme */
export type HubThemeKey =
  | "accent"
  | "accentBright"
  | "background"
  | "card"
  | "text"
  | "muted"
  | "border";

export type HubTheme = Partial<Record<HubThemeKey, string>>;

export const HUB_THEME_DEFAULTS: Record<HubThemeKey, string> = {
  accent: "#f0c93a",
  accentBright: "#ffe066",
  background: "#0e0e0e",
  card: "#111318",
  text: "#edeae0",
  muted: "#666666",
  border: "rgba(255, 255, 255, 0.07)",
};

export const HUB_THEME_ITEMS: {
  key: HubThemeKey;
  label: string;
  hint: string;
}[] = [
  {
    key: "accent",
    label: "Accent",
    hint: "Active nav, headings, primary buttons, highlights",
  },
  {
    key: "accentBright",
    label: "Accent bright",
    hint: "Hover states and brighter accents",
  },
  {
    key: "background",
    label: "Page background",
    hint: "Main hub content area behind pages",
  },
  {
    key: "card",
    label: "Sidebar & cards",
    hint: "Navigation panel, form panels, list cards",
  },
  {
    key: "text",
    label: "Primary text",
    hint: "Body copy and labels",
  },
  {
    key: "muted",
    label: "Muted text",
    hint: "Secondary labels and hints",
  },
  {
    key: "border",
    label: "Borders",
    hint: "Dividers and outlines (hex or rgba)",
  },
];

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const RGB_RE = /^rgba?\(\s*[\d.,\s%]+\s*\)$/;

export function isValidHubColor(value: string): boolean {
  const v = value.trim();
  return HEX_RE.test(v) || RGB_RE.test(v);
}

export function normalizeHubTheme(raw: unknown): HubTheme {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: HubTheme = {};
  for (const item of HUB_THEME_ITEMS) {
    const val = (raw as Record<string, unknown>)[item.key];
    if (typeof val === "string" && isValidHubColor(val)) {
      out[item.key] = val.trim();
    }
  }
  return out;
}

export function resolveHubTheme(theme: HubTheme): Record<HubThemeKey, string> {
  return { ...HUB_THEME_DEFAULTS, ...theme };
}

/** CSS variables for Tailwind tokens scoped to the hub shell */
export function hubThemeStyle(theme: HubTheme): CSSProperties {
  const resolved = resolveHubTheme(theme);
  return {
    "--color-y": resolved.accent,
    "--color-y2": resolved.accentBright,
    "--color-dk": resolved.background,
    "--color-bk": resolved.background,
    "--color-card": resolved.card,
    "--color-card2": resolved.card,
    "--color-text": resolved.text,
    "--color-muted": resolved.muted,
    "--color-border-faint": resolved.border,
    "--background": resolved.background,
    "--foreground": resolved.text,
    "--card": resolved.card,
    "--card-foreground": resolved.text,
    "--popover": resolved.card,
    "--popover-foreground": resolved.text,
    "--primary": resolved.accent,
    "--primary-foreground": "#080808",
    "--secondary": resolved.card,
    "--secondary-foreground": resolved.text,
    "--muted": resolved.card,
    "--muted-foreground": resolved.muted,
    "--accent": resolved.card,
    "--accent-foreground": resolved.text,
    "--border": resolved.border,
    "--input": resolved.border,
    "--ring": resolved.accent,
    "--sidebar": resolved.card,
    "--sidebar-foreground": resolved.text,
    "--sidebar-primary": resolved.accent,
    "--sidebar-primary-foreground": "#080808",
    "--sidebar-accent": resolved.card,
    "--sidebar-accent-foreground": resolved.text,
    "--sidebar-border": resolved.border,
    "--sidebar-ring": resolved.accent,
  } as CSSProperties;
}
