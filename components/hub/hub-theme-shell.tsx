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
      className="hub-theme-root flex min-h-[100svh] w-full bg-dk text-text"
      style={hubThemeStyle(theme)}
    >
      {children}
    </div>
  );
}
