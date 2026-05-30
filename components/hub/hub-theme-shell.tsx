import type { ReactNode } from "react";

import { hubThemeStyle, type HubTheme } from "@/lib/hub/hub-theme";

export function HubThemeShell({
  theme,
  children,
}: {
  theme: HubTheme;
  children: ReactNode;
}) {
  return (
    <div
      className="hub-theme-root dark flex min-h-svh w-full flex-1 flex-col bg-background text-foreground"
      style={hubThemeStyle(theme)}
    >
      {children}
    </div>
  );
}
